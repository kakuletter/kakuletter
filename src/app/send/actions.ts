"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createQRPayment } from "@/lib/paypay";
import { stripe, DEFAULT_LETTER_FEE, FREE_TIER_MONTHLY_LIMIT, PAYOUT_RATE } from "@/lib/stripe";
import type { ActionState } from "@/types";

const ID_REGEX = /^KKL-([A-Z0-9]{5}|[A-Za-z][A-Za-z0-9-]{2,19})$/;

export async function createLetterPayment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rawId = (formData.get("recipient_display_id") as string)?.trim();
  const paymentMethod = formData.get("paymentMethod") === "stripe" ? "stripe" : "paypay";
  const rawCustomAmount = formData.get("customAmount");
  const customAmount = rawCustomAmount ? parseInt(rawCustomAmount as string, 10) : null;

  if (!rawId || !ID_REGEX.test(rawId)) {
    return { error: "IDの形式が正しくありません（例: KKL-AB3XY）。" };
  }

  const adminClient = createAdminClient();

  const lookupResult = await lookupRecipient(adminClient, rawId);
  if (!lookupResult) {
    return { error: `ID「${rawId}」は登録されていません。` };
  }
  const { recipient, isCustomId } = lookupResult;
  const isPremium = recipient.subscription_status === "premium";

  // カスタムID宛はStripeのみ
  if (isCustomId && paymentMethod !== "stripe") {
    return { error: "カスタムIDへの送信にはStripe決済をご利用ください。" };
  }

  // 無料会員の月間受取上限チェック
  if (!isPremium) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count } = await adminClient
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("recipient_display_id", recipient.display_id)
      .neq("status", "payment_pending")
      .gte("received_at", startOfMonth);

    if ((count ?? 0) >= FREE_TIER_MONTHLY_LIMIT) {
      return {
        error: "この受取人は今月の受取上限（10通）に達しています。来月以降に再度お試しください。",
      };
    }
  }

  // ログイン中の場合：自分自身への送信チェック＋送信者情報取得
  let senderName: string | null = null;
  let senderEmail: string | null = null;
  if (user) {
    const { data: senderProfile } = await adminClient
      .from("users")
      .select("display_id, custom_id, real_name")
      .eq("auth_id", user.id)
      .single<{ display_id: string; custom_id: string | null; real_name: string }>();

    const isSelf =
      senderProfile?.display_id === recipient.display_id ||
      (senderProfile?.custom_id && senderProfile.custom_id === recipient.custom_id);

    if (isSelf) {
      return { error: "自分自身には送れません。" };
    }
    senderName = senderProfile?.real_name ?? null;
    senderEmail = user.email ?? null;
  }

  // 手数料確定
  let fee: number;
  if (isCustomId) {
    if (!customAmount || isNaN(customAmount) || customAmount < 500 || customAmount > 50000) {
      return { error: "金額は500円〜50,000円の範囲で設定してください。" };
    }
    fee = customAmount;
  } else {
    fee = DEFAULT_LETTER_FEE;
  }

  const payoutAmount = isCustomId ? Math.floor((fee - DEFAULT_LETTER_FEE) * PAYOUT_RATE) : null;

  // 手紙レコード作成
  const { data: letter, error: insertError } = await adminClient
    .from("letters")
    .insert({
      recipient_display_id: recipient.display_id,
      sender_name: senderName,
      sender_email: senderEmail,
      status: "payment_pending",
      fee_amount: fee,
      payout_amount: payoutAmount,
      payout_status: isCustomId ? "pending" : "none",
      payment_method: paymentMethod,
    })
    .select("id")
    .single();

  if (insertError || !letter) {
    return { error: "手紙の作成に失敗しました。" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (paymentMethod === "stripe") {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: "KAKULETTER 転送手数料",
                description: `受取人ID: ${recipient.display_id}`,
              },
              unit_amount: fee,
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/letters/${letter.id}?stripe_return=1`,
        cancel_url: `${appUrl}/send?canceled=1`,
        metadata: {
          type: "letter",
          letter_id: letter.id,
        },
      });

      await adminClient
        .from("letters")
        .update({ payment_url: session.url, stripe_session_id: session.id })
        .eq("id", letter.id);

      return {
        success: true,
        data: { letterId: letter.id, paymentUrl: session.url, fee, paymentMethod: "stripe" },
      };
    } catch {
      await adminClient.from("letters").delete().eq("id", letter.id);
      return { error: "決済の準備に失敗しました。時間をおいて再度お試しください。" };
    }
  }

  // PayPay フロー
  const redirectUrl = `${appUrl}/letters/${letter.id}`;
  const paymentUrl = await createQRPayment(letter.id, redirectUrl, fee);

  if (!paymentUrl) {
    await adminClient.from("letters").delete().eq("id", letter.id);
    return { error: "決済の準備に失敗しました。時間をおいて再度お試しください。" };
  }

  await adminClient
    .from("letters")
    .update({ payment_url: paymentUrl })
    .eq("id", letter.id);

  return {
    success: true,
    data: { letterId: letter.id, paymentUrl, fee, paymentMethod: "paypay" },
  };
}

async function lookupRecipient(
  adminClient: ReturnType<typeof createAdminClient>,
  rawId: string
): Promise<{
  recipient: { id: string; display_id: string; custom_id: string | null; subscription_status: string };
  isCustomId: boolean;
} | null> {
  const { data: byDisplayId } = await adminClient
    .from("users")
    .select("id, display_id, custom_id, subscription_status")
    .eq("display_id", rawId.toUpperCase())
    .single<{ id: string; display_id: string; custom_id: string | null; subscription_status: string }>();

  if (byDisplayId) return { recipient: byDisplayId, isCustomId: false };

  const normalizedCustomId = `KKL-${rawId.replace(/^KKL-/i, "").toLowerCase()}`;
  const { data: byCustomId } = await adminClient
    .from("users")
    .select("id, display_id, custom_id, subscription_status")
    .eq("custom_id", normalizedCustomId)
    .single<{ id: string; display_id: string; custom_id: string | null; subscription_status: string }>();

  if (byCustomId) return { recipient: byCustomId, isCustomId: true };
  return null;
}
