import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side pricing constants (source of truth)
const PHOTO_PRICE = 27;
const VIDEO_PRICE = 37;
const COMBOS = [
  { photos: 3, videos: 0, price: 67 },
  { photos: 5, videos: 1, price: 129 },
  { photos: 10, videos: 2, price: 219 },
];
const MAX_DISCOUNT = 0.2; // 20% flash discount

function calculateServerPrice(photosQty: number, videosQty: number): number {
  // Check if it matches a combo
  const combo = COMBOS.find(c => c.photos === photosQty && c.videos === videosQty);
  if (combo) return combo.price;

  // Custom pricing
  return photosQty * PHOTO_PRICE + videosQty * VIDEO_PRICE;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, amount, description, customerEmail, customerName } = await req.json();

    if (!orderId || !amount || !customerEmail) {
      throw new Error("Missing required fields: orderId, amount, customerEmail");
    }

    // Fetch order from database to validate
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, photos_qty, videos_qty, total_price")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Calculate the correct price server-side
    const basePrice = calculateServerPrice(order.photos_qty, order.videos_qty);
    const minAllowedPrice = Math.round(basePrice * (1 - MAX_DISCOUNT));

    // Validate: client amount must be between discounted price and full price
    const clientAmount = Number(amount);
    if (clientAmount < minAllowedPrice || clientAmount > basePrice) {
      console.error(
        `Price mismatch! Client sent R$${clientAmount}, server expects R$${minAllowedPrice}-R$${basePrice} for ${order.photos_qty} photos + ${order.videos_qty} videos`
      );
      throw new Error("Invalid price. Please refresh and try again.");
    }

    // Use the validated amount (which may include the flash discount)
    const validatedAmount = clientAmount;

    // Update order with validated price in case of mismatch
    if (order.total_price !== validatedAmount) {
      await supabaseAdmin
        .from("orders")
        .update({ total_price: validatedAmount })
        .eq("id", orderId);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: description || "Campanha Velora",
              description: `Pedido ${orderId.slice(0, 8)}`,
            },
            unit_amount: Math.round(validatedAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      metadata: {
        order_id: orderId,
        expected_amount: validatedAmount.toString(),
        photos_qty: order.photos_qty.toString(),
        videos_qty: order.videos_qty.toString(),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
