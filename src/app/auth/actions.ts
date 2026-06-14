"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDisplayId } from "@/lib/utils";
import type { ActionState } from "@/types";

export async function registerUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const realName = formData.get("real_name") as string;
  const postalCode = formData.get("postal_code") as string;
  const prefecture = formData.get("prefecture") as string;
  const city = formData.get("city") as string;
  const addressLine = formData.get("address_line") as string;
  const building = (formData.get("building") as string) || null;

  if (!email || !password || !realName || !postalCode || !prefecture || !city || !addressLine) {
    return { error: "すべての必須項目を入力してください。" };
  }

  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください。" };
  }

  if (!/^\d{3}-\d{4}$/.test(postalCode)) {
    return { error: "郵便番号は「000-0000」の形式で入力してください。" };
  }

  if (realName.length > 100) {
    return { error: "お名前は100文字以内で入力してください。" };
  }

  if (city.length > 100 || addressLine.length > 200) {
    return { error: "住所が長すぎます。" };
  }

  if (building && building.length > 200) {
    return { error: "建物名が長すぎます。" };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { error: "このメールアドレスはすでに登録されています。" };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "ユーザー作成に失敗しました。" };
  }

  const adminClient = createAdminClient();

  let profileCreated = false;
  let registerError = "ID発行に失敗しました。再度お試しください。";

  for (let attempt = 0; attempt < 10; attempt++) {
    const displayId = generateDisplayId();
    const { error: insertError } = await adminClient.from("users").insert({
      auth_id: authData.user.id,
      display_id: displayId,
      real_name: realName,
      postal_code: postalCode,
      prefecture,
      city,
      address_line: addressLine,
      building,
      email,
    });

    if (!insertError) {
      profileCreated = true;
      break;
    }

    if (insertError.code === "23503") {
      // signUp が既存メールアドレスに対して偽のユーザーIDを返した場合
      // （新規 auth ユーザーは作成されていないため削除不要）
      return { error: "このメールアドレスはすでに登録されています。" };
    }
    if (insertError.code !== "23505") {
      console.error("[register] insert error:", insertError.code, insertError.message);
      registerError = "プロフィールの作成に失敗しました。時間をおいて再度お試しください。";
      break;
    }
    // 23505 = display_id 衝突 → 別IDで再試行
  }

  if (!profileCreated) {
    // プロフィール作成に失敗した場合、孤立した Auth ユーザーを削除して
    // 同じメールアドレスで再登録できるようにする（原子性の担保）。
    // deleteUser は例外ではなく { error } を返すため、戻り値も確認する。
    try {
      const { error: delAuthError } = await adminClient.auth.admin.deleteUser(authData.user.id);
      if (delAuthError) {
        console.error("[register] auth rollback failed:", delAuthError.message);
      }
    } catch (e) {
      console.error("[register] auth rollback threw:", e instanceof Error ? e.message : String(e));
    }
    return { error: registerError };
  }

  // メール確認が必要な場合はダッシュボードへ遷移せず完了メッセージを返す
  if (!authData.session) {
    return { success: true, data: { needsConfirmation: true } };
  }

  redirect("/dashboard");
}

export async function loginUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "メールアドレスの確認が完了していません。受信トレイの確認メールを開いてください。" };
    }
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/dashboard");
}
