"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/types";

const CUSTOM_ID_REGEX = /^KKL-[a-z][a-z0-9-]{2,19}$/;

export async function updateCustomId(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("subscription_status")
    .eq("auth_id", user.id)
    .single<{ subscription_status: string }>();

  if (profile?.subscription_status !== "premium") {
    return { error: "プレミアム会員のみカスタムIDを設定できます。" };
  }

  const rawInput = (formData.get("custom_id") as string)?.trim() ?? "";
  // プレフィックスを除いた部分だけ小文字化して再結合
  const withoutPrefix = rawInput.replace(/^KKL-/i, "");
  const rawCustomId = withoutPrefix ? `KKL-${withoutPrefix.toLowerCase()}` : "";

  if (!rawCustomId) {
    // カスタムIDを削除（空欄送信で自動IDに戻す）
    await adminClient
      .from("users")
      .update({ custom_id: null })
      .eq("auth_id", user.id);
    return { success: true, data: { message: "カスタムIDを削除しました。" } };
  }

  if (!CUSTOM_ID_REGEX.test(rawCustomId)) {
    return {
      error: "カスタムIDは「KKL-」＋小文字英字で始まる3〜20文字（英数字・ハイフン使用可）にしてください。",
    };
  }

  // 他のユーザーがすでに使用していないかチェック
  const { data: existing } = await adminClient
    .from("users")
    .select("id")
    .eq("custom_id", rawCustomId)
    .neq("auth_id", user.id)
    .single();

  if (existing) {
    return { error: "このカスタムIDはすでに使用されています。別のIDをお試しください。" };
  }

  // 既存の display_id と衝突していないかチェック
  const { data: conflictDisplay } = await adminClient
    .from("users")
    .select("id")
    .eq("display_id", rawCustomId.toUpperCase())
    .single();

  if (conflictDisplay) {
    return { error: "このIDは使用できません。別のIDをお試しください。" };
  }

  await adminClient
    .from("users")
    .update({ custom_id: rawCustomId })
    .eq("auth_id", user.id);

  return { success: true, data: { message: `カスタムID「${rawCustomId}」を設定しました。` } };
}
