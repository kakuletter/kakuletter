import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const letterId = searchParams.get("letterId");

  if (!letterId || !UUID_REGEX.test(letterId)) {
    return NextResponse.json({ error: "Invalid letterId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: letter } = await adminClient
    .from("letters")
    .select("status, stripe_session_id")
    .eq("id", letterId)
    .single<{ status: string; stripe_session_id: string | null }>();

  if (!letter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 既に支払い済みならそのまま返す
  if (letter.status !== "payment_pending") {
    return NextResponse.json({ status: letter.status });
  }

  // payment_pending かつ stripe_session_id がある場合、Stripe APIで直接確認
  if (letter.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(letter.stripe_session_id);
      if (session.payment_status === "paid") {
        await adminClient
          .from("letters")
          .update({ status: "received", received_at: new Date().toISOString() })
          .eq("id", letterId)
          .eq("status", "payment_pending");

        return NextResponse.json({ status: "received" });
      }
    } catch {
      // Stripe APIエラーはスルーしてDBの値を返す
    }
  }

  return NextResponse.json({ status: letter.status });
}
