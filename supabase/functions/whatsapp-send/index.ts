import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    const { to, body, contentSid, contentVariables, conversationId, messageType } = await req.json();

    if (!to || (!body && !contentSid)) {
      return new Response(JSON.stringify({ error: "Missing 'to' and 'body' or 'contentSid'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Twilio WhatsApp
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+17403135891";
    const toWhatsapp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const params: Record<string, string> = {
      To: toWhatsapp,
      From: fromNumber,
    };

    if (contentSid) {
      // Template-based message (required for initiating conversations)
      params.ContentSid = contentSid;
      if (contentVariables) {
        params.ContentVariables = contentVariables;
      }
    } else {
      // Free-form text (only within 24h session window)
      params.Body = body;
    }

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Twilio API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    // Save outbound message to database
    if (conversationId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        direction: "outbound",
        content: body || `[template:${contentSid}]`,
        message_type: messageType || "text",
        twilio_sid: data.sid,
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("whatsapp-send error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
