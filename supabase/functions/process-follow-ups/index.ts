import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Trilhas de follow-up por tipo de lead.
// hours = horas após followup_base_at (última msg da Luna ao lead)
// Cada step usa contentSid de template aprovado no Twilio.
type Step = { hours: number; contentSid: string; label: string };

const TRACKS: Record<string, Step[]> = {
  servico: [
    { hours: 24,  contentSid: "HX1b545a5ccc53fd9fb4230e8f5a4b08c9", label: "servico_urgencia" },
    { hours: 72,  contentSid: "HX673dfac25a130d8ef586258857f70d8c", label: "servico_teste" },
    { hours: 120, contentSid: "HX52d766e7498bc6ab4d68885778cdb9b3", label: "servico_valor" },
    { hours: 168, contentSid: "HXd9165276d15a3a605591897528caec40", label: "servico_encerramento" },
  ],
  aprender: [
    { hours: 24,  contentSid: "HXea199b0559154f43aeb21daaa81ff969", label: "aprender_urgency" },
    { hours: 72,  contentSid: "HX25500622e3d2f966698be2c3ba4773f8", label: "aprender_mercado" },
    { hours: 120, contentSid: "HX63906c73c603ac9459d9e87fbb541412", label: "aprender_roi" },
    { hours: 168, contentSid: "HX19b44cc5f6d31112bee65041c9e36c79", label: "aprender_pack" },
    { hours: 240, contentSid: "HX7cfb298441d1abeedb9c79e50187fbe2", label: "aprender_checkin" },
    { hours: 336, contentSid: "HXd9165276d15a3a605591897528caec40", label: "aprender_encerramento" },
  ],
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

    const now = Date.now();

    // Buscar conversas ativas com lead_type definido e ainda dentro da trilha
    const { data: convs, error } = await supabase
      .from("conversations")
      .select("id, lead_id, whatsapp_number, status, handoff_status, lead_type, followup_step, followup_base_at, last_followup_at, last_message_at")
      .in("lead_type", ["servico", "aprender"])
      .not("followup_base_at", "is", null)
      .not("status", "in", "(closed_won,closed_lost,inactive)")
      .limit(100);

    if (error) throw new Error(`Failed to fetch conversations: ${error.message}`);

    let processed = 0;

    for (const conv of (convs || []) as any[]) {
      try {
        // handoff ativo (CEO) → não enviar follow-up
        if (conv.handoff_status && conv.handoff_status !== "luna") continue;

        const track = TRACKS[conv.lead_type];
        if (!track) continue;

        const step = conv.followup_step || 0;
        if (step >= track.length) {
          // trilha esgotada → marcar inativo
          await supabase
            .from("conversations")
            .update({ status: "inactive" })
            .eq("id", conv.id);
          continue;
        }

        const next = track[step];
        const baseMs = new Date(conv.followup_base_at).getTime();
        const dueAt = baseMs + next.hours * 60 * 60 * 1000;
        if (now < dueAt) continue;

        // Não enviar mais de 1 template por dia
        if (conv.last_followup_at) {
          const sinceLast = now - new Date(conv.last_followup_at).getTime();
          if (sinceLast < 24 * 60 * 60 * 1000) continue;
        }

        // Buscar primeiro nome
        let firstName = "tudo bem";
        if (conv.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("name, unsubscribed")
            .eq("id", conv.lead_id)
            .single();
          if (lead?.unsubscribed) {
            await supabase.from("conversations").update({ status: "inactive" }).eq("id", conv.id);
            continue;
          }
          if (lead?.name) firstName = lead.name.split(" ")[0];
        }

        // Enviar template via whatsapp-send
        const sendRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            to: conv.whatsapp_number,
            contentSid: next.contentSid,
            contentVariables: JSON.stringify({ "1": firstName }),
            conversationId: conv.id,
            messageType: `followup_${conv.lead_type}_${next.label}`,
          }),
        });

        if (!sendRes.ok) {
          console.error(`[process-follow-ups] send failed conv=${conv.id}`, await sendRes.text());
          continue;
        }

        const newStep = step + 1;
        const update: Record<string, any> = {
          followup_step: newStep,
          last_followup_at: new Date().toISOString(),
        };
        if (newStep >= track.length) {
          update.status = "inactive";
        }
        await supabase.from("conversations").update(update).eq("id", conv.id);

        processed++;
      } catch (err) {
        console.error(`[process-follow-ups] error conv=${conv.id}:`, err);
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
