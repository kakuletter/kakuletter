import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, SUBSCRIPTION_PRICE_ID } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("stripe_customer_id, subscription_status, email, real_name")
    .eq("auth_id", user.id)
    .single<{ stripe_customer_id: string | null; subscription_status: string; email: string; real_name: string }>();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  if (profile.subscription_status === "premium") {
    return NextResponse.json({ error: "すでにプレミアム会員です" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // Stripe Customer を取得または作成
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.real_name,
        metadata: { auth_id: user.id },
      });
      customerId = customer.id;
      await adminClient
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("auth_id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/subscribe?canceled=1`,
      metadata: { auth_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as NodeJS.ErrnoException).code ?? "unknown";
    console.error("[Stripe] checkout error:", message, "code:", code, JSON.stringify(err));
    return NextResponse.json({ error: "決済の準備に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
