import { NextResponse } from "next/server";
import Stripe from "stripe";

const priceMap = {
  basic: 900,
  full: 2900
} as const;

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const { plan } = (await request.json()) as { plan: keyof typeof priceMap };
  if (!priceMap[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: priceMap[plan],
          product_data: {
            name: plan === "basic" ? "Basic Analysis" : "Full PR Strategy Report"
          }
        },
        quantity: 1
      }
    ],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/pr-strategy-report`
  });

  return NextResponse.json({ url: session.url });
}
