"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full border border-stone-300 text-stone-700 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50"
    >
      印刷する
    </button>
  );
}
