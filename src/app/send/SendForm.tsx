"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { createLetterPayment } from "./actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};
const ID_REGEX = /^KKL-([A-Z0-9]{5}|[A-Za-z][A-Za-z0-9-]{2,19})$/i;

type RecipientInfo = {
  exists: boolean;
  fee: number;
  monthlyLimitReached: boolean;
  isPremium: boolean;
} | null;

export default function SendForm() {
  const [state, formAction, isPending] = useActionState(createLetterPayment, initialState);
  const [recipientId, setRecipientId] = useState("");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo>(null);
  const [fetching, setFetching] = useState(false);

  // 決済URLが返ってきたら localStorage に保存してから PayPay に遷移
  useEffect(() => {
    if (state?.success && state.data?.paymentUrl && state.data?.letterId) {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem("kakuletter_sent") ?? "[]");
        const updated = [state.data.letterId as string, ...saved.filter(id => id !== state.data!.letterId)];
        localStorage.setItem("kakuletter_sent", JSON.stringify(updated.slice(0, 20)));
      } catch { /* localStorage 使用不可の環境では無視 */ }
      window.location.href = state.data.paymentUrl as string;
    }
  }, [state]);

  const fetchRecipientInfo = useCallback(async (id: string) => {
    if (!ID_REGEX.test(id)) {
      setRecipientInfo(null);
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(`/api/recipient-fee?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setRecipientInfo(data);
    } catch {
      setRecipientInfo(null);
    } finally {
      setFetching(false);
    }
  }, []);

  // デバウンス: 500ms 後にフェッチ
  useEffect(() => {
    const timer = setTimeout(() => fetchRecipientInfo(recipientId), 500);
    return () => clearTimeout(timer);
  }, [recipientId, fetchRecipientInfo]);

  const fee = recipientInfo?.exists ? recipientInfo.fee : 310;
  const isPremiumRecipient = recipientInfo?.isPremium ?? false;
  const isLimitReached = recipientInfo?.monthlyLimitReached ?? false;
  const recipientFound = recipientInfo?.exists;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-stone-50 border border-stone-200 text-stone-600 text-sm rounded-xl px-4 py-3 text-center">
          PayPayに遷移します...
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          受取人のKAKULETTER ID <span className="text-rose-600">*</span>
        </label>
        <input
          type="text"
          name="recipient_display_id"
          placeholder="KKL-XXXXX"
          required
          maxLength={25}
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <p className="text-xs text-stone-400 mt-1.5">
          文通相手から教えてもらったIDを入力してください。
        </p>

        {/* リアルタイムフィードバック */}
        {recipientId && ID_REGEX.test(recipientId) && !fetching && (
          <p className={`text-xs mt-1.5 ${recipientFound ? "text-green-600" : "text-red-500"}`}>
            {recipientFound ? "✓ 受取人が見つかりました" : "このIDは登録されていません"}
          </p>
        )}
        {fetching && (
          <p className="text-xs text-stone-400 mt-1.5">確認中...</p>
        )}
      </div>

      {/* 手数料表示 */}
      <div className={`rounded-xl px-4 py-3 text-sm ${isPremiumRecipient ? "bg-amber-50 border border-amber-100 text-amber-800" : "bg-rose-50 border border-rose-100 text-rose-800"}`}>
        {isPremiumRecipient ? (
          <span>転送手数料：<strong>{fee.toLocaleString()}円</strong>（この受取人が設定した金額）</span>
        ) : (
          <span>転送手数料：<strong>310円</strong>（PayPayでお支払い）</span>
        )}
      </div>

      {isLimitReached && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 text-center">
          この受取人は今月の受取上限（10通）に達しています。
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !!state?.success || isLimitReached}
        className="w-full bg-rose-700 text-white py-3 rounded-xl font-medium hover:bg-rose-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "処理中..." : `PayPayで${fee.toLocaleString()}円を支払いに進む`}
      </button>
    </form>
  );
}
