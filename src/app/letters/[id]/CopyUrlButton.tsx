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
    <button type="button" className="outline-button is-compact" onClick={handleCopy} style={{ width: "100%" }}>
      {copied ? "コピーしました！" : "このページのURLをコピーする"}
    </button>
  );
}
