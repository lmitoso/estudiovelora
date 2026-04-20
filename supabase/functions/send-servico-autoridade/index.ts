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
const STUDIO_URL = "https://estudiovelora.lovable.app";

const divider = `
              <tr>
                <td style="padding:36px 24px;" align="center">
                  <div style="width:80px;height:1px;background:rgba(201,169,110,0.4);"></div>
                </td>
              </tr>`;

const buildHtml = (name: string) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Por que marcas inteligentes já estão usando IA para criar campanhas</title>
  </head>
  <body style="margin:0;padding:0;background:#fafaf7;font-family:Raleway,Arial,sans-serif;color:#1a1a1a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
      Não é tendência. É vantagem competitiva real.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:48px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fafaf7;">

          <tr><td style="padding:0 24px 24px 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0;">${name || "Olá"},</p>
          </td></tr>

          <tr><td style="padding:0 24px;">
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              IA aplicada a campanhas não é tendência passageira. É solução para três problemas concretos que toda marca de produto físico enfrenta hoje.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Custo.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Produção tradicional pede modelo, locação, fotógrafo, equipe, edição. O ticket de uma campanha bem-feita parte de cinco dígitos. Com IA + direção artística, o mesmo padrão estético sai por uma fração disso — e sem sacrificar identidade.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Tempo.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Da aprovação do briefing à entrega final, produção tradicional leva semanas. Aqui, o ciclo cai para dias. Lançamento em data comemorativa deixa de ser corrida contra o relógio.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              Volume.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Cada coleção pode ter sua própria campanha — sem refazer produção do zero. Marcas que antes faziam um editorial por ano agora podem fazer um por lançamento, mantendo coerência visual ao longo do calendário.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
              O que diferencia o estúdio.
            </p>
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
              Tecnologia, qualquer agência terá em alguns meses. O que não se replica é o olhar editorial: saber escolher referência, decidir paleta, traduzir a sensação certa. É nesse ponto que a Velora atua.
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px;">
            <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;margin:0;">
              <a href="${STUDIO_URL}" style="color:#C9A96E;text-decoration:none;border-bottom:1px solid rgba(201,169,110,0.4);">
                → Quero conhecer o processo da Velora
              </a>
            </p>
          </td></tr>

          ${divider}

          <tr><td style="padding:0 24px 48px 24px;">
            <p style="font-family:Georgia,'Cormorant Garamond',serif;font-style:italic;font-size:15px;line-height:1.8;color:#1a1a1a;margin:0;">
              Com intenção,<br/>Estúdio Velora<br/>Direção criativa com inteligência artificial
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
        subject: "Por que marcas inteligentes já estão usando IA para criar campanhas.",
        html: buildHtml(name),
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
    console.error("send-servico-autoridade error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
