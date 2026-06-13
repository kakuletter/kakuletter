"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createQRPayment } from "@/lib/paypay";
import { stripe, DEFAULT_LETTER_FEE, calculateSplit, isConnectAccountReady } from "@/lib/stripe";
import { RECIPIENT_ID_REGEX } from "@/lib/utils";
import type { ActionState } from "@/types";

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

  if (!rawId || !RECIPIENT_ID_REGEX.test(rawId)) {
    return { error: "IDの形式が正しくありません（例: KKL-AB3XY）。" };
  }

  const adminClient = createAdminClient();

  const lookupResult = await lookupRecipient(adminClient, rawId);
  if (!lookupResult) {
    return { error: `ID「${rawId}」は登録されていません。` };
  }
  const { recipient, isCustomId } = lookupResult;

  // カスタムID宛はStripeのみ
  if (isCustomId && paymentMethod !== "stripe") {
    return { error: "カスタムIDへの送信にはStripe決済をご利用ください。" };
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

  // カスタムID宛の分配額を算出。
  let payoutAmount: number | null = null;
  let operatorCut = fee;
  if (isCustomId) {
    const split = calculateSplit(fee);
    payoutAmount = split.payoutAmount;
    operatorCut = split.operatorCut;

    // direct charge は受取人の連結アカウント上で決済するため、口座連携が必須。
    // 連携前は送信をブロックする（運営が資金を一切保有しない＝資金移動業を回避）。
    const ready =
      !!recipient.stripe_connect_account_id &&
      (await isConnectAccountReady(recipient.stripe_connect_account_id));
    if (!ready) {
      return {
        error: "この受取人はまだ受取口座の連携が完了していないため、送信できません。受取人に口座連携を依頼してください。",
      };
    }
  }

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
      // direct charge では受取人へ直接着金するため、決済完了＝精算済み扱い
      payout_status: isCustomId ? "paid" : "none",
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
      // カスタムID宛は direct charge：受取人の連結アカウント上で決済を作成し、
      // 運営の取り分だけを application_fee_amount として受け取る。
      // 顧客の支払いは受取人へ直接着金し、運営は資金を保有しない（資金移動業を回避）。
      // 通常ID宛（310円）は運営自身のサービス手数料なので、運営アカウントで決済する。
      const connectAccountId = isCustomId ? recipient.stripe_connect_account_id : null;

      const session = await stripe.checkout.sessions.create(
        {
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
          ...(connectAccountId ? { payment_intent_data: { application_fee_amount: operatorCut } } : {}),
          success_url: `${appUrl}/letters/${letter.id}?stripe_return=1`,
          cancel_url: `${appUrl}/send?canceled=1`,
          metadata: {
            type: "letter",
            letter_id: letter.id,
          },
        },
        // 連結アカウント上で決済を作成（direct charge）
        connectAccountId ? { stripeAccount: connectAccountId } : undefined
      );

      await adminClient
        .from("letters")
        .update({
          payment_url: session.url,
          stripe_session_id: session.id,
          stripe_connect_account_id: connectAccountId,
        })
        .eq("id", letter.id);

      return {
        success: true,
        data: { letterId: letter.id, paymentUrl: session.url, fee, paymentMethod: "stripe" },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Stripe] letter checkout error:", message);
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

type RecipientRow = {
  id: string;
  display_id: string;
  custom_id: string | null;
  stripe_connect_account_id: string | null;
};

async function lookupRecipient(
  adminClient: ReturnType<typeof createAdminClient>,
  rawId: string
): Promise<{ recipient: RecipientRow; isCustomId: boolean } | null> {
  const columns = "id, display_id, custom_id, stripe_connect_account_id";

  const { data: byDisplayId } = await adminClient
    .from("users")
    .select(columns)
    .eq("display_id", rawId.toUpperCase())
    .single<RecipientRow>();

  if (byDisplayId) return { recipient: byDisplayId, isCustomId: false };

  const normalizedCustomId = `KKL-${rawId.replace(/^KKL-/i, "").toLowerCase()}`;
  const { data: byCustomId } = await adminClient
    .from("users")
    .select(columns)
    .eq("custom_id", normalizedCustomId)
    .single<RecipientRow>();

  if (byCustomId) return { recipient: byCustomId, isCustomId: true };
  return null;
}
