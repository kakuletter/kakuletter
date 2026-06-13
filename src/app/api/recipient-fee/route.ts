import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LETTER_FEE } from "@/lib/stripe";
import { RECIPIENT_ID_REGEX } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("id") ?? "";

  if (!RECIPIENT_ID_REGEX.test(rawId)) {
    return NextResponse.json({ exists: false });
  }

  const adminClient = createAdminClient();
  const result = await lookupRecipient(adminClient, rawId);

  if (!result) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    fee: DEFAULT_LETTER_FEE,
    isCustomId: result.isCustomId,
  });
}

async function lookupRecipient(
  adminClient: ReturnType<typeof createAdminClient>,
  rawId: string
): Promise<{ isCustomId: boolean } | null> {
  const { data: byDisplayId } = await adminClient
    .from("users")
    .select("id")
    .eq("display_id", rawId.toUpperCase())
    .single<{ id: string }>();

  if (byDisplayId) return { isCustomId: false };

  const normalizedCustomId = `KKL-${rawId.replace(/^KKL-/i, "").toLowerCase()}`;
  const { data: byCustomId } = await adminClient
    .from("users")
    .select("id")
    .eq("custom_id", normalizedCustomId)
    .single<{ id: string }>();

  if (byCustomId) return { isCustomId: true };
  return null;
}
