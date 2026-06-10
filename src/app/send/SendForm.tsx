"use client";

import { useActionState, useEffect, useState, useCallback, useRef } from "react";
import { createLetterPayment } from "./actions";
import { RECIPIENT_ID_REGEX } from "@/lib/utils";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

const MIN_CUSTOM_AMOUNT = 500;
const MAX_CUSTOM_AMOUNT = 50000;
const QUICK_AMOUNTS = [500, 1000, 3000, 5000, 10000, 30000];

type RecipientInfo = {
  exists: boolean;
  fee: number;
  monthlyLimitReached: boolean;
  isPremium: boolean;
  isCustomId: boolean;
} | null;

// 入力値を正規化：先頭に貼り付けられた「KKL-」を除去し、使用可能文字以外を取り除く
function normalizeSuffix(value: string): string {
  return value
    .replace(/\s/g, "")
    .replace(/^kkl-/i, "")
    .replace(/[^A-Za-z0-9-]/g, "");
}

export default function SendForm() {
  const [state, formAction, isPending] = useActionState(createLetterPayment, initialState);
  const [idSuffix, setIdSuffix] = useState("");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo>(null);
  const [fetching, setFetching] = useState(false);
  const [customAmount, setCustomAmount] = useState(1000);
  const formRef = useRef<HTMLFormElement>(null);
  const methodRef = useRef<HTMLInputElement>(null);

  // 決済URLが返ってきたらリダイレクト
  useEffect(() => {
    if (state?.success && state.data?.paymentUrl && state.data?.letterId) {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem("kakuletter_sent") ?? "[]");
        const updated = [state.data.letterId as string, ...saved.filter(id => id !== state.data!.letterId)];
        localStorage.setItem("kakuletter_sent", JSON.stringify(updated.slice(0, 20)));
      } catch { /* ignore */ }
      window.location.href = state.data.paymentUrl as string;
    }
  }, [state]);

  const fetchRecipientInfo = useCallback(async (id: string) => {
    if (!RECIPIENT_ID_REGEX.test(id)) {
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

  const fullId = idSuffix ? `KKL-${idSuffix}` : "";

  useEffect(() => {
    const timer = setTimeout(() => fetchRecipientInfo(fullId), 500);
    return () => clearTimeout(timer);
  }, [fullId, fetchRecipientInfo]);

  function submit(method: "paypay" | "stripe") {
    if (methodRef.current) methodRef.current.value = method;
    formRef.current?.requestSubmit();
  }

  const isCustomId = recipientInfo?.isCustomId ?? false;
  const isLimitReached = recipientInfo?.monthlyLimitReached ?? false;
  const recipientFound = recipientInfo?.exists;
  const canSubmit = !isPending && !state?.success && !isLimitReached && recipientFound;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="paymentMethod" ref={methodRef} defaultValue="paypay" />
      <input type="hidden" name="customAmount" value={isCustomId ? customAmount : ""} readOnly />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-stone-50 border border-stone-200 text-stone-600 text-sm rounded-xl px-4 py-3 text-center">
          決済ページに移動します...
        </div>
      )}

      {/* 受取人ID */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          受取人のKAKULETTER ID <span className="text-rose-600">*</span>
        </label>
        <input type="hidden" name="recipient_display_id" value={fullId} />
        <div className="flex items-stretch rounded-xl border border-stone-300 overflow-hidden focus-within:ring-2 focus-within:ring-rose-400">
          <span className="inline-flex items-center px-4 bg-stone-100 text-stone-500 font-mono text-base tracking-widest select-none border-r border-stone-300">
            KKL-
          </span>
          <input
            type="text"
            inputMode="text"
            placeholder="XXXXX"
            maxLength={20}
            value={idSuffix}
            onChange={(e) => setIdSuffix(normalizeSuffix(e.target.value))}
            className="flex-1 min-w-0 px-4 py-3 text-base font-mono tracking-widest focus:outline-none"
          />
        </div>
        <p className="text-xs text-stone-400 mt-1.5">
          文通相手から教えてもらったIDの「KKL-」より後ろを入力してください。
        </p>
        {fullId && RECIPIENT_ID_REGEX.test(fullId) && !fetching && (
          <p className={`text-xs mt-1.5 ${recipientFound ? "text-green-600" : "text-red-500"}`}>
            {recipientFound
              ? isCustomId
                ? "✓ カスタムIDが見つかりました"
                : "✓ 受取人が見つかりました"
              : "このIDは登録されていません"}
          </p>
        )}
        {fetching && <p className="text-xs text-stone-400 mt-1.5">確認中...</p>}
      </div>

      {/* カスタムID宛：金額入力 */}
      {recipientFound && isCustomId && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
            このIDはプレミアム会員のカスタムIDです。<strong>500円〜50,000円</strong>の範囲で転送手数料を設定してください。
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              転送手数料：<span className="text-lg font-bold text-rose-700">{customAmount.toLocaleString()}円</span>
            </label>
            <input
              type="range"
              min={MIN_CUSTOM_AMOUNT}
              max={MAX_CUSTOM_AMOUNT}
              step={100}
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>500円</span>
              <span>50,000円</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCustomAmount(amt)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  customAmount === amt
                    ? "bg-rose-700 text-white border-rose-700"
                    : "bg-white text-stone-700 border-stone-300 hover:border-rose-400"
                }`}
              >
                {amt.toLocaleString()}円
              </button>
            ))}
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs text-stone-600 space-y-1">
            <p>・運営受取：<strong>{(310 + Math.floor((customAmount - 310) * 0.2)).toLocaleString()}円</strong>（310円 + 超過分20%）</p>
            <p>・受取人受取：<strong>{Math.floor((customAmount - 310) * 0.8).toLocaleString()}円</strong>（超過分80%）</p>
          </div>
        </div>
      )}

      {/* 通常ID宛：固定310円 */}
      {recipientFound && !isCustomId && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-800">
          転送手数料：<strong>310円</strong>（固定）
        </div>
      )}

      {isLimitReached && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 text-center">
          この受取人は今月の受取上限（10通）に達しています。
        </div>
      )}

      {/* 決済ボタン */}
      {isCustomId ? (
        // カスタムID宛：Stripeのみ
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => submit("stripe")}
          className="w-full bg-rose-700 text-white py-3 rounded-xl font-medium hover:bg-rose-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "処理中..." : `Stripeで${customAmount.toLocaleString()}円を支払いに進む`}
        </button>
      ) : (
        // 通常ID宛：PayPay または Stripe
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => submit("paypay")}
            className="bg-[#00B900] text-white py-3 rounded-xl font-medium hover:bg-[#009900] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? "..." : "PayPayで支払う"}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => submit("stripe")}
            className="bg-[#635BFF] text-white py-3 rounded-xl font-medium hover:bg-[#4E47D0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? "..." : "カードで支払う"}
          </button>
        </div>
      )}

      {!recipientFound && !fetching && fullId && RECIPIENT_ID_REGEX.test(fullId) && (
        <p className="text-center text-xs text-stone-400">
          有効なIDを入力すると決済ボタンが表示されます。
        </p>
      )}
      {!idSuffix && (
        <p className="text-center text-xs text-stone-400">
          受取人IDを入力すると決済ボタンが表示されます。
        </p>
      )}
    </form>
  );
}
