import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate service role auth
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (token !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    // Fetch completed generations
    const { data: generations } = await supabase
      .from("generations")
      .select("type, output_url, status")
      .eq("order_id", orderId)
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    const completedGens = generations || [];
    if (completedGens.length === 0) {
      console.log("No completed generations to send");
      return new Response(JSON.stringify({ success: false, reason: "no_content" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build content link
    const siteUrl = Deno.env.get("SITE_URL") || "https://instant-editorial-ai.lovable.app";
    const contentLink = `${siteUrl}/order/${orderId}`;

    const imageCount = completedGens.filter((g) => g.type === "image").length;
    const videoCount = completedGens.filter((g) => g.type === "video").length;

    let contentSummary = "";
    if (imageCount > 0) contentSummary += `${imageCount} foto${imageCount > 1 ? "s" : ""} editorial${imageCount > 1 ? "is" : ""}`;
    if (videoCount > 0) {
      if (contentSummary) contentSummary += " e ";
      contentSummary += `${videoCount} vídeo${videoCount > 1 ? "s" : ""}`;
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#080808;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 32px 24px;text-align:center;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:300;letter-spacing:6px;color:#d4a96a;">VELORA</h1>
              <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#d4a96a80,transparent);margin:16px auto 0;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 32px;">
              <h2 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#ede6d6;">
                Seu conteúdo está pronto!
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#8a7d6b;line-height:1.6;">
                ${order.customer_name ? `Olá ${order.customer_name}, o` : "O"} material editorial para <strong style="color:#ede6d6;">${order.brand_name}</strong> foi gerado com sucesso. São ${contentSummary} em alta resolução, prontos para uso.
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${contentLink}" target="_blank" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d4a96a,#8a6d3b);border-radius:8px;font-size:13px;font-weight:500;color:#080808;text-decoration:none;letter-spacing:2px;text-transform:uppercase;">
                      Ver e Baixar Conteúdo
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Info -->
              <div style="border:1px solid #1f1f1f;border-radius:8px;padding:16px;">
                <p style="margin:0;font-size:12px;color:#8a7d6b;line-height:1.6;">
                  📧 Este link é exclusivo para seu pedido.<br>
                  💾 Recomendamos baixar os arquivos assim que possível.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1f1f1f;text-align:center;">
              <a href="https://www.instagram.com/velora.direction/" target="_blank" style="font-size:11px;color:#d4a96a;text-decoration:none;letter-spacing:1px;">
                @velora.direction
              </a>
              <p style="margin:8px 0 0;font-size:10px;color:#555;letter-spacing:1px;">
                STUDIO VELORA — CONTEÚDO EDITORIAL COM IA
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${Deno.env.get("RESEND_FROM_NAME") || "Estúdio Velora"} <${Deno.env.get("RESEND_FROM_EMAIL") || "contato@estudiovelora.net"}>`,
        to: [order.email],
        subject: `✨ Seu conteúdo editorial está pronto — ${order.brand_name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`Resend API error [${resendResponse.status}]: ${JSON.stringify(resendData)}`);
    }

    console.log(`Email sent successfully to ${order.email} for order ${orderId}`);

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-delivery-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
