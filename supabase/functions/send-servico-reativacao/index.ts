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
const STUDIO_URL = "https://wa.me/5598991722040?text=Oi%2C+quero+retomar+a+conversa+sobre+uma+campanha";

const divider = `
              <tr>
                <td style="padding:36px 24px;" align="center">
                  <div style="width:80px;height:1px;background:rgba(201,169,110,0.4);"></div>
                </td>
              </tr>`;

const buildHtml = (name: string, leadId: string) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Pensamos na sua marca esta semana</title>
  </head>
  <body style="margin:0;padding:0;background:#fafaf7;font-family:Raleway,Arial,sans-serif;color:#1a1a1a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
      Sem pressão. Só uma observação honesta.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:48px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fafaf7;">

          <tr><td style="padding:0 24px 24px 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0;">${name || "Olá"},</p>
          </td></tr>

          <tr><td style="padding:0 24px;">
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Faz alguns dias desde nossa primeira mensagem. Imagino que outras prioridades surgiram — entre operação, vendas e cliente, projeto visual quase sempre fica para depois.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Não é cobrança. É só um lembrete antes de seguirmos.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Uma observação honesta.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Marcas que adiam construção visual deixam dinheiro na mesa. Não é frase de venda — é o que vemos repetir.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              No ponto de decisão do cliente, a percepção de valor é quase inteiramente visual. Produto bom com imagem fraca vende menos do que produto médio com imagem certa. Isso vale para qualquer ticket, qualquer nicho.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Se quiser retomar a conversa, é só clicar abaixo. Sem pressão, sem call de venda.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;margin:0;">
              <a href="${STUDIO_URL}" style="color:#C9A96E;text-decoration:none;border-bottom:1px solid rgba(201,169,110,0.4);">
                → Retomar a conversa com o estúdio
              </a>
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px 48px 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-style:italic;font-size:15px;line-height:1.8;color:#1a1a1a;margin:0;">
              Com intenção,<br/>Estúdio Velora<br/>Direção criativa com inteligência artificial
            </p>
          </td></tr>
      <tr><td style="padding:0 24px 32px 24px;text-align:center;">
        <p style="font-family:Raleway,Arial,sans-serif;font-size:11px;color:#999999;margin:0;">
          <a href="https://estudiovelora.lovable.app/email-preferences/unsubscribe?id=${leadId}" style="color:#C9A96E;text-decoration:none;">Cancelar inscrição</a>
        </p>
      </td></tr>


        </table>
      </td></tr>
    </table>
  </body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const idempotencyKey = String(body.idempotency_key || "").trim().slice(0, 120);
    const leadId = String(body.lead_id || "").trim().slice(0, 64);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST", headers,
      body: JSON.stringify({
        from: FROM, to: [email],
        subject: "Pensamos na sua marca esta semana.",
        html: buildHtml(name, leadId),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend error:", response.status, data);
      return new Response(JSON.stringify({ error: data?.message || "send failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-servico-reativacao error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
