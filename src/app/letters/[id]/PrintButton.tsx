"use client";

export default function PrintButton() {
  return (
    <button type="button" className="action-button" onClick={() => window.print()}>
      QRコードを印刷
    </button>
  );
}
