"use client";

import { useActionState, useRef, useState } from "react";
import { scanBarcode, updateLetterStatus } from "./actions";
import type { ActionState } from "@/types";
import { statusLabel, statusColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

const initialState: ActionState = {};

// ネイティブ BarcodeDetector（標準DOM型に含まれないため最小定義）
type DetectedBarcode = { rawValue: string };
interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

// ImageBitmap を指定の最大辺に縮小して ImageData を得る
function bitmapToImageData(bitmap: ImageBitmap, maxDim: number): ImageData | null {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

async function decodeQrFromFile(file: File): Promise<string | null> {
  // EXIF の向きを反映して読み込む（スマホ写真の回転対策）
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    // 1) ネイティブ BarcodeDetector（Android Chrome 等。画面越し撮影にも強い）
    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (Ctor) {
      try {
        const detector = new Ctor({ formats: ["qr_code"] });
        const codes = await detector.detect(bitmap);
        if (codes[0]?.rawValue) return codes[0].rawValue;
      } catch { /* jsQR にフォールバック */ }
    }

    // 2) jsQR フォールバック：複数解像度で試行（モアレ・低解像度対策）
    for (const maxDim of [bitmap.width, 1600, 1000, 700]) {
      const data = bitmapToImageData(bitmap, maxDim);
      if (!data) continue;
      const code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
      if (code?.data) return code.data;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

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
    if (!file) {
      return;
    }
    try {
      const data = await decodeQrFromFile(file);
      if (data) {
        setDecodedId(data);
        if (inputRef.current) inputRef.current.value = data;
      } else {
        setImageError(
          "QRコードを読み取れませんでした。QRコードを画面いっぱいに大きく・明るく写してください。画面越しの撮影は反射やモアレで読み取りにくくなります（印刷物のほうが確実です）。"
        );
      }
    } catch {
      setImageError("画像の読み込みに失敗しました。");
    } finally {
      // 同じ画像を選び直して再試行できるようにリセット
      e.target.value = "";
    }
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
