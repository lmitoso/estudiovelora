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
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TEMPLATE_SID = Deno.env.get("TWILIO_FOLLOWUP_TEMPLATE_SID");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY not configured");
    if (!TEMPLATE_SID) throw new Error("TWILIO_FOLLOWUP_TEMPLATE_SID not configured");

    const { adminPassword, conversationId } = await req.json();
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id, whatsapp_number, last_followup_at, leads(name)")
      .eq("id", conversationId)
      .single();
    if (convErr || !conv) throw new Error("Conversation not found");

    // Throttle 24h
    if (conv.last_followup_at) {
      const elapsed = Date.now() - new Date(conv.last_followup_at).getTime();
      if (elapsed < 24 * 60 * 60 * 1000) {
        return new Response(
          JSON.stringify({ error: "Follow-up já enviado nas últimas 24h", last_followup_at: conv.last_followup_at }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const leadName: string = (conv as any).leads?.name || "tudo bem";
    const firstName = leadName.trim().split(/\s+/)[0];

    const toWhatsapp = conv.whatsapp_number.startsWith("whatsapp:")
      ? conv.whatsapp_number
      : `whatsapp:${conv.whatsapp_number}`;
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+17403135891";

    const params = new URLSearchParams({
      To: toWhatsapp,
      From: fromNumber,
      ContentSid: TEMPLATE_SID,
      ContentVariables: JSON.stringify({ "1": firstName }),
    });

    const tw = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const twData = await tw.json();
    if (!tw.ok) throw new Error(`Twilio error [${tw.status}]: ${JSON.stringify(twData)}`);

    const now = new Date().toISOString();
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: `[template:${TEMPLATE_SID}]`,
      message_type: "template",
      twilio_sid: twData.sid,
    });
    await supabase
      .from("conversations")
      .update({ last_followup_at: now, last_message_at: now })
      .eq("id", conversationId);

    return new Response(JSON.stringify({ success: true, sid: twData.sid, last_followup_at: now }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("conversation-send-followup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
