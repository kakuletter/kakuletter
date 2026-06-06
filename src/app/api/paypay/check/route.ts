import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentStatus } from "@/lib/paypay";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const letterId = searchParams.get("letterId");

  if (!letterId) {
    return NextResponse.json({ error: "letterId is required" }, { status: 400 });
  }

  // UUID（128ビット乱数）が鍵として機能するため認証不要
  const adminClient = createAdminClient();
  const { data: letter } = await adminClient
    .from("letters")
    .select("id")
    .eq("id", letterId)
    .single();

  if (!letter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PayPay API で支払い状態を確認
  const status = await getPaymentStatus(letterId);

  if (status === "COMPLETED") {
    await adminClient
      .from("letters")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", letterId)
      .eq("status", "payment_pending");

    return NextResponse.json({ paid: true });
  }

  return NextResponse.json({ paid: false, paymentStatus: status });
}
