"use client";

import { useActionState } from "react";
import { registerUser } from "../actions";
import { PREFECTURES, formatPostalCode } from "@/lib/utils";
import type { ActionState } from "@/types";
import { useState } from "react";

const initialState: ActionState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const [postalCode, setPostalCode] = useState("");

  function handlePostalCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPostalCode(formatPostalCode(e.target.value));
  }

  if (state?.success && state.data?.needsConfirmation) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="text-4xl">✉️</div>
        <h2 className="font-semibold text-stone-900 text-lg">確認メールを送信しました</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          登録したメールアドレスに確認メールを送信しました。<br />
          メール内のリンクをクリックすると登録が完了し、<br />
          ログインできるようになります。
        </p>
        <p className="text-xs text-stone-400">
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            メールアドレス <span className="text-rose-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="example@email.com"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            パスワード <span className="text-rose-600">*</span>
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="6文字以上"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          お名前（本名） <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          name="real_name"
          required
          autoComplete="name"
          placeholder="山田 太郎"
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        <p className="text-xs text-stone-400 mt-1">
          手紙の転送に使用します。相手には公開されません。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          郵便番号 <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          name="postal_code"
          required
          value={postalCode}
          onChange={handlePostalCodeChange}
          placeholder="000-0000"
          maxLength={8}
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            都道府県 <span className="text-rose-600">*</span>
          </label>
          <select
            name="prefecture"
            required
            defaultValue=""
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
          >
            <option value="" disabled>選択してください</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            市区町村 <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            name="city"
            required
            placeholder="渋谷区"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          番地 <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          name="address_line"
          required
          placeholder="道玄坂1-2-3"
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          建物名・部屋番号
        </label>
        <input
          type="text"
          name="building"
          placeholder="〇〇マンション 101号室（任意）"
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <p className="text-xs text-stone-400 bg-stone-50 rounded-lg p-3 leading-relaxed">
        登録した住所は、手紙の転送にのみ使用します。文通相手に公開されることはありません。
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-700 text-white py-3 rounded-full font-medium hover:bg-rose-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "登録中..." : "登録してIDを取得する"}
      </button>
    </form>
  );
}
