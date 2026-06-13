import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// 手紙決済の完了を確定させる。payment_status が paid のときのみ受付済みにする。
// DB 更新に失敗した場合は 500 を返し、Stripe に再送させる。
async function markLetterReceived(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.metadata?.type !== "letter" || session.mode !== "payment") return true;
  if (session.payment_status !== "paid") return true; // まだ入金確定していない
  const letterId = session.metadata.letter_id;
  if (!letterId) return true;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("letters")
    .update({ status: "received", received_at: new Date().toISOString() })
    .eq("id", letterId)
    .eq("status", "payment_pending");

  if (error) {
    console.error("[Stripe] letter update failed:", error.message);
    return false;
  }
  return true;
}

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

  // 即時決済（カード）・遅延決済（コンビニ等）の両方を処理する
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const ok = await markLetterReceived(session);
    if (!ok) {
      // DB 更新に失敗 → 500 を返して Stripe に再送させる
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
