import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Content Template SIDs for follow-ups
// Only use templates approved for "WhatsApp business initiated"
const FOLLOW_UP_TEMPLATES: Record<string, { contentSid: string; approved: boolean }> = {
  check_in: { contentSid: "HX4e6613261f6e21c81fee455e18e5d453", approved: true },
  value_reminder: { contentSid: "HXc00d783f41e93c2f85ce21348cba8294", approved: false },
  urgency: { contentSid: "HX885de193cc6cddafa1014b9f68ba8b62", approved: false },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get pending follow-ups that are due
    const { data: followUps, error } = await supabase
      .from("follow_up_schedule")
      .select("*, conversations(*)")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(10);

    if (error) throw new Error(`Failed to fetch follow-ups: ${error.message}`);
    if (!followUps || followUps.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const followUp of followUps) {
      try {
        const conversation = followUp.conversations;
        if (!conversation || conversation.status === "closed_won" || conversation.status === "closed_lost") {
          // Cancel follow-up for closed conversations
          await supabase
            .from("follow_up_schedule")
            .update({ status: "cancelled" })
            .eq("id", followUp.id);
          continue;
        }

        // Generate follow-up message with AI if not pre-written
        let messageContent = followUp.message_content;
        if (!messageContent) {
          const prompt = FOLLOW_UP_PROMPTS[followUp.type] || FOLLOW_UP_PROMPTS.check_in;

          const aiResponse = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "Você é a assistente de vendas da Velora, um estúdio de direção de arte com IA. Responda apenas com a mensagem, sem aspas ou prefixos." },
                { role: "user", content: prompt + (conversation.context_summary ? `\n\nContexto: ${conversation.context_summary}` : "") },
              ],
              max_tokens: 200,
              temperature: 0.8,
            }),
          });

          const aiData = await aiResponse.json();
          messageContent = aiData.choices?.[0]?.message?.content || "Olá! Gostaria de saber se ainda tem interesse em criar sua campanha visual com a Velora. Estamos à disposição! ✨";
        }

        // Send via whatsapp-send
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            to: conversation.whatsapp_number,
            body: messageContent,
            conversationId: conversation.id,
            messageType: "follow_up",
          }),
        });

        // Mark follow-up as sent
        await supabase
          .from("follow_up_schedule")
          .update({ status: "sent" })
          .eq("id", followUp.id);

        processed++;
      } catch (err) {
        console.error(`Failed to process follow-up ${followUp.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-follow-ups error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
