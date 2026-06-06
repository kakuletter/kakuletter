"use client";

import { useState } from "react";

export default function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm border border-stone-300 rounded-full px-4 py-1.5 text-stone-600 hover:bg-stone-50 transition-colors"
    >
      {copied ? "コピーしました！" : "IDをコピー"}
    </button>
  );
}
