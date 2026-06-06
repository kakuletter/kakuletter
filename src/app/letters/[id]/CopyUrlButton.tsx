"use client";

import { useState } from "react";

export default function CopyUrlButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-4 py-2 hover:bg-amber-100 transition-colors w-full"
    >
      {copied ? "コピーしました！" : "このページのURLをコピーする"}
    </button>
  );
}
