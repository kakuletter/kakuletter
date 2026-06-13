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
    <button type="button" onClick={handleCopy}>
      {copied ? "コピーしました！" : "IDをコピー"}
    </button>
  );
}
