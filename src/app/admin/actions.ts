"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState, UserProfile } from "@/types";

async function assertAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です。" };

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("users")
    .select("is_admin")
    .eq("auth_id", user.id)
    .single();

  if (!data?.is_admin) return { error: "管理者権限が必要です。" };
  return { userId: user.id };
}

export async function lookupRecipient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await assertAdmin();
  if ("error" in check) return check;

  const displayId = (formData.get("display_id") as string)?.trim().toUpperCase();
  if (!displayId || !/^KKL-[A-Z0-9]{5}$/.test(displayId)) {
    return { error: "IDの形式が正しくありません（例: KKL-AB3XY）。" };
  }

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("users")
    .select("display_id, real_name, postal_code, prefecture, city, address_line, building")
    .eq("display_id", displayId)
    .single<Pick<UserProfile, "display_id" | "real_name" | "postal_code" | "prefecture" | "city" | "address_line" | "building">>();

  if (!data) return { error: `ID「${displayId}」は登録されていません。` };

  return {
    success: true,
    data: {
      display_id: data.display_id,
      real_name: data.real_name,
      full_address: `〒${data.postal_code} ${data.prefecture}${data.city}${data.address_line}${data.building ? ` ${data.building}` : ""}`,
    },
  };
}

export async function registerLetter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await assertAdmin();
  if ("error" in check) return check;

  const recipientDisplayId = (formData.get("recipient_display_id") as string)?.trim().toUpperCase();
  const adminNotes = (formData.get("admin_notes") as string) || null;

  if (!recipientDisplayId) return { error: "受取人IDが不明です。" };

  const adminClient = createAdminClient();

  const { data: recipient } = await adminClient
    .from("users")
    .select("id")
    .eq("display_id", recipientDisplayId)
    .single();

  if (!recipient) return { error: "該当するユーザーが見つかりません。" };

  const { error } = await adminClient.from("letters").insert({
    recipient_display_id: recipientDisplayId,
    status: "received",
    admin_notes: adminNotes,
  });

  if (error) return { error: "手紙の登録に失敗しました。" };

  return { success: true, data: { message: "手紙を受付済みとして登録しました。" } };
}

export async function scanBarcode(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await assertAdmin();
  if ("error" in check) return check;

  const letterId = (formData.get("letter_id") as string)?.trim();
  if (!letterId) return { error: "バーコードのIDを入力してください。" };

  const adminClient = createAdminClient();
  const { data: letter } = await adminClient
    .from("letters")
    .select("id, recipient_display_id, status")
    .eq("id", letterId)
    .single();

  if (!letter) return { error: "このバーコードは無効です。" };
  if (letter.status === "payment_pending") return { error: "この手紙はまだ支払いが完了していません。" };

  const { data: recipient } = await adminClient
    .from("users")
    .select("real_name, postal_code, prefecture, city, address_line, building")
    .eq("display_id", letter.recipient_display_id)
    .single<Pick<UserProfile, "real_name" | "postal_code" | "prefecture" | "city" | "address_line" | "building">>();

  if (!recipient) return { error: "受取人情報が見つかりません。" };

  return {
    success: true,
    data: {
      letter_id: letter.id,
      recipient_display_id: letter.recipient_display_id,
      status: letter.status,
      real_name: recipient.real_name,
      full_address: `〒${recipient.postal_code} ${recipient.prefecture}${recipient.city}${recipient.address_line}${recipient.building ? ` ${recipient.building}` : ""}`,
    },
  };
}

export async function markPayoutPaid(
  letterIds: string[]
): Promise<{ error?: string }> {
  const check = await assertAdmin();
  if ("error" in check) return check;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("letters")
    .update({ payout_status: "paid" })
    .in("id", letterIds)
    .eq("payout_status", "pending");

  if (error) return { error: "精算処理に失敗しました。" };
  return {};
}

export async function updateLetterStatus(
  letterId: string,
  status: "received" | "forwarded" | "delivered"
): Promise<{ error?: string }> {
  const check = await assertAdmin();
  if ("error" in check) return check;

  const adminClient = createAdminClient();
  const updateData: Record<string, unknown> = { status };
  if (status === "forwarded") updateData.forwarded_at = new Date().toISOString();
  if (status === "delivered") updateData.delivered_at = new Date().toISOString();

  const { error } = await adminClient
    .from("letters")
    .update(updateData)
    .eq("id", letterId);

  if (error) return { error: "ステータスの更新に失敗しました。" };
  return {};
}
