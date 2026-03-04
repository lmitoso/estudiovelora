import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const specificOrderId = body.orderId;

    // Get failed orders (specific or all)
    let query = supabase
      .from("orders")
      .select("id")
      .eq("status", "generation_failed");

    if (specificOrderId) {
      query = query.eq("id", specificOrderId);
    }

    const { data: failedOrders, error: queryError } = await query.limit(10);

    if (queryError) throw new Error(`Query error: ${queryError.message}`);
    if (!failedOrders || failedOrders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No failed orders to retry", retried: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { orderId: string; status: string }[] = [];

    for (const order of failedOrders) {
      try {
        // Reset failed generations for this order
        await supabase
          .from("generations")
          .delete()
          .eq("order_id", order.id)
          .eq("status", "failed");

        // Re-trigger generation
        const genUrl = `${SUPABASE_URL}/functions/v1/generate-content`;
        const genResponse = await fetch(genUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        });

        const genData = await genResponse.json();
        results.push({ orderId: order.id, status: genData.success ? "retried_ok" : "retry_failed" });
      } catch (retryErr) {
        console.error(`Retry failed for order ${order.id}:`, retryErr);
        results.push({ orderId: order.id, status: "retry_error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, retried: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("retry-generations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
