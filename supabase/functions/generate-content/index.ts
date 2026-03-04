import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAL_API_URL = "https://queue.fal.run";

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

    // Generate images with Nano Banana 2
    for (let i = 0; i < order.photos_qty; i++) {
      const prompt = buildImagePrompt({
        brandName: order.brand_name,
        brandDescription: order.brand_description,
        campaignGoal: order.campaign_goal,
        modelType: order.model_type,
        pieceDescription: order.piece_description,
      });

      // Create generation record
      const { data: gen } = await supabase
        .from("generations")
        .insert({
          order_id: orderId,
          type: "image",
          status: "processing",
          prompt,
        })
        .select()
        .single();

      try {
        // Call fal.ai Nano Banana 2 (text-to-image)
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

        const falData = await falResponse.json();

        // fal.ai queue returns request_id for async processing
        if (falData.request_id) {
          // Poll for result
          let result = null;
          for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise((r) => setTimeout(r, 2000));
            const statusRes = await fetch(
              `${FAL_API_URL}/fal-ai/nano-banana-2/requests/${falData.request_id}/status`,
              { headers: { Authorization: `Key ${FAL_API_KEY}` } }
            );
            const statusData = await statusRes.json();
            if (statusData.status === "COMPLETED") {
              const resultRes = await fetch(
                `${FAL_API_URL}/fal-ai/nano-banana-2/requests/${falData.request_id}`,
                { headers: { Authorization: `Key ${FAL_API_KEY}` } }
              );
              result = await resultRes.json();
              break;
            } else if (statusData.status === "FAILED") {
              throw new Error("fal.ai generation failed");
            }
          }
          if (!result) throw new Error("fal.ai generation timed out");

          const imageUrl = result.images?.[0]?.url;
          if (imageUrl) {
            results.images.push(imageUrl);
            await supabase
              .from("generations")
              .update({ status: "completed", output_url: imageUrl, completed_at: new Date().toISOString() })
              .eq("id", gen!.id);
          }
        } else if (falData.images?.[0]?.url) {
          // Synchronous response
          results.images.push(falData.images[0].url);
          await supabase
            .from("generations")
            .update({ status: "completed", output_url: falData.images[0].url, completed_at: new Date().toISOString() })
            .eq("id", gen!.id);
        }
      } catch (genError) {
        console.error("Image generation error:", genError);
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

        const klingData = await klingResponse.json();

        if (klingData.request_id) {
          let videoResult = null;
          // Kling takes 1-3 minutes, poll for up to 5 minutes
          for (let attempt = 0; attempt < 150; attempt++) {
            await new Promise((r) => setTimeout(r, 2000));
            const statusRes = await fetch(
              `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${klingData.request_id}/status`,
              { headers: { Authorization: `Key ${FAL_API_KEY}` } }
            );
            const statusData = await statusRes.json();
            if (statusData.status === "COMPLETED") {
              const resultRes = await fetch(
                `${FAL_API_URL}/fal-ai/kling-video/v2.1/standard/image-to-video/requests/${klingData.request_id}`,
                { headers: { Authorization: `Key ${FAL_API_KEY}` } }
              );
              videoResult = await resultRes.json();
              break;
            } else if (statusData.status === "FAILED") {
              throw new Error("Kling video generation failed");
            }
          }
          if (videoResult?.video?.url) {
            results.video = videoResult.video.url;
            await supabase
              .from("generations")
              .update({ status: "completed", output_url: videoResult.video.url, completed_at: new Date().toISOString() })
              .eq("id", videoGen!.id);
          }
        }
      } catch (videoError) {
        console.error("Video generation error:", videoError);
        await supabase
          .from("generations")
          .update({ status: "failed", error_message: String(videoError) })
          .eq("id", videoGen!.id);
      }
    }

    // Update order status
    const finalStatus = results.images.length > 0 ? "completed" : "failed";
    await supabase.from("orders").update({ status: finalStatus, updated_at: new Date().toISOString() }).eq("id", orderId);

    return new Response(JSON.stringify({ success: true, results }), {
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
