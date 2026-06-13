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
    return <p className="empty-row">精算待ちの収益はありません</p>;
  }

  return (
    <div>
      {message && <div className="form-success" style={{ marginBottom: 14 }}>{message}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={selected.size === letters.length} onChange={toggleAll} /></th>
              <th>受取人ID</th>
              <th>手数料</th>
              <th>支払額（80%）</th>
              <th>受付日</th>
            </tr>
          </thead>
          <tbody>
            {letters.map((l) => (
              <tr key={l.id} className={selected.has(l.id) ? "is-selected" : ""}>
                <td>
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
                <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{l.recipient_display_id}</td>
                <td style={{ color: "var(--muted)" }}>¥{l.fee_amount.toLocaleString()}</td>
                <td style={{ color: "var(--rose)", fontWeight: 700 }}>¥{l.payout_amount.toLocaleString()}</td>
                <td style={{ color: "var(--muted)" }}>{new Date(l.received_at).toLocaleDateString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="payout-bar">
        <p style={{ margin: 0 }}>
          選択：{selected.size}件　合計：<strong>¥{total.toLocaleString()}</strong>
        </p>
        <button
          type="button"
          className="action-button is-compact"
          onClick={handlePayout}
          disabled={selected.size === 0 || isPending}
        >
          {isPending ? "処理中..." : "精算済みにする"}
        </button>
      </div>
    </div>
  );
}
