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

  const rawInput = (formData.get("custom_id") as string)?.trim() ?? "";
  // プレフィックスを除いた部分だけ小文字化して再結合
  const withoutPrefix = rawInput.replace(/^KKL-/i, "");
  const rawCustomId = withoutPrefix ? `KKL-${withoutPrefix.toLowerCase()}` : "";

  if (!rawCustomId) {
    // カスタムIDを削除（空欄送信で自動IDに戻す）
    const { error: delError } = await adminClient
      .from("users")
      .update({ custom_id: null })
      .eq("auth_id", user.id);
    if (delError) {
      return { error: "更新に失敗しました。時間をおいて再度お試しください。" };
    }
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

  const { error: updateError } = await adminClient
    .from("users")
    .update({ custom_id: rawCustomId })
    .eq("auth_id", user.id);

  if (updateError) {
    // DB の UNIQUE 制約により、チェックと更新の間の競合もここで弾かれる
    if (updateError.code === "23505") {
      return { error: "このカスタムIDはすでに使用されています。別のIDをお試しください。" };
    }
    console.error("[updateCustomId] update error:", updateError.code, updateError.message);
    return { error: "更新に失敗しました。時間をおいて再度お試しください。" };
  }

  return { success: true, data: { message: `カスタムID「${rawCustomId}」を設定しました。` } };
}
