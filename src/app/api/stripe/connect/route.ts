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
    .select("email, stripe_connect_account_id")
    .eq("auth_id", user.id)
    .single<{ email: string; stripe_connect_account_id: string | null }>();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // direct charge では受取人自身がカード決済の加盟店になるため、
  // card_payments と transfers の両方の capability が必要。
  const capabilities = {
    card_payments: { requested: true },
    transfers: { requested: true },
  };

  try {
    // 連結アカウントを取得または新規作成（Express）
    let accountId = profile.stripe_connect_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        email: profile.email,
        capabilities,
      });
      accountId = account.id;
      await adminClient
        .from("users")
        .update({ stripe_connect_account_id: accountId })
        .eq("auth_id", user.id);
    } else {
      // 既存アカウントに不足している capability（card_payments 等）を追加要求する
      await stripe.accounts.update(accountId, { capabilities });
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
