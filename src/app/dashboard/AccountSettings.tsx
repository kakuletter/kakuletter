"use client";

import { useActionState, useState } from "react";
import { updateCustomId } from "./actions";

type Props = {
  customId: string | null;
  connectStatus: "none" | "pending" | "active";
};

export default function AccountSettings({ customId, connectStatus }: Props) {
  const [idState, idAction, idPending] = useActionState(updateCustomId, {});
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  async function handleConnect() {
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setConnectError(json.error ?? "口座連携の準備に失敗しました。");
        setConnecting(false);
      }
    } catch {
      setConnectError("通信に失敗しました。時間をおいて再度お試しください。");
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* カスタムID */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1">カスタムID</p>
        <p className="text-xs text-stone-400 mb-3">
          現在：<span className="font-mono font-medium text-stone-700">{customId ?? "未設定（自動IDを使用中）"}</span>
        </p>
        <form action={idAction} className="flex gap-2">
          <input
            type="text"
            name="custom_id"
            defaultValue={customId ?? ""}
            placeholder="KKL-yourname"
            maxLength={25}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            disabled={idPending}
            className="bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-800 disabled:opacity-60"
          >
            保存
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-1.5">
          KKL-＋小文字英字で始まる3〜20文字（英数字・ハイフン）。空欄で自動IDに戻す。
        </p>
        {idState?.error && (
          <p className="text-xs text-red-600 mt-1">{idState.error}</p>
        )}
        {idState?.success && (
          <p className="text-xs text-green-600 mt-1">{idState.data?.message as string}</p>
        )}
      </div>

      {/* 手数料の仕組み（カスタムID宛） */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-sm font-medium text-amber-900">カスタムID宛の手数料について</p>
        <p className="text-xs text-amber-800">
          カスタムID宛に手紙を送る人が、転送手数料を <strong>500〜50,000円</strong> の範囲で自由に設定します。
        </p>
        <p className="text-xs text-amber-800">
          手数料のうち <strong>（手数料 − 310円）× 80%</strong> があなたへの収益として還元されます。
          残りは運営の取り分（310円 ＋ 超過分の20%）です。
        </p>
      </div>

      {/* 振込先（Stripe Connect）連携 */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1">収益の受取口座</p>
        {connectStatus === "active" ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-2">
            <p className="text-sm text-green-800 font-medium">✓ 口座連携が完了しています</p>
            <p className="text-xs text-green-700">
              カスタムID宛に手紙が届くと、あなたの取り分が自動で振り込まれます。
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="text-xs text-green-700 underline hover:text-green-900 disabled:opacity-60"
            >
              {connecting ? "準備中..." : "口座情報を更新する"}
            </button>
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs text-stone-500">
              {connectStatus === "pending"
                ? "口座連携が途中です。続きを完了すると、収益が自動で振り込まれるようになります。"
                : "口座を連携すると、カスタムID宛の収益が自動で振り込まれます。連携前は手動精算（運営への連絡）が必要です。"}
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="bg-[#635BFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4E47D0] disabled:opacity-60"
            >
              {connecting ? "準備中..." : connectStatus === "pending" ? "連携を続ける" : "口座を連携する"}
            </button>
          </div>
        )}
        {connectError && <p className="text-xs text-red-600 mt-1">{connectError}</p>}
      </div>
    </div>
  );
}
