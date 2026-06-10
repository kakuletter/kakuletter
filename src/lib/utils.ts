const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // O, I, 0, 1 を除外（視認性向上）

export function generateDisplayId(): string {
  let result = "KKL-";
  for (let i = 0; i < 5; i++) {
    result += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return result;
}

// 受取人ID（自動ID または カスタムID）の形式チェック。
// - 自動ID:    KKL- + 英数字5文字（数字始まりあり 例: KKL-7TPQ7）
// - カスタムID: KKL- + 英字始まり3〜20文字（英数字・ハイフン）
// 大文字小文字は区別しない（lookup 側で正規化するため）。
// recipient-fee / send/actions / SendForm で共有する単一の正解。
export const RECIPIENT_ID_REGEX = /^KKL-([A-Z0-9]{5}|[A-Za-z][A-Za-z0-9-]{2,19})$/i;

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "payment_pending": return "支払い待ち";
    case "received": return "受付済み";
    case "forwarded": return "転送済み";
    case "delivered": return "配達完了";
    default: return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "payment_pending": return "bg-orange-100 text-orange-800";
    case "received": return "bg-yellow-100 text-yellow-800";
    case "forwarded": return "bg-blue-100 text-blue-800";
    case "delivered": return "bg-green-100 text-green-800";
    default: return "bg-stone-100 text-stone-800";
  }
}
