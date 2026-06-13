"use client";

import { useActionState, useState } from "react";
import { registerUser } from "../actions";
import { PREFECTURES, formatPostalCode } from "@/lib/utils";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const [postalCode, setPostalCode] = useState("");

  function handlePostalCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPostalCode(formatPostalCode(e.target.value));
  }

  if (state?.success && state.data?.needsConfirmation) {
    return (
      <div className="main-card" style={{ textAlign: "center", display: "grid", gap: 14, padding: 36 }}>
        <div style={{ fontSize: 40 }}>✉️</div>
        <h2 style={{ margin: 0, fontSize: 18 }}>確認メールを送信しました</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13, lineHeight: 1.8 }}>
          登録したメールアドレスに確認メールを送信しました。<br />
          メール内のリンクをクリックすると登録が完了し、ログインできるようになります。
        </p>
        <p style={{ margin: 0, color: "#a8a29e", fontSize: 11 }}>
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="main-card register-form">
      {state?.error && <div className="form-error">{state.error}</div>}

      <div className="form-grid">
        <label>
          メールアドレス <em>*</em>
          <input type="email" name="email" required autoComplete="email" placeholder="example@email.com" />
        </label>
        <label>
          パスワード <em>*</em>
          <input type="password" name="password" required minLength={6} autoComplete="new-password" placeholder="6文字以上" />
        </label>
      </div>

      <label>
        お名前（本名） <em>*</em>
        <input type="text" name="real_name" required autoComplete="name" placeholder="山田 太郎" />
        <small>手紙の転送に使用します。相手には公開されません。</small>
      </label>

      <label>
        郵便番号 <em>*</em>
        <input
          type="text"
          name="postal_code"
          required
          value={postalCode}
          onChange={handlePostalCodeChange}
          placeholder="000-0000"
          maxLength={8}
        />
      </label>

      <div className="form-grid">
        <label>
          都道府県 <em>*</em>
          <select name="prefecture" required defaultValue="">
            <option value="" disabled>選択してください</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </label>
        <label>
          市区町村 <em>*</em>
          <input type="text" name="city" required placeholder="渋谷区" />
        </label>
      </div>

      <label>
        番地 <em>*</em>
        <input type="text" name="address_line" required placeholder="道玄坂1-2-3" />
      </label>

      <label>
        建物名・部屋番号
        <input type="text" name="building" placeholder="〇〇マンション 101号室（任意）" />
      </label>

      <div className="privacy-box">
        <span className="lock-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="10" width="14" height="10" rx="3" />
            <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
            <path d="M12 14v2.5" />
          </svg>
        </span>
        登録した住所は手紙の転送にのみ使用し、文通相手には公開されません。
      </div>

      <button className="action-button" type="submit" disabled={isPending}>
        {isPending ? "登録中..." : "登録してIDを取得する"}
      </button>
    </form>
  );
}
