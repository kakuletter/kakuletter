import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("subscription_status, email, stripe_connect_account_id")
    .eq("auth_id", user.id)
    .single<{ subscription_status: string; email: string; stripe_connect_account_id: string | null }>();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  if (profile.subscription_status !== "premium") {
    return NextResponse.json({ error: "プレミアム会員のみ口座を連携できます" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // 連結アカウントを取得または新規作成（Express）
    let accountId = profile.stripe_connect_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        email: profile.email,
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await adminClient
        .from("users")
        .update({ stripe_connect_account_id: accountId })
        .eq("auth_id", user.id);
    }

    // オンボーディング用のリンクを生成
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard?connect=refresh`,
      return_url: `${appUrl}/dashboard?connect=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Stripe] connect onboarding error:", message);
    return NextResponse.json({ error: "口座連携の準備に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
