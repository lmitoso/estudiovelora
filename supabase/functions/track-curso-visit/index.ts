import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const lead_id = String(body.lead_id || "").trim();

    // Basic UUID sanity check
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lead_id)) {
      return new Response(JSON.stringify({ error: "Invalid lead_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, whatsapp, email, unsubscribed")
      .eq("id", lead_id)
      .maybeSingle();

    if (leadError) throw new Error(leadError.message);

    // Silent exits — don't leak info
    if (!lead || lead.unsubscribed || !lead.whatsapp) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe: skip if a trigger was already created for this lead in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("curso_visit_triggers")
      .select("id")
      .eq("lead_id", lead_id)
      .gte("triggered_at", since)
      .limit(1)
      .maybeSingle();

    if (recent) {
      return new Response(JSON.stringify({ ok: true, deduped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert pending trigger — will be picked up 30 min later by process-follow-ups
    const { error: insertError } = await supabase
      .from("curso_visit_triggers")
      .insert({ lead_id, status: "pending" });

    if (insertError) throw new Error(insertError.message);

    return new Response(JSON.stringify({ ok: true, scheduled: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("track-curso-visit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
