import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentStatus } from "@/lib/paypay";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: { merchantPaymentId?: string; state?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { merchantPaymentId } = payload;

  // merchantPaymentId は letter.id（UUID）。形式を検証。
  if (!merchantPaymentId || !UUID_REGEX.test(merchantPaymentId)) {
    return NextResponse.json({ ok: true });
  }

  // webhook本文の state は信用しない。
  // 署名検証の代わりに、認証付き PayPay API で実際の支払い状態を再確認することで
  // 偽装POSTによる不正なステータス更新を防ぐ。
  const status = await getPaymentStatus(merchantPaymentId);

  if (status === "COMPLETED") {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("letters")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", merchantPaymentId)
      .eq("status", "payment_pending");

    if (error) {
      // DB 更新に失敗 → 500 を返して PayPay に再送させる（支払い済みなのに未決済表示を防ぐ）
      console.error("[PayPay] letter update failed:", error.message);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
