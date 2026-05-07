import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { adminPassword, conversationId, content } = await req.json();
    if (!adminPassword || adminPassword !== Deno.env.get("ADMIN_PASSWORD")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!conversationId || !content?.trim()) {
      return new Response(JSON.stringify({ error: "Missing conversationId or content" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) throw new Error("Twilio credentials not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id, whatsapp_number, handoff_status")
      .eq("id", conversationId)
      .single();
    if (convErr || !conv) throw new Error("Conversa não encontrada");

    // Send via Twilio
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+17403135891";
    const toWhatsapp = conv.whatsapp_number.startsWith("whatsapp:")
      ? conv.whatsapp_number : `whatsapp:${conv.whatsapp_number}`;

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: toWhatsapp, From: fromNumber, Body: content }),
    });
    const twData = await tw.json();
    if (!tw.ok) throw new Error(`Twilio error [${tw.status}]: ${JSON.stringify(twData)}`);

    // Save message
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content,
      message_type: "ceo",
      twilio_sid: twData.sid,
    });

    // Auto-promove handoff_status: pending → active quando o CEO responde
    const newStatus = conv.handoff_status === "ceo_pending" ? "ceo_active" : conv.handoff_status;
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        handoff_status: newStatus,
        handoff_at: conv.handoff_status === "ceo_pending" ? new Date().toISOString() : undefined,
      })
      .eq("id", conversationId);

    return new Response(JSON.stringify({ success: true, sid: twData.sid }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("conversation-send-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
