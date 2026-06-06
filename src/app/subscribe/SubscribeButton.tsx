"use client";

import { useState } from "react";

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-rose-700 text-white py-3 rounded-xl font-medium hover:bg-rose-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "処理中..." : "プレミアムプランに登録する（¥980/月）"}
      </button>
    </div>
  );
}
