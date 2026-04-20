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

        // Determine template to use
        const template = FOLLOW_UP_TEMPLATES[followUp.type];
        
        // If template not approved, fall back to check_in
        const useTemplate = template?.approved ? template : FOLLOW_UP_TEMPLATES.check_in;
        
        if (!useTemplate.approved) {
          console.log(`Template for type "${followUp.type}" not approved, skipping.`);
          await supabase
            .from("follow_up_schedule")
            .update({ status: "cancelled" })
            .eq("id", followUp.id);
          continue;
        }

        // Get lead first name
        const firstName = conversation.whatsapp_number; // fallback
        let leadName = "there";
        if (conversation.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("name")
            .eq("id", conversation.lead_id)
            .single();
          if (lead) leadName = lead.name.split(" ")[0];
        }

        // Send via whatsapp-send using approved template
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            to: conversation.whatsapp_number,
            contentSid: useTemplate.contentSid,
            contentVariables: JSON.stringify({ "1": leadName }),
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

    // ===== Process curso visit triggers (Track B follow-up) =====
    let cursoProcessed = 0;
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: visitTriggers } = await supabase
        .from("curso_visit_triggers")
        .select("id, lead_id, leads(name, whatsapp, unsubscribed)")
        .eq("status", "pending")
        .lte("triggered_at", cutoff)
        .limit(20);

      for (const t of (visitTriggers || []) as any[]) {
        try {
          const lead = t.leads;
          if (!lead || lead.unsubscribed || !lead.whatsapp) {
            await supabase
              .from("curso_visit_triggers")
              .update({ status: "cancelled", sent_at: new Date().toISOString() })
              .eq("id", t.id);
            continue;
          }

          const firstName = (lead.name || "").split(" ")[0] || "tudo bem";
          const message =
            `Oi, ${firstName} 👋\n\n` +
            `Vi que você conheceu o curso da Velora.\n\n` +
            `Ficou alguma dúvida sobre o conteúdo ou como funciona? Posso te ajudar a entender se faz sentido para o seu momento agora.`;

          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              to: lead.whatsapp,
              body: message,
              messageType: "curso_visit_followup",
            }),
          });

          await supabase
            .from("curso_visit_triggers")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", t.id);
          cursoProcessed++;
        } catch (err) {
          console.error(`Failed to process curso trigger ${(t as any).id}:`, err);
        }
      }
    } catch (err) {
      console.error("curso visit triggers loop failed:", err);
    }

    return new Response(JSON.stringify({ processed, cursoProcessed }), {
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
