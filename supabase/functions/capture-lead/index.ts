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
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
    const whatsapp = String(body.whatsapp || "").trim().slice(0, 30);
    const source = String(body.source || "campanha").slice(0, 50);
    const trackRaw = String(body.track || "").trim().slice(0, 30);
    const track = trackRaw || null;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("leads")
      .insert({ name, email, whatsapp: whatsapp || null, source, track })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Trigger welcome email for aprender track + agendar email DIA 1 (+1 dia)
    if (track === 'aprender' && data?.id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const functionUrl = `${supabaseUrl}/functions/v1/send-aprender-welcome`;

        await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
          body: JSON.stringify({ name, email }),
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      // Agendar sequência completa de emails (dia 1, 3, 6, 10)
      try {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const sequence = [
          { email_key: "lead-metodo-aprender", days: 1 },
          { email_key: "lead-manifesto-aprender", days: 3 },
          { email_key: "lead-oportunidade-aprender", days: 6 },
          { email_key: "lead-urgencia-aprender", days: 10 },
        ];
        await supabase.from("lead_email_schedule").insert(
          sequence.map((s) => ({
            lead_id: data.id,
            email_key: s.email_key,
            send_at: new Date(now + s.days * day).toISOString(),
          }))
        );
      } catch (scheduleError) {
        console.error("Failed to schedule aprender sequence:", scheduleError);
      }
    }

    return new Response(JSON.stringify({ ok: true, lead_id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("capture-lead error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
