"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  letterId: string;
  paymentMethod: "paypay" | "stripe";
  stripeReturn?: boolean;
};

export default function PaymentChecker({ letterId, paymentMethod, stripeReturn }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [pollingDone, setPollingDone] = useState(false);

  // Stripe決済後のリダイレクト時：自動ポーリング（最大15秒）
  useEffect(() => {
    if (paymentMethod !== "stripe" || !stripeReturn) return;

    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      try {
        const res = await fetch(`/api/stripe/letter-check?letterId=${letterId}`);
        const json = await res.json();
        if (json.status && json.status !== "payment_pending") {
          router.refresh();
          return;
        }
      } catch { /* ignore */ }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setPollingDone(true);
      }
    };

    setTimeout(poll, 1500);
  }, [letterId, paymentMethod, stripeReturn, router]);

  // Stripe：手動確認
  async function handleStripeCheck() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/stripe/letter-check?letterId=${letterId}`);
      const json = await res.json();
      if (json.status && json.status !== "payment_pending") {
        router.refresh();
      } else {
        setMessage("まだ支払いが確認できません。Stripeでの支払いを完了してからお試しください。");
      }
    } catch {
      setMessage("確認に失敗しました。しばらく経ってから再試行してください。");
    }
    setLoading(false);
  }

  // PayPay：手動確認
  async function handlePayPayCheck() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/paypay/check?letterId=${letterId}`);
      const json = await res.json();
      if (json.paid) {
        router.refresh();
      } else {
        setMessage("まだ支払いが確認できません。PayPayアプリで支払いを完了してください。");
      }
    } catch {
      setMessage("確認に失敗しました。しばらく経ってから再試行してください。");
    }
    setLoading(false);
  }

  if (paymentMethod === "stripe") {
    const showButton = !stripeReturn || pollingDone;
    return (
      <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
        {stripeReturn && !pollingDone && (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>支払いを確認中...</p>
        )}
        {showButton && (
          <button type="button" className="outline-button is-compact" onClick={handleStripeCheck} disabled={loading}>
            {loading ? "確認中..." : "支払いを確認する"}
          </button>
        )}
        {message && <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
      <button type="button" className="outline-button is-compact" onClick={handlePayPayCheck} disabled={loading}>
        {loading ? "確認中..." : "支払いを確認する"}
      </button>
      {message && <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>{message}</p>}
    </div>
  );
}
