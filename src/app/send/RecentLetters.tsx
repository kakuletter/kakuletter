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
    <div className="recent-letters">
      <p>このブラウザで最近送った手紙</p>
      <ul>
        {ids.map((id) => (
          <li key={id}>
            <Link href={`/letters/${id}`}>/letters/{id}</Link>
          </li>
        ))}
      </ul>
      <small>※ このブラウザ・端末でのみ表示されます</small>
    </div>
  );
}
