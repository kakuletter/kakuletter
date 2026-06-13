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
    <div style={{ display: "grid", gap: 18 }}>
      {/* 画像アップロードでスキャン */}
      <div style={{ display: "grid", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#44403c" }}>封筒のQRコード画像をアップロード</p>
        <label className="scan-dropzone">
          <span style={{ fontSize: 22 }}>📷</span>
          <span>画像を選択（カメラ撮影も可）</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} hidden />
        </label>
        {imageError && <div className="form-error">{imageError}</div>}
        {decodedId && (
          <div className="form-success" style={{ fontFamily: "monospace" }}>読み取り成功：{decodedId}</div>
        )}
      </div>

      <div className="scan-divider"><span>または手動入力</span></div>

      {/* 手動入力・フォーム送信 */}
      <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <input
          ref={inputRef}
          type="text"
          name="letter_id"
          required
          value={decodedId}
          onChange={(e) => setDecodedId(e.target.value)}
          placeholder="IDをここに貼り付け"
          style={{ fontFamily: "monospace" }}
        />
        <button type="submit" className="action-button is-compact" disabled={isScanning} style={{ flexShrink: 0 }}>
          {isScanning ? "検索中..." : "検索"}
        </button>
      </form>

      {state?.error && <div className="form-error">{state.error}</div>}

      {result && (
        <div className="subcard">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="eyebrow" style={{ margin: 0 }}>スキャン結果</p>
            <span className={`status-pill ${statusColor(result.status as string)}`}>
              {statusLabel(result.status as string)}
            </span>
          </div>
          <div className="kv"><span>受取人ID</span><strong style={{ fontFamily: "monospace" }}>{result.recipient_display_id as string}</strong></div>
          <div className="kv"><span>氏名</span><strong>{result.real_name as string}</strong></div>
          <div className="kv"><span>住所</span><strong>{result.full_address as string}</strong></div>
          {result.status === "received" && (
            <button type="button" className="action-button is-compact" onClick={handleForward} disabled={forwarding}>
              {forwarding ? "更新中..." : "転送済みにする"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
