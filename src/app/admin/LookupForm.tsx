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
    <div className="space-y-6">
      {/* 検索フォーム */}
      <form action={lookupAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            受取人ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="display_id"
              required
              placeholder="KKL-XXXXX"
              maxLength={9}
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
            />
            <button
              type="submit"
              disabled={isLooking}
              className="bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-900 disabled:opacity-60"
            >
              {isLooking ? "検索中..." : "検索"}
            </button>
          </div>
        </div>

        {lookupState?.error && (
          <p className="text-red-600 text-sm">{lookupState.error}</p>
        )}
      </form>

      {/* 検索結果 */}
      {recipientData && (
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
          <p className="text-xs text-stone-500 uppercase font-medium tracking-wide">検索結果</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-stone-500">ID：</span>
              <span className="font-mono font-semibold text-stone-900">{recipientData.display_id as string}</span>
            </p>
            <p className="text-sm">
              <span className="text-stone-500">氏名：</span>
              <span className="font-semibold text-stone-900">{recipientData.real_name as string}</span>
            </p>
            <p className="text-sm">
              <span className="text-stone-500">住所：</span>
              <span className="text-stone-900">{recipientData.full_address as string}</span>
            </p>
          </div>

          {/* 受付登録フォーム */}
          <form action={registerAction} className="pt-3 border-t border-stone-200 space-y-3">
            <input type="hidden" name="recipient_display_id" value={recipientData.display_id as string} />
            <div>
              <label className="block text-xs text-stone-500 mb-1">管理メモ（任意）</label>
              <input
                type="text"
                name="admin_notes"
                placeholder="差出人など"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            {registerState?.error && (
              <p className="text-red-600 text-sm">{registerState.error}</p>
            )}
            {registerState?.success && (
              <p className="text-green-600 text-sm">{registerState.data?.message as string}</p>
            )}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-rose-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-rose-800 disabled:opacity-60"
            >
              {isRegistering ? "登録中..." : "受付済みとして登録する"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
