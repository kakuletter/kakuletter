import Link from "next/link";

export const metadata = {
  title: "特定商取引法に基づく表示 | KAKULETTER",
};

const items = [
  { label: "販売業者名", value: "KAKULETTER事務所" },
  { label: "代表者名", value: "冨田航平" },
  { label: "所在地", value: "〒154-0015 東京都世田谷区桜１丁目59-7 コーポむとう103" },
  { label: "電話番号", value: "080-8034-2637" },
  { label: "メールアドレス", value: "kakuletter@gmail.com" },
  { label: "販売価格", value: "転送手数料 310円（税込）/ 通" },
  { label: "支払い方法", value: "PayPay" },
  { label: "支払い時期", value: "サービス申し込み時にお支払いいただきます" },
  { label: "サービス提供時期", value: "手紙受領後、最短即日にて転送いたします" },
  { label: "返品・キャンセルについて", value: "支払い完了後のキャンセル・返金はお受けできません。手紙の紛失など運営側の責任による場合を除きます。" },
  { label: "動作環境", value: "最新バージョンの Chrome / Safari / Edge を推奨します" },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf8f3]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-bold text-xl tracking-widest text-rose-700">
            KAKULETTER
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          特定商取引法に基づく表示
        </h1>
        <p className="text-sm text-stone-500 mb-8">
          特定商取引に関する法律第11条に基づき、以下のとおり表示します。
        </p>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {items.map(({ label, value }, i) => (
            <div
              key={label}
              className={`flex flex-col sm:flex-row ${i !== items.length - 1 ? "border-b border-stone-100" : ""}`}
            >
              <div className="w-full sm:w-48 shrink-0 px-5 py-4 bg-stone-50 text-sm font-medium text-stone-600">
                {label}
              </div>
              <div className="px-5 py-4 text-sm text-stone-800 leading-relaxed">
                {value}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm">
        <p>&copy; 2025 KAKULETTER</p>
      </footer>
    </div>
  );
}
