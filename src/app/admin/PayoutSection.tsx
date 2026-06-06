"use client";

import { useState, useTransition } from "react";
import { markPayoutPaid } from "./actions";

type PayoutLetter = {
  id: string;
  recipient_display_id: string;
  payout_amount: number;
  fee_amount: number;
  received_at: string;
};

type Props = {
  letters: PayoutLetter[];
};

export default function PayoutSection({ letters }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const total = letters
    .filter((l) => selected.has(l.id))
    .reduce((sum, l) => sum + l.payout_amount, 0);

  function toggleAll() {
    if (selected.size === letters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(letters.map((l) => l.id)));
    }
  }

  function handlePayout() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await markPayoutPaid(Array.from(selected));
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`${selected.size}件を精算済みにしました。`);
        setSelected(new Set());
      }
    });
  }

  if (letters.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-4">精算待ちの収益はありません</p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {message}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-2 text-left">
                <input type="checkbox" checked={selected.size === letters.length} onChange={toggleAll} />
              </th>
              <th className="px-4 py-2 text-left text-stone-600 font-medium">受取人ID</th>
              <th className="px-4 py-2 text-left text-stone-600 font-medium">手数料</th>
              <th className="px-4 py-2 text-left text-stone-600 font-medium">支払額（80%）</th>
              <th className="px-4 py-2 text-left text-stone-600 font-medium">受付日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {letters.map((l) => (
              <tr key={l.id} className={selected.has(l.id) ? "bg-amber-50" : ""}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => {
                      const next = new Set(selected);
                      if (next.has(l.id)) next.delete(l.id);
                      else next.add(l.id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td className="px-4 py-2 font-mono text-stone-900">{l.recipient_display_id}</td>
                <td className="px-4 py-2 text-stone-600">¥{l.fee_amount.toLocaleString()}</td>
                <td className="px-4 py-2 font-medium text-amber-700">¥{l.payout_amount.toLocaleString()}</td>
                <td className="px-4 py-2 text-stone-400">
                  {new Date(l.received_at).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-200">
        <p className="text-sm text-stone-600">
          選択：{selected.size}件　合計：<span className="font-bold text-amber-700">¥{total.toLocaleString()}</span>
        </p>
        <button
          onClick={handlePayout}
          disabled={selected.size === 0 || isPending}
          className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "処理中..." : "精算済みにする"}
        </button>
      </div>
    </div>
  );
}
