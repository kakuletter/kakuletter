"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function RecentLetters() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // localStorage はクライアント限定。マウント後に読むことで SSR との
    // hydration 不整合を避ける（useState 初期化子で読むと不整合になる）。
    try {
      const saved = JSON.parse(localStorage.getItem("kakuletter_sent") ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(saved)) setIds(saved.slice(0, 5));
    } catch { /* 無視 */ }
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <p className="text-sm font-medium text-amber-800 mb-3">
        このブラウザで最近送った手紙
      </p>
      <ul className="space-y-2">
        {ids.map((id) => (
          <li key={id}>
            <Link
              href={`/letters/${id}`}
              className="text-sm text-amber-700 underline hover:text-amber-900 font-mono break-all"
            >
              /letters/{id}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-600 mt-3">
        ※ このブラウザ・端末でのみ表示されます
      </p>
    </div>
  );
}
