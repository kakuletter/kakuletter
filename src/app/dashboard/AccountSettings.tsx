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
    <div className="settings-stack">
      {/* カスタムID */}
      <form action={idAction} className="settings-block">
        <label>
          カスタムID
          <input
            type="text"
            name="custom_id"
            defaultValue={customId ?? ""}
            placeholder="KKL-yourname"
            maxLength={25}
          />
          <small>KKL-＋小文字英字で始まる3〜20文字（英数字・ハイフン）。空欄で自動IDに戻す。</small>
        </label>
        <p className="settings-current">
          現在：<span>{customId ?? "未設定（自動IDを使用中）"}</span>
        </p>
        {idState?.error && <div className="form-error">{idState.error}</div>}
        {idState?.success && <div className="form-success">{idState.data?.message as string}</div>}
        <button className="action-button" type="submit" disabled={idPending}>
          {idPending ? "保存中..." : "カスタムIDを保存"}
        </button>
      </form>

      {/* 手数料の仕組み */}
      <div className="info-note">
        <strong>カスタムID宛の手数料について</strong>
        <p>カスタムID宛に手紙を送る人が、転送手数料を <b>500〜50,000円</b> の範囲で自由に設定します。</p>
        <p>手数料のうち <b>（手数料 − 310円）× 80%</b> があなたへの収益として還元されます。残りは運営の取り分（310円 ＋ 超過分の20%）です。</p>
      </div>

      {/* 収益の受取口座（Stripe Connect） */}
      <div className="settings-block">
        <p className="settings-label">収益の受取口座</p>
        {connectStatus === "active" ? (
          <div className="connect-box connect-active">
            <strong>✓ 口座連携が完了しています</strong>
            <p>カスタムID宛に手紙が届くと、あなたの取り分が自動で振り込まれます。</p>
            <button type="button" className="text-link" onClick={handleConnect} disabled={connecting}>
              {connecting ? "準備中..." : "口座情報を更新する"}
            </button>
          </div>
        ) : (
          <div className="connect-box">
            <p>
              {connectStatus === "pending"
                ? "口座連携が途中です。続きを完了すると、収益が自動で振り込まれるようになります。"
                : "口座を連携すると、カスタムID宛の収益が自動で振り込まれます。連携前は手動精算（運営への連絡）が必要です。"}
            </p>
            <button type="button" className="connect-button" onClick={handleConnect} disabled={connecting}>
              {connecting ? "準備中..." : connectStatus === "pending" ? "連携を続ける" : "口座を連携する"}
            </button>
          </div>
        )}
        {connectError && <div className="form-error">{connectError}</div>}
      </div>
    </div>
  );
}
