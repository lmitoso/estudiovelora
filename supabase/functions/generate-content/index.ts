import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAL_API_URL = "https://queue.fal.run";
const MAX_RETRIES = 3;

// Robust JSON parsing — handles malformed responses from fal.ai
async function safeParseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON object/array from the response
    const jsonStart = text.search(/[\{\[]/);
    const isArray = jsonStart !== -1 && text[jsonStart] === '[';
    const jsonEnd = text.lastIndexOf(isArray ? ']' : '}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`No valid JSON found in response: ${text.substring(0, 200)}`);
    }
    let cleaned = text.substring(jsonStart, jsonEnd + 1)
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(cleaned);
  }
}

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, baseDelay = 2000): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt ${attempt + 1}/${retries} failed: ${lastError.message}`);
      // Don't retry on balance/auth errors
      if (lastError.message.includes("Exhausted balance") || lastError.message.includes("401")) {
        throw lastError;
      }
      if (attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
}

// Art Director: builds optimized prompts based on the Creative DNA catalog
function buildImagePrompt(briefing: {
  brandName: string;
  brandDescription?: string;
  campaignGoal?: string;
  modelType: string;
  pieceDescription?: string;
}): string {
  const modelGender =
    briefing.modelType === "masculino" ? "male" : "female";
  const modelDirection =
    modelGender === "male"
      ? "A confident young man in structured, oversized streetwear — boxy jacket, relaxed tailored trousers, minimalistic graphic tee. Direct gaze projects silent authority, stance straight and composed."
      : "A female fashion model in tailored blazer, controlled editorial posture, serious composed expression. Quiet authority — fashion magazine attitude.";

  return `Ultra-realistic high-fashion studio editorial photograph for ${briefing.brandName}.
${briefing.brandDescription ? `Brand context: ${briefing.brandDescription}.` : ""}
${briefing.campaignGoal ? `Campaign goal: ${briefing.campaignGoal}.` : ""}
${briefing.pieceDescription ? `Product: ${briefing.pieceDescription}.` : ""}

${modelDirection}

Styling Direction — Silent Luxury, modern European campaign aesthetic.
Pure white or dark seamless studio background, museum-clean minimalism.
Directional soft studio lighting, defined shadow shaping, neutral luxury color grading — crisp but refined.
Vertical 4:5 luxury portrait framing, editorial sharpness with natural depth falloff.
Full-frame realism, 85mm lens, f/2.8, ISO 100.

Style keywords: power fashion editorial, sculptural luxury, modern European campaign, high-fashion studio portrait, photorealistic magazine-quality.

NEGATIVE: casual lifestyle, smiling, outdoor context, cinematic drama, glossy plastic, influencer pose, distorted anatomy, extra fingers, fake branding, text overlays, watermark, blur, grain, noise.`;
}

// Build video prompt for Kling
function buildVideoPrompt(brandName: string): string {
  return `Subtle editorial fashion movement. The model slowly turns their head with quiet confidence. Gentle fabric movement from a soft breeze. Cinematic slow-motion luxury campaign for ${brandName}. No sudden movements, no smiling, silent authority atmosphere. 5 seconds.`;
}

// Generate a single image with fal.ai (with polling)
async function generateImage(FAL_API_KEY: string, prompt: string): Promise<string> {
  const falResponse = await fetch(`${FAL_API_URL}/fal-ai/nano-banana-2`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "portrait_4_3",
      num_inference_steps: 30,
      guidance_scale: 7.5,
    }),
  });

  if (!falResponse.ok) {
    const errText = await falResponse.text();
    throw new Error(`fal.ai error [${falResponse.status}]: ${errText}`);
  }

  const falData = await safeParseJson(falResponse);

  if (falData.request_id) {
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `${FAL_API_URL}/fal-ai/nano-banana-2/requests/${falData.request_id}/status`,
        { headers: { Authorization: `Key ${FAL_API_KEY}` } }
      );
      const statusData = await safeParseJson(statusRes);
      if (statusData.status === "COMPLETED") {
        const resultRes = await fetch(
          `${FAL_API_URL}/fal-ai/nano-banana-2/requests/${falData.request_id}`,
          { headers: { Authorization: `Key ${FAL_API_KEY}` } }
        );
        const result = await safeParseJson(resultRes);
        const url = result.images?.[0]?.url;
        if (url) return url;
        throw new Error("No image URL in completed result");
      } else if (statusData.status === "FAILED") {
        throw new Error("fal.ai generation failed");
      }
    }
    throw new Error("fal.ai generation timed out");
  } else if (falData.images?.[0]?.url) {
    return falData.images[0].url;
  }
  throw new Error("Unexpected fal.ai response format");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    if (orderError || !order) throw new Error("Order not found");

    // Update order status
    await supabase.from("orders").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", orderId);

    const results: { images: string[]; video: string | null } = { images: [], video: null };

    // Generate images with retry
    for (let i = 0; i < order.photos_qty; i++) {
      const prompt = buildImagePrompt({
        brandName: order.brand_name,
        brandDescription: order.brand_description,
        campaignGoal: order.campaign_goal,
        modelType: order.model_type,
        pieceDescription: order.piece_description,
      });

      const { data: gen } = await supabase
        .from("generations")
        .insert({ order_id: orderId, type: "image", status: "processing", prompt })
        .select()
        .single();

      try {
        const imageUrl = await withRetry(() => generateImage(FAL_API_KEY, prompt));
        results.images.push(imageUrl);
        await supabase
          .from("generations")
          .update({ status: "completed", output_url: imageUrl, completed_at: new Date().toISOString() })
          .eq("id", gen!.id);
      } catch (genError) {
        console.error(`Image generation failed after ${MAX_RETRIES} retries:`, genError);
        await supabase
          .from("generations")
          .update({ status: "failed", error_message: String(genError) })
          .eq("id", gen!.id);
      }
    }

    // Generate video with Kling 2.1 if requested
    if (order.videos_qty > 0 && results.images.length > 0) {
      const videoPrompt = buildVideoPrompt(order.brand_name);

      const { data: videoGen } = await supabase
        .from("generations")
        .insert({
          order_id: orderId,
          type: "video",
          status: "processing",
          prompt: videoPrompt,
          input_image_url: results.images[0],
        })
        .select()
        .single();

      try {
        const videoUrl = await withRetry(async () => {
          const klingResponse = await fetch(
            `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video`,
            {
              method: "POST",
              headers: {
                Authorization: `Key ${FAL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: videoPrompt,
                image_url: results.images[0],
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
        });

        results.video = videoUrl;
        await supabase
          .from("generations")
          .update({ status: "completed", output_url: videoUrl, completed_at: new Date().toISOString() })
          .eq("id", videoGen!.id);
      } catch (videoError) {
        console.error(`Video generation failed after ${MAX_RETRIES} retries:`, videoError);
        await supabase
          .from("generations")
          .update({ status: "failed", error_message: String(videoError) })
          .eq("id", videoGen!.id);
      }
    }

    // Update order status — use generation_failed instead of generic failed
    const finalStatus = results.images.length > 0 ? "completed" : "generation_failed";
    await supabase.from("orders").update({ status: finalStatus, updated_at: new Date().toISOString() }).eq("id", orderId);

    // Trigger delivery email if content was generated
    if (finalStatus === "completed") {
      try {
        const emailUrl = `${SUPABASE_URL}/functions/v1/send-delivery-email`;
        const emailResponse = await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ orderId }),
        });
        if (!emailResponse.ok) {
          const errText = await emailResponse.text();
          console.error(`Email trigger failed: ${errText}`);
        } else {
          console.log(`Delivery email triggered for order ${orderId}`);
        }
      } catch (emailError) {
        console.error("Email trigger error:", emailError);
      }
    }

    return new Response(JSON.stringify({ success: finalStatus === "completed", results, status: finalStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
