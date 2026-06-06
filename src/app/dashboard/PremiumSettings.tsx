"use client";

import { useActionState } from "react";
import { updateCustomId, updateCustomFee } from "./actions";

type Props = {
  customId: string | null;
  customFee: number | null;
};

export default function PremiumSettings({ customId, customFee }: Props) {
  const [idState, idAction, idPending] = useActionState(updateCustomId, {});
  const [feeState, feeAction, feePending] = useActionState(updateCustomFee, {});

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

      {/* カスタム手数料 */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1">送り手の手数料（円）</p>
        <p className="text-xs text-stone-400 mb-3">
          現在：<span className="font-medium text-stone-700">{customFee ? `${customFee.toLocaleString()}円` : "310円（デフォルト）"}</span>
        </p>
        <form action={feeAction} className="flex gap-2">
          <input
            type="number"
            name="custom_fee"
            defaultValue={customFee ?? ""}
            placeholder="500"
            min={500}
            max={10000}
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            disabled={feePending}
            className="bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-800 disabled:opacity-60"
          >
            保存
          </button>
        </form>
        <p className="text-xs text-stone-400 mt-1.5">
          500円〜10,000円の範囲で設定可。空欄で310円（デフォルト）に戻す。
        </p>
        {feeState?.error && (
          <p className="text-xs text-red-600 mt-1">{feeState.error}</p>
        )}
        {feeState?.success && (
          <p className="text-xs text-green-600 mt-1">{feeState.data?.message as string}</p>
        )}
      </div>
    </div>
  );
}
