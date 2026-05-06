import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
    const acct = await stripe.accounts.retrieve();
    return new Response(JSON.stringify({
      id: acct.id,
      email: acct.email,
      country: acct.country,
      business_name: acct.business_profile?.name,
      display_name: (acct.settings as any)?.dashboard?.display_name,
      charges_enabled: acct.charges_enabled,
      details_submitted: acct.details_submitted,
      livemode_key: !Deno.env.get("STRIPE_SECRET_KEY")!.startsWith("sk_test_"),
    }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
