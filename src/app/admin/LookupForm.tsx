"use client";

import { useActionState } from "react";
import { lookupRecipient, registerLetter } from "./actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export default function LookupForm() {
  const [lookupState, lookupAction, isLooking] = useActionState(lookupRecipient, initialState);
  const [registerState, registerAction, isRegistering] = useActionState(registerLetter, initialState);

  const recipientData = lookupState?.success ? lookupState.data : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* 検索フォーム */}
      <form action={lookupAction} style={{ display: "grid", gap: 12 }}>
        <label>
          受取人ID
          <span className="id-input">
            <b>KKL-</b>
            <input type="text" name="display_id" required placeholder="XXXXX" maxLength={20} autoComplete="off" />
          </span>
        </label>
        {lookupState?.error && <div className="form-error">{lookupState.error}</div>}
        <button type="submit" className="action-button is-compact" disabled={isLooking}>
          {isLooking ? "検索中..." : "検索"}
        </button>
      </form>

      {/* 検索結果 */}
      {recipientData && (
        <div className="subcard">
          <p className="eyebrow" style={{ margin: 0 }}>検索結果</p>
          <div className="kv"><span>ID</span><strong style={{ fontFamily: "monospace" }}>{recipientData.display_id as string}</strong></div>
          <div className="kv"><span>氏名</span><strong>{recipientData.real_name as string}</strong></div>
          <div className="kv"><span>住所</span><strong>{recipientData.full_address as string}</strong></div>

          {/* 受付登録フォーム */}
          <form action={registerAction} style={{ display: "grid", gap: 12, paddingTop: 13, borderTop: "1px solid var(--line)" }}>
            <input type="hidden" name="recipient_display_id" value={recipientData.display_id as string} />
            <label>
              管理メモ（任意）
              <input type="text" name="admin_notes" placeholder="差出人など" />
            </label>
            {registerState?.error && <div className="form-error">{registerState.error}</div>}
            {registerState?.success && <div className="form-success">{registerState.data?.message as string}</div>}
            <button type="submit" className="action-button is-compact" disabled={isRegistering}>
              {isRegistering ? "登録中..." : "受付済みとして登録する"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
