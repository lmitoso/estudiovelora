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
    <title>O método. Em 3 dias. Do zero.</title>
  </head>
  <body style="margin:0;padding:0;background:#fafaf7;font-family:Raleway,Arial,sans-serif;color:#1a1a1a;">
    <!-- Pré-header oculto -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;visibility:hidden;mso-hide:all;">
      Não é sobre ferramentas. É sobre intenção.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fafaf7;">

            <!-- Saudação -->
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <p style="font-family:Georgia,'Cormorant Garamond',serif;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0;">
                  ${name || "Olá"},
                </p>
              </td>
            </tr>

            <!-- Abertura -->
            <tr>
              <td style="padding:0 24px;">
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
                  Ontem você pediu o mini-método. Aqui está.
                </p>
              </td>
            </tr>

            ${divider}

            <!-- DIA 1 -->
            <tr>
              <td style="padding:0 24px;">
                <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  DIA 1 — Intenção antes de imagem
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  Antes de abrir qualquer ferramenta de IA, você precisa responder três perguntas: Para quem é essa campanha? O que ela precisa fazer sentir? Que referência visual traduz isso?
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  A maioria das pessoas pula essa etapa e vai direto para o prompt. O resultado é sempre genérico — porque a IA só é tão específica quanto a instrução que recebe.
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
                  Dedique 30 minutos do primeiro dia só a isso. Escreva as respostas. Salve referências no Pinterest ou no seu celular. Esse é o seu briefing — e ele vale mais do que qualquer ferramenta.
                </p>
              </td>
            </tr>

            ${divider}

            <!-- DIA 2 -->
            <tr>
              <td style="padding:0 24px;">
                <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  DIA 2 — Construção com direção
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  Com o briefing em mãos, você entra nas ferramentas com intenção. O processo que usamos no estúdio tem três camadas:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                  <tr>
                    <td style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;padding:0 0 8px 0;">
                      <span style="color:#C9A96E;">→</span>&nbsp;<strong>Geração</strong> — criar as primeiras imagens a partir do briefing, testando variações de luz, paleta e composição.
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;padding:0 0 8px 0;">
                      <span style="color:#C9A96E;">→</span>&nbsp;<strong>Curadoria</strong> — selecionar com olhar editorial. Não o que ficou bonito. O que ficou verdadeiro para a marca.
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;padding:0;">
                      <span style="color:#C9A96E;">→</span>&nbsp;<strong>Refinamento</strong> — ajustar o que a IA não acertou sozinha. Proporção, atmosfera, coerência entre os frames.
                    </td>
                  </tr>
                </table>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
                  Esse é o trabalho que diferencia um criativo de IA de um diretor de arte com IA.
                </p>
              </td>
            </tr>

            ${divider}

            <!-- DIA 3 -->
            <tr>
              <td style="padding:0 24px;">
                <p style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:700;font-size:18px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  DIA 3 — Entrega com narrativa
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  Uma campanha não é uma coleção de imagens bonitas. É uma história contada em frames.
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 16px;">
                  No terceiro dia, você organiza o material em sequência narrativa — começo, meio, fim visual. Pensa na legenda, no tom, no que cada imagem comunica sozinha e o que ela comunica em conjunto.
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0;">
                  Quando isso está alinhado, você tem uma campanha. Não um feed.
                </p>
              </td>
            </tr>

            ${divider}

            <!-- Fechamento -->
            <tr>
              <td style="padding:0 24px;">
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 24px;">
                  Esse método é o que ensinamos com profundidade no curso completo — com exemplos reais, prompts testados e direção artística passo a passo.
                </p>
                <p style="font-family:Raleway,Arial,sans-serif;font-size:16px;line-height:1.8;margin:0;">
                  <a href="https://pay.kiwify.com.br/G0oqvsb" style="color:#C9A96E;text-decoration:none;border-bottom:1px solid rgba(201,169,110,0.4);">
                    → Conhecer o curso completo
                  </a>
                </p>
              </td>
            </tr>

            ${divider}

            <!-- Assinatura -->
            <tr>
              <td style="padding:0 24px 48px 24px;">
                <p style="font-family:Georgia,'Cormorant Garamond',serif;font-style:italic;font-size:15px;line-height:1.8;color:#1a1a1a;margin:0;">
                  Com intenção,<br/>
                  Estúdio Velora<br/>
                  Direção criativa com inteligência artificial
                </p>
              </td>
            </tr>

            <!-- Unsubscribe -->
            <tr>
              <td style="padding:0 24px 32px 24px;text-align:center;">
                <p style="font-family:Raleway,Arial,sans-serif;font-size:11px;color:#999999;margin:0;">
                  <a href="https://estudiovelora.lovable.app/email-preferences/unsubscribe?id=${leadId}" style="color:#C9A96E;text-decoration:none;">Cancelar inscrição</a>
                </p>
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
    const leadId = String(body.lead_id || "").trim().slice(0, 64);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      method: "POST",
      headers,
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "O método. Em 3 dias. Do zero.",
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
    console.error("send-aprender-metodo error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
