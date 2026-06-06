"use client";

import { useActionState, useRef, useState } from "react";
import { scanBarcode, updateLetterStatus } from "./actions";
import type { ActionState } from "@/types";
import { statusLabel, statusColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

const initialState: ActionState = {};

export default function ScanForm() {
  const [state, formAction, isScanning] = useActionState(scanBarcode, initialState);
  const [forwarding, setForwarding] = useState(false);
  const [imageError, setImageError] = useState("");
  const [decodedId, setDecodedId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const result = state?.success ? state.data : null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      URL.revokeObjectURL(url);

      if (code) {
        setDecodedId(code.data);
        if (inputRef.current) inputRef.current.value = code.data;
      } else {
        setImageError("QRコードを読み取れませんでした。画像を確認してください。");
      }
    };

    img.onerror = () => {
      setImageError("画像の読み込みに失敗しました。");
      URL.revokeObjectURL(url);
    };
  }

  async function handleForward() {
    if (!result?.letter_id) return;
    setForwarding(true);
    await updateLetterStatus(result.letter_id as string, "forwarded");
    router.refresh();
    setForwarding(false);
  }

  return (
    <div className="space-y-5">
      {/* 画像アップロードでスキャン */}
      <div>
        <p className="text-sm text-stone-600 mb-2">封筒のQRコード画像をアップロード</p>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-xl p-5 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
          <span className="text-2xl">📷</span>
          <span className="text-sm text-stone-600">画像を選択（カメラ撮影も可）</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        {imageError && <p className="text-red-600 text-xs mt-1">{imageError}</p>}
        {decodedId && (
          <p className="text-green-700 text-xs mt-1 font-mono">
            読み取り成功：{decodedId}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-stone-400">
        <div className="flex-1 h-px bg-stone-200" />
        <span>または手動入力</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* 手動入力・フォーム送信 */}
      <form action={formAction} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          name="letter_id"
          required
          value={decodedId}
          onChange={(e) => setDecodedId(e.target.value)}
          placeholder="IDをここに貼り付け"
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          type="submit"
          disabled={isScanning}
          className="bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-900 disabled:opacity-60 shrink-0"
        >
          {isScanning ? "検索中..." : "検索"}
        </button>
      </form>

      {state?.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}

      {result && (
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500 uppercase font-medium tracking-wide">スキャン結果</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(result.status as string)}`}>
              {statusLabel(result.status as string)}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-stone-500">受取人ID：</span>
              <span className="font-mono font-semibold">{result.recipient_display_id as string}</span>
            </p>
            <p>
              <span className="text-stone-500">氏名：</span>
              <span className="font-semibold">{result.real_name as string}</span>
            </p>
            <p>
              <span className="text-stone-500">住所：</span>
              <span>{result.full_address as string}</span>
            </p>
          </div>
          {result.status === "received" && (
            <button
              onClick={handleForward}
              disabled={forwarding}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {forwarding ? "更新中..." : "転送済みにする"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
