import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LETTER_FEE, FREE_TIER_MONTHLY_LIMIT } from "@/lib/stripe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("id") ?? "";

  if (!/^KKL-[A-Za-z0-9][A-Za-z0-9-]{2,19}$|^KKL-[A-Z0-9]{5}$/.test(rawId)) {
    return NextResponse.json({ exists: false });
  }

  const adminClient = createAdminClient();
  const result = await lookupRecipient(adminClient, rawId);

  if (!result) {
    return NextResponse.json({ exists: false });
  }

  const { recipient, isCustomId } = result;
  const isPremium = recipient.subscription_status === "premium";

  // 無料会員の月間受取上限チェック（カスタムID = premium なので実質スキップ）
  let monthlyLimitReached = false;
  if (!isPremium) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await adminClient
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("recipient_display_id", recipient.display_id)
      .neq("status", "payment_pending")
      .gte("received_at", startOfMonth);

    if ((count ?? 0) >= FREE_TIER_MONTHLY_LIMIT) {
      monthlyLimitReached = true;
    }
  }

  return NextResponse.json({
    exists: true,
    fee: DEFAULT_LETTER_FEE,
    monthlyLimitReached,
    isPremium,
    isCustomId,
  });
}

async function lookupRecipient(
  adminClient: ReturnType<typeof createAdminClient>,
  rawId: string
): Promise<{ recipient: { id: string; display_id: string; subscription_status: string }; isCustomId: boolean } | null> {
  const { data: byDisplayId } = await adminClient
    .from("users")
    .select("id, display_id, subscription_status")
    .eq("display_id", rawId.toUpperCase())
    .single<{ id: string; display_id: string; subscription_status: string }>();

  if (byDisplayId) return { recipient: byDisplayId, isCustomId: false };

  const normalizedCustomId = `KKL-${rawId.replace(/^KKL-/i, "").toLowerCase()}`;
  const { data: byCustomId } = await adminClient
    .from("users")
    .select("id, display_id, subscription_status")
    .eq("custom_id", normalizedCustomId)
    .single<{ id: string; display_id: string; subscription_status: string }>();

  if (byCustomId) return { recipient: byCustomId, isCustomId: true };
  return null;
}
