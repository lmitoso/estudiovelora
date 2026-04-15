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
    const { name, whatsapp } = await req.json();

    if (!name || !whatsapp) {
      return new Response(JSON.stringify({ error: "Missing name or whatsapp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone number
    const cleaned = whatsapp.replace(/\D/g, "");
    const phoneNumber = cleaned.startsWith("55") ? `+${cleaned}` : `+55${cleaned}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if conversation already exists for this number
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("whatsapp_number", phoneNumber)
      .in("status", ["new", "active", "negotiating"])
      .limit(1)
      .single();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create conversation (trigger will auto-link to lead)
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          whatsapp_number: phoneNumber,
          status: "active",
          stage: "greeting",
        })
        .select("id")
        .single();

      if (convErr) throw new Error(`Failed to create conversation: ${convErr.message}`);
      conversationId = newConv.id;
    }

    const firstName = name.split(" ")[0];

    // Send welcome via WhatsApp using approved template
    const WELCOME_TEMPLATE_SID = "HX909aba526ab38743bc5b43b321599c90";

    const sendResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          to: phoneNumber,
          contentSid: WELCOME_TEMPLATE_SID,
          contentVariables: JSON.stringify({ "1": firstName }),
          conversationId,
          messageType: "template",
        }),
      }
    );

    const sendData = await sendResponse.json();

    return new Response(JSON.stringify({ 
      success: true, 
      conversationId,
      messageSent: sendData.success || false,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("welcome-lead error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
