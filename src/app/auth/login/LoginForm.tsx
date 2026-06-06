"use client";

import { useActionState } from "react";
import { loginUser } from "../actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUser, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          メールアドレス
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
          パスワード
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-rose-700 text-white py-3 rounded-full font-medium hover:bg-rose-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
