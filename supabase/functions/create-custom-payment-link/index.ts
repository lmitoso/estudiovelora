import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOTO_PRICE = 29.90;
const VIDEO_PRICE = 49.90;
const COMBOS = [
  { photos: 3, videos: 0, price: 97, name: "Pacote Essencial" },
  { photos: 5, videos: 2, price: 247, name: "Pacote Impacto" },
  { photos: 10, videos: 5, price: 497, name: "Pacote Campanha Completa" },
];

function calcPrice(photos: number, videos: number) {
  const combo = COMBOS.find(c => c.photos === photos && c.videos === videos);
  if (combo) return { price: combo.price, name: combo.name };
  return {
    price: Number((photos * PHOTO_PRICE + videos * VIDEO_PRICE).toFixed(2)),
    name: `Avulso: ${photos} foto(s) + ${videos} vídeo(s)`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photos_qty, videos_qty, customer_email, customer_name, whatsapp } = await req.json();

    const photos = Math.max(0, parseInt(photos_qty) || 0);
    const videos = Math.max(0, parseInt(videos_qty) || 0);

    if (photos === 0 && videos === 0) {
      throw new Error("Informe ao menos 1 foto ou 1 vídeo");
    }
    if (!customer_email) throw new Error("customer_email é obrigatório");

    const { price, name } = calcPrice(photos, videos);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        email: customer_email,
        customer_name: customer_name || null,
        whatsapp: whatsapp || null,
        brand_name: customer_name || customer_email,
        photos_qty: photos,
        videos_qty: videos,
        total_price: price,
        status: "pending",
        model_type: "feminino",
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.create({
      customer_email,
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: { name, description: `Pedido ${order.id.slice(0, 8)}` },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `https://www.estudiovelora.net/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `https://www.estudiovelora.net/?canceled=true`,
      metadata: {
        order_id: order.id,
        photos_qty: String(photos),
        videos_qty: String(videos),
        source: "luna-whatsapp",
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, price, name, order_id: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("create-custom-payment-link error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
