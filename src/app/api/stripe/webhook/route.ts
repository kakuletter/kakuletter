import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 手紙決済の完了を処理（カスタムID宛は連結アカウント上の direct charge イベントとして届く）
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "letter" && session.mode === "payment") {
      const letterId = session.metadata.letter_id;
      if (letterId) {
        const adminClient = createAdminClient();
        await adminClient
          .from("letters")
          .update({ status: "received", received_at: new Date().toISOString() })
          .eq("id", letterId)
          .eq("status", "payment_pending");
      }
    }
  }

  return NextResponse.json({ received: true });
}
