import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookHeader } from "@/lib/paypay";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const header = request.headers.get("x-paypay-signature") ?? "";

  // 署名検証（本番では必須。サンドボックスでは省略可）
  const isValid = await verifyWebhookHeader(rawBody, header);
  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { merchantPaymentId?: string; state?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { merchantPaymentId, state } = payload;

  if (state === "COMPLETED" && merchantPaymentId) {
    const adminClient = createAdminClient();
    await adminClient
      .from("letters")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", merchantPaymentId)
      .eq("status", "payment_pending");
  }

  return NextResponse.json({ ok: true });
}
