import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_URL = "https://api.resend.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "contato@estudiovelora.net";
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Estúdio Velora";
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

const buildHtml = (name: string, leadId: string) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Mini-método Velora</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,'Cormorant Garamond',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 24px 32px 24px;text-align:center;">
                <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:#C9A96E;margin:0 0 24px;">
                  Estúdio Velora
                </p>
                <div style="width:48px;height:1px;background:#C9A96E;margin:0 auto 32px;"></div>
                <h1 style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:300;font-size:34px;line-height:1.15;color:#080808;margin:0 0 24px;">
                  Bem-vinda ao Velora,<br/>${name || "criadora"}.
                </h1>
                <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#3a3a3a;margin:0 0 16px;">
                  Aqui começa outra forma de criar. O mini-método que prometemos chega
                  nos próximos minutos — em três partes, ao longo de três dias.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 24px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececec;border-radius:6px;">
                  <tr>
                    <td style="padding:32px 28px;">
                      <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C9A96E;margin:0 0 16px;">
                        O que você vai receber
                      </p>
                      <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;margin:0 0 12px;">
                        <strong style="color:#080808;">Dia 1.</strong> O processo completo, em três etapas.
                      </p>
                      <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;margin:0 0 12px;">
                        <strong style="color:#080808;">Dia 2.</strong> Como escolher as ferramentas certas.
                      </p>
                      <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a1a;margin:0;">
                        <strong style="color:#080808;">Dia 3.</strong> Como aplicar ao seu nicho ou marca.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 24px 0 24px;text-align:center;">
                <a href="https://pay.kiwify.com.br/G0oqvsb"
                  style="display:inline-block;background:#080808;color:#ffffff;text-decoration:none;
                  font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;
                  padding:16px 32px;border-radius:4px;">
                  Conhecer o método completo
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:48px 24px 0 24px;text-align:center;">
                <div style="width:48px;height:1px;background:#C9A96E;margin:0 auto 24px;"></div>
                <p style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#7a7a7a;margin:0 0 8px;">
                  Estúdio Velora — criação visual com intenção.
                </p>
                <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#999999;margin:0;">
                  Você está recebendo este email porque se cadastrou para receber o mini-método.
                </p>
                <p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#999999;margin:12px 0 0;"><a href="https://estudiovelora.lovable.app/email-preferences/unsubscribe?id=${leadId}" style="color:#C9A96E;text-decoration:none;">Cancelar inscrição</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const idempotencyKey = String(body.idempotency_key || "").trim().slice(0, 120);
    const leadId = String(body.lead_id || "").trim().slice(0, 64);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const response = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "O mini-método chega nos próximos minutos",
        html: buildHtml(name, leadId),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend error:", response.status, data);
      return new Response(JSON.stringify({ error: data?.message || "send failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-aprender-welcome error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
