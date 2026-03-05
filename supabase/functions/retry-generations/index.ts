import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAL_SYNC_URL = "https://fal.run";
const MAX_RETRIES = 3;

async function safeParseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const jsonStart = text.search(/[\{\[]/);
    const isArray = jsonStart !== -1 && text[jsonStart] === '[';
    const jsonEnd = text.lastIndexOf(isArray ? ']' : '}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`No valid JSON found: ${text.substring(0, 200)}`);
    }
    let cleaned = text.substring(jsonStart, jsonEnd + 1)
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(cleaned);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, baseDelay = 2000): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt ${attempt + 1}/${retries} failed: ${lastError.message}`);
      if (lastError.message.includes("Exhausted balance") || lastError.message.includes("401")) {
        throw lastError;
      }
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError!;
}

async function generateVideo(FAL_API_KEY: string, prompt: string, imageUrl: string): Promise<string> {
  const klingResponse = await fetch(
    `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video`,
    {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url: imageUrl,
        duration: "5",
        aspect_ratio: "9:16",
      }),
    }
  );

  if (!klingResponse.ok) {
    const errText = await klingResponse.text();
    throw new Error(`Kling error [${klingResponse.status}]: ${errText}`);
  }

  const klingData = await safeParseJson(klingResponse);

  if (klingData.request_id) {
    for (let attempt = 0; attempt < 150; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${klingData.request_id}/status`,
        { headers: { Authorization: `Key ${FAL_API_KEY}` } }
      );
      const statusData = await safeParseJson(statusRes);
      if (statusData.status === "COMPLETED") {
        const resultRes = await fetch(
          `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${klingData.request_id}`,
          { headers: { Authorization: `Key ${FAL_API_KEY}` } }
        );
        const videoResult = await safeParseJson(resultRes);
        if (videoResult?.video?.url) return videoResult.video.url;
        throw new Error("No video URL in completed result");
      } else if (statusData.status === "FAILED") {
        throw new Error("Kling video generation failed");
      }
    }
    throw new Error("Kling video generation timed out");
  }
  throw new Error("Unexpected Kling response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const { orderId, generationIds, mode } = body;

    // Mode: "failed_videos" — retry specific failed video generations in-place
    if (mode === "failed_videos" || generationIds) {
      let query = supabase
        .from("generations")
        .select("id, prompt, input_image_url, order_id")
        .eq("status", "failed")
        .eq("type", "video");

      if (generationIds) {
        query = query.in("id", generationIds);
      } else if (orderId) {
        query = query.eq("order_id", orderId);
      }

      const { data: failedVids, error } = await query;
      if (error) throw new Error(error.message);
      if (!failedVids || failedVids.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No failed videos found", retried: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const results: any[] = [];
      for (const vid of failedVids) {
        await supabase.from("generations").update({ status: "processing", error_message: null }).eq("id", vid.id);
        try {
          const videoUrl = await withRetry(() =>
            generateVideo(FAL_API_KEY, vid.prompt || "", vid.input_image_url || "")
          );
          await supabase.from("generations").update({
            status: "completed", output_url: videoUrl, completed_at: new Date().toISOString(), error_message: null,
          }).eq("id", vid.id);
          results.push({ id: vid.id, status: "completed" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await supabase.from("generations").update({ status: "failed", error_message: msg }).eq("id", vid.id);
          results.push({ id: vid.id, status: "failed", error: msg });
        }
      }

      return new Response(JSON.stringify({ success: true, retried: results.length, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default mode: retry full orders with generation_failed status
    let orderQuery = supabase.from("orders").select("id").eq("status", "generation_failed");
    if (orderId) orderQuery = orderQuery.eq("id", orderId);
    const { data: failedOrders, error: queryError } = await orderQuery.limit(10);

    if (queryError) throw new Error(queryError.message);
    if (!failedOrders || failedOrders.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No failed orders to retry", retried: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    for (const order of failedOrders) {
      try {
        await supabase.from("generations").delete().eq("order_id", order.id).eq("status", "failed");
        const genUrl = `${SUPABASE_URL}/functions/v1/generate-content`;
        await fetch(genUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ orderId: order.id }),
        });
        results.push({ orderId: order.id, status: "retried" });
      } catch (retryErr) {
        results.push({ orderId: order.id, status: "retry_error" });
      }
    }

    return new Response(JSON.stringify({ success: true, retried: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("retry-generations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
