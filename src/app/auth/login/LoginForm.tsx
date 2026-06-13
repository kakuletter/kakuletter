"use client";

import { useActionState } from "react";
import { loginUser } from "../actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUser, initialState);

  return (
    <form action={formAction} className="main-card login-form">
      {state?.error && <div className="form-error">{state.error}</div>}

      <label>
        メールアドレス
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="example@email.com"
        />
      </label>

      <label>
        パスワード
        <input type="password" name="password" required autoComplete="current-password" />
      </label>

      <button className="action-button" type="submit" disabled={isPending}>
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
