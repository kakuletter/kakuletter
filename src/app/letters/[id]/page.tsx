import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";
import Header from "@/components/Header";
import PaymentChecker from "./PaymentChecker";
import PrintButton from "./PrintButton";
import CopyUrlButton from "./CopyUrlButton";
import { statusLabel, statusColor } from "@/lib/utils";
import type { Letter } from "@/types";

export const metadata = {
  title: "手紙の状況 | KAKULETTER",
};

export default async function LetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stripe_return?: string }>;
}) {
  const { id } = await params;
  const { stripe_return } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  const { data: letter } = await adminClient
    .from("letters")
    .select("*")
    .eq("id", id)
    .single<Letter>();

  if (!letter) notFound();

  if (letter.sender_email && user && letter.sender_email !== user.email) {
    notFound();
  }

  const qrDataUrl = letter.status !== "payment_pending"
    ? await QRCode.toDataURL(letter.id, { width: 200, margin: 2 })
    : null;

  const serviceAddress = process.env.NEXT_PUBLIC_SERVICE_ADDRESS ?? "（運営住所）";
  const isStripeReturn = stripe_return === "1";

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={!!user} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">手紙の状況</h1>
          <p className="text-stone-500 text-sm">
            受取人ID：<span className="font-mono font-semibold">{letter.recipient_display_id}</span>
          </p>
        </div>

        {/* ステータス */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center justify-between">
          <span className="text-sm text-stone-600">現在のステータス</span>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(letter.status)}`}>
            {statusLabel(letter.status)}
          </span>
        </div>

        {/* 支払い待ち */}
        {letter.status === "payment_pending" && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 text-center">
            <p className="text-stone-700 font-medium">支払いが完了していません</p>

            {letter.payment_method === "stripe" ? (
              <>
                <p className="text-stone-500 text-sm">
                  {isStripeReturn
                    ? "支払いを確認しています..."
                    : "Stripeでの支払いが確認できません。"}
                </p>
                {letter.payment_url && !isStripeReturn && (
                  <a
                    href={letter.payment_url}
                    className="inline-block bg-[#635BFF] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#4E47D0]"
                  >
                    Stripeで支払う
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-stone-500 text-sm">
                  PayPayでの支払いが確認できません。<br />
                  支払い済みの場合は下のボタンを押してください。
                </p>
                {letter.payment_url && (
                  <a
                    href={letter.payment_url}
                    className="inline-block bg-rose-700 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-rose-800"
                  >
                    PayPayで支払う
                  </a>
                )}
              </>
            )}

            <PaymentChecker
              letterId={letter.id}
              paymentMethod={letter.payment_method}
              stripeReturn={isStripeReturn}
            />
          </div>
        )}

        {/* バーコード（支払い完了後） */}
        {qrDataUrl && (
          <>
            {!user && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">
                  このページのURLを必ず保存してください
                </p>
                <p className="text-xs text-amber-700">
                  ログインしていないため、このURLを閉じると再度アクセスできなくなります。ブックマークまたはURLをコピーして保管してください。
                </p>
                <CopyUrlButton />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <h2 className="font-semibold text-stone-900 text-center">封筒に貼るバーコード</h2>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="封筒用バーコード" width={180} height={180} />
              </div>
              <p className="text-xs text-stone-400 text-center">
                このQRコードを印刷して封筒に貼ってください。
              </p>
              <PrintButton />
            </div>
          </>
        )}

        {/* 郵送先 */}
        {letter.status !== "payment_pending" && (
          <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5 space-y-2">
            <p className="text-sm font-medium text-stone-800">郵送先（運営住所）</p>
            <p className="text-sm text-stone-700">{serviceAddress}</p>
            <p className="text-xs text-stone-400">バーコードを封筒に貼ってこの住所へ郵送してください。</p>
          </div>
        )}

        {letter.forwarded_at && (
          <p className="text-center text-sm text-stone-400">
            転送日：{new Date(letter.forwarded_at).toLocaleDateString("ja-JP")}
          </p>
        )}
      </main>
    </div>
  );
}
