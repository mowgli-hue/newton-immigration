import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe env vars missing" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" });
  const payload = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    if (event.type === "checkout.session.completed") {
      return NextResponse.json({ ok: true, message: "Payment received" });
    }
    return NextResponse.json({ ok: true, message: "Event ignored" });
  } catch {
    return NextResponse.json({ ok: false, error: "Webhook signature verification failed" }, { status: 400 });
  }
}
