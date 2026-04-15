import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Twilio sends form-urlencoded data
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const from = params.get("From") || ""; // whatsapp:+5598...
    const body = params.get("Body") || "";
    const messageSid = params.get("MessageSid") || "";

    if (!from || !body) {
      return new Response("<Response></Response>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Extract phone number (remove whatsapp: prefix)
    const phoneNumber = from.replace("whatsapp:", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("whatsapp_number", phoneNumber)
      .in("status", ["new", "active", "negotiating"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          whatsapp_number: phoneNumber,
          status: "active",
          stage: "greeting",
        })
        .select()
        .single();

      if (convError) throw new Error(`Failed to create conversation: ${convError.message}`);
      conversation = newConv;
    }

    // Save inbound message
    await supabase.from("conversation_messages").insert({
      conversation_id: conversation.id,
      direction: "inbound",
      content: body,
      message_type: "text",
      twilio_sid: messageSid,
    });

    // Call sales-agent to generate response
    const agentResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/sales-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          inboundMessage: body,
        }),
      }
    );

    const agentData = await agentResponse.json();

    if (agentData.reply) {
      // Send reply via whatsapp-send
      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            to: from,
            body: agentData.reply,
            conversationId: conversation.id,
            messageType: "text",
          }),
        }
      );
    }

    // Respond to Twilio with empty TwiML (we handle response async)
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("whatsapp-webhook error:", error);
    // Always return 200 to Twilio to avoid retries
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
});
