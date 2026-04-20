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
    const { id } = await req.json();
    if (!id || typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lead, error: findErr } = await supabase
      .from("leads")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!lead) {
      return new Response(JSON.stringify({ ok: false, error: "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await supabase
      .from("leads")
      .update({ unsubscribed: true })
      .eq("id", id);

    if (updErr) throw new Error(updErr.message);

    // Cancel pending scheduled emails for this lead
    await supabase
      .from("lead_email_schedule")
      .update({ status: "skipped", error_message: "lead unsubscribed", sent_at: new Date().toISOString() })
      .eq("lead_id", id)
      .eq("status", "pending");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("unsubscribe-lead error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
