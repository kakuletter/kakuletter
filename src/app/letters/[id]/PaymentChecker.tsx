"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentChecker({ letterId }: { letterId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleCheck() {
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

  return (
    <div className="space-y-3 text-center">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-stone-900 disabled:opacity-60"
      >
        {loading ? "確認中..." : "支払いを確認する"}
      </button>
      {message && (
        <p className="text-sm text-stone-500">{message}</p>
      )}
    </div>
  );
}
