"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
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
  isCustomId: boolean;
} | null;

// 入力値を正規化：先頭に貼り付けられた「KKL-」を除去し、使用可能文字以外を取り除く
function normalizeSuffix(value: string): string {
  return value
    .replace(/\s/g, "")
    .replace(/^kkl-/i, "")
    .replace(/[^A-Za-z0-9-]/g, "");
}

export default function SendForm({ initialId = "" }: { initialId?: string }) {
  const [state, formAction, isPending] = useActionState(createLetterPayment, initialState);
  const [idSuffix, setIdSuffix] = useState(() => normalizeSuffix(initialId));
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo>(null);
  const [fetching, setFetching] = useState(false);
  const [customAmount, setCustomAmount] = useState(1000);
  const [method, setMethod] = useState<"paypay" | "stripe">("paypay");

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
      setRecipientInfo(await res.json());
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

  const isCustomId = recipientInfo?.isCustomId ?? false;
  const recipientFound = recipientInfo?.exists ?? false;
  const validFormat = !!fullId && RECIPIENT_ID_REGEX.test(fullId);
  const canSubmit = !isPending && !state?.success && recipientFound;
  const paymentMethod = isCustomId ? "stripe" : method;

  const total = isCustomId ? customAmount : 310;
  const operatorCut = 310 + Math.floor((customAmount - 310) * 0.2);
  const payout = customAmount - operatorCut;

  function clampAmount(v: number) {
    if (Number.isNaN(v)) return MIN_CUSTOM_AMOUNT;
    return Math.min(MAX_CUSTOM_AMOUNT, Math.max(MIN_CUSTOM_AMOUNT, v));
  }

  return (
    <form action={formAction} className="main-card send-form">
      <input type="hidden" name="recipient_display_id" value={fullId} />
      <input type="hidden" name="customAmount" value={isCustomId ? customAmount : ""} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {state?.error && <div className="form-error">{state.error}</div>}
      {state?.success && <div className="form-success">決済ページに移動します...</div>}

      <label>
        受取人のKAKULETTER ID <em>*</em>
        <span className="id-input">
          <b>KKL-</b>
          <input
            type="text"
            inputMode="text"
            placeholder="XXXXX"
            maxLength={20}
            value={idSuffix}
            onChange={(e) => setIdSuffix(normalizeSuffix(e.target.value))}
          />
        </span>
        <small>文通相手から教えてもらったIDの「KKL-」より後ろを入力してください。</small>
      </label>

      {validFormat && !fetching && recipientFound && (
        <div className="recipient-result">
          <span className="recipient-avatar">{idSuffix.charAt(0).toUpperCase() || "K"}</span>
          <div>
            <small>受取人</small>
            <strong>{fullId}</strong>
          </div>
          <b>{isCustomId ? "応援できます" : "確認済み"}</b>
        </div>
      )}
      {validFormat && !fetching && !recipientFound && (
        <p className="form-error" style={{ margin: 0 }}>このIDは登録されていません。</p>
      )}
      {fetching && <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>確認中...</p>}

      {/* 基本料金 */}
      <div className="fee-box">
        <span><strong>基本料金</strong><small>1通あたり</small></span>
        <strong>310円</strong>
      </div>

      {/* カスタムID宛：応援金（合計額を設定） */}
      {recipientFound && isCustomId && (
        <div className="support-field">
          <span className="support-label-row">
            <strong>転送手数料（応援金込み）</strong>
            <small>500円〜50,000円の範囲で設定できます。</small>
          </span>
          <span className="money-input">
            <b>¥</b>
            <input
              type="number"
              min={MIN_CUSTOM_AMOUNT}
              max={MAX_CUSTOM_AMOUNT}
              step={100}
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              onBlur={(e) => setCustomAmount(clampAmount(Number(e.target.value)))}
            />
          </span>
          <div className="quick-amounts">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                className={customAmount === amt ? "is-active" : ""}
                onClick={() => setCustomAmount(amt)}
              >
                {amt.toLocaleString()}円
              </button>
            ))}
          </div>
          <div className="split-note">
            <p>・運営受取：<strong>{operatorCut.toLocaleString()}円</strong>（310円 + 超過分20%）</p>
            <p>・受取人受取：<strong>{payout.toLocaleString()}円</strong>（超過分80%）</p>
          </div>
        </div>
      )}

      {/* お支払い合計 */}
      <div className="total-box">
        <span>
          <strong>お支払い合計</strong>
          <small>{isCustomId ? "基本料金310円 ＋ 応援金" : "基本料金（個人間のため応援金なし）"}</small>
        </span>
        <strong>{total.toLocaleString()}円</strong>
      </div>

      {/* 決済方法（通常ID宛のみ選択可・カスタムID宛はカードのみ） */}
      {!isCustomId && (
        <fieldset>
          <legend>お支払い方法</legend>
          <div className="payment-options">
            <label>
              <input
                type="radio"
                name="payment_method_choice"
                value="paypay"
                checked={method === "paypay"}
                onChange={() => setMethod("paypay")}
              />
              <span className="pay-logo paypay">PayPay</span>
              <small>PayPayで支払う</small>
            </label>
            <label>
              <input
                type="radio"
                name="payment_method_choice"
                value="card"
                checked={method === "stripe"}
                onChange={() => setMethod("stripe")}
              />
              <span className="pay-logo card">CARD</span>
              <small>カードで支払う</small>
            </label>
          </div>
        </fieldset>
      )}

      <button className="action-button" type="submit" disabled={!canSubmit}>
        {isPending
          ? "処理中..."
          : !recipientFound
            ? "IDを入力してください"
            : `${total.toLocaleString()}円を支払いに進む`}
      </button>
      <p className="form-footnote">
        {isCustomId
          ? "カスタムID宛はカード決済（Stripe）でお支払いいただきます。"
          : "PayPay または カードでお支払いいただけます。"}
      </p>
    </form>
  );
}
