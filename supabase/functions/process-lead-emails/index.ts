import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mapeia email_key → nome da edge function que envia o email
const EMAIL_FUNCTIONS: Record<string, string> = {
  // Track aprender (curso)
  "lead-metodo-aprender": "send-aprender-metodo",
  "lead-manifesto-aprender": "send-aprender-manifesto",
  "lead-oportunidade-aprender": "send-aprender-oportunidade",
  "lead-urgencia-aprender": "send-aprender-urgencia",
  "lead-cruzamento-b-a": "send-cruzamento-b-a",
  "lead-pack-oferta": "send-pack-oferta",
  "lead-pack-upsell": "send-pack-upsell",
  // Track servico
  "lead-welcome-servico": "send-servico-welcome",
  "lead-prova-servico": "send-servico-prova",
  "lead-autoridade-servico": "send-servico-autoridade",
  "lead-briefing-servico": "send-servico-briefing",
  "lead-reativacao-servico": "send-servico-reativacao",
  "lead-upsell-servico": "send-servico-upsell",
};

// Janela mínima de silêncio do WhatsApp (em dias) para disparar emails condicionais
const SILENCE_WINDOW_DAYS = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar até 50 emails pendentes cujo horário já chegou
    const { data: pending, error } = await supabase
      .from("lead_email_schedule")
      .select("id, lead_id, email_key, conditional, leads:lead_id(name, email, unsubscribed)")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .limit(50);

    if (error) throw new Error(error.message);
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const silenceCutoff = new Date(Date.now() - SILENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    for (const item of pending) {
      const fnName = EMAIL_FUNCTIONS[item.email_key];
      const lead = (item as any).leads;
      if (!fnName || !lead?.email) {
        await supabase
          .from("lead_email_schedule")
          .update({
            status: "failed",
            error_message: !fnName ? "unknown email_key" : "missing lead email",
          })
          .eq("id", item.id);
        failed++;
        continue;
      }

      // Lead descadastrou — cancelar silenciosamente
      if (lead.unsubscribed === true) {
        await supabase
          .from("lead_email_schedule")
          .update({
            status: "skipped",
            error_message: "lead unsubscribed",
            sent_at: new Date().toISOString(),
          })
          .eq("id", item.id);
        skipped++;
        continue;
      }

      // Email de cruzamento B→A: pular se o lead já comprou (qualquer pedido pago com mesmo email)
      if (item.email_key === "lead-cruzamento-b-a") {
        const { data: paidOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("email", lead.email)
          .eq("status", "paid")
          .limit(1)
          .maybeSingle();

        if (paidOrder) {
          await supabase
            .from("lead_email_schedule")
            .update({
              status: "skipped",
              error_message: "lead already purchased",
              sent_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          skipped++;
          continue;
        }
      }

      if (item.conditional) {
        const { data: recentMsgs } = await supabase
          .from("conversations")
          .select("id, last_message_at")
          .eq("lead_id", item.lead_id)
          .gte("last_message_at", silenceCutoff)
          .limit(1);

        if (recentMsgs && recentMsgs.length > 0) {
          // Houve mensagem recente — pular este envio (marcar como skipped)
          await supabase
            .from("lead_email_schedule")
            .update({
              status: "skipped",
              error_message: "WhatsApp activity within silence window",
              sent_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          skipped++;
          continue;
        }
      }

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            name: lead.name,
            email: lead.email,
            lead_id: item.lead_id,
            idempotency_key: `${item.email_key}-${item.id}`,
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          throw new Error(`status ${resp.status}: ${txt.slice(0, 200)}`);
        }

        await supabase
          .from("lead_email_schedule")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", item.id);
        sent++;
      } catch (err) {
        console.error(`Failed to send ${item.email_key} for ${item.id}:`, err);
        await supabase
          .from("lead_email_schedule")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : "unknown error",
          })
          .eq("id", item.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: pending.length, sent, failed, skipped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-lead-emails error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
