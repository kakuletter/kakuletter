import { notFound } from "next/navigation";
import Link from "next/link";
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
    ? await QRCode.toDataURL(letter.id, { width: 220, margin: 2 })
    : null;

  const serviceAddress = process.env.NEXT_PUBLIC_SERVICE_ADDRESS ?? "（運営住所）";
  const isStripeReturn = stripe_return === "1";

  return (
    <div className="app-shell">
      <Header isLoggedIn={!!user} />

      <main className="app-main">
        <section className="screen qr-screen">
          {/* 支払い待ち */}
          {letter.status === "payment_pending" ? (
            <div className="auth-wrap">
              <div className="screen-heading centered">
                <p className="eyebrow">PAYMENT PENDING</p>
                <h1>支払いが完了していません</h1>
                <p>受取人ID：<span style={{ fontFamily: "monospace", fontWeight: 700 }}>{letter.recipient_display_id}</span></p>
              </div>
              <div className="main-card" style={{ display: "grid", gap: 16, textAlign: "center" }}>
                {letter.payment_method === "stripe" ? (
                  <>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                      {isStripeReturn ? "支払いを確認しています..." : "Stripeでの支払いが確認できません。"}
                    </p>
                    {letter.payment_url && !isStripeReturn && (
                      <a className="action-button" href={letter.payment_url}>Stripeで支払う</a>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                      PayPayでの支払いが確認できません。支払い済みの場合は下のボタンを押してください。
                    </p>
                    {letter.payment_url && (
                      <a className="action-button" href={letter.payment_url}>PayPayで支払う</a>
                    )}
                  </>
                )}
                <PaymentChecker
                  letterId={letter.id}
                  paymentMethod={letter.payment_method}
                  stripeReturn={isStripeReturn}
                />
              </div>
            </div>
          ) : (
            /* 支払い完了：QRチケット */
            <div className="success-wrap">
              <div className="success-mark">✓</div>
              <p className="eyebrow">PAYMENT COMPLETE</p>
              <h1>QRコードを発行しました</h1>
              <p>印刷して封筒の表面にしっかり貼り付けてください。</p>

              {!user && (
                <div className="notice-box" style={{ margin: "20px auto 0", maxWidth: 520, textAlign: "left" }}>
                  <strong>このページのURLを必ず保存してください。</strong>
                  ログインしていないため、URLを閉じると再度アクセスできなくなります。
                  <div style={{ marginTop: 10 }}><CopyUrlButton /></div>
                </div>
              )}

              <section className="qr-ticket" id="qr-ticket">
                <header><strong>KAKULETTER</strong><span>匿名転送ラベル</span></header>
                <div style={{ display: "grid", placeItems: "center", margin: "22px 0 12px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl!} alt="封筒用QRコード" width={190} height={190} />
                </div>
                <strong className="ticket-code">{letter.recipient_display_id}</strong>
                <div className="ticket-details">
                  <p><span>受取人ID</span><strong>{letter.recipient_display_id}</strong></p>
                  <p><span>ステータス</span><strong>{statusLabel(letter.status)}</strong></p>
                  <p className="ticket-total"><span>支払済合計</span><strong>{letter.fee_amount.toLocaleString()}円</strong></p>
                </div>
                <footer>このラベルを封筒に貼り、下記の運営宛先へ郵送してください。</footer>
              </section>

              <div className="qr-actions">
                <PrintButton />
                <Link className="outline-button" href="/send">別の手紙を送る</Link>
              </div>

              <section className="mail-guide main-card" style={{ marginTop: 28, textAlign: "left" }}>
                <h2>郵送先（運営住所）</h2>
                <div className="address-inline" style={{ marginTop: 14 }}>
                  <small>この住所へ郵送してください</small>
                  <p>{serviceAddress}</p>
                </div>
                <ol style={{ marginTop: 18 }}>
                  <li><span>1</span><p><strong>手紙を書いて封筒に入れる</strong><small>便箋・封筒はお好きなものを使えます。</small></p></li>
                  <li><span>2</span><p><strong>QRコードを封筒に貼る</strong><small>コードが折れたり隠れたりしないように。</small></p></li>
                  <li><span>3</span><p><strong>上記の運営宛先へ郵送する</strong><small>運営がQRを読み取り、受取人へ転送します。</small></p></li>
                </ol>
                {letter.forwarded_at && (
                  <p style={{ marginTop: 14, color: "var(--muted)", fontSize: 11 }}>
                    転送日：{new Date(letter.forwarded_at).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </section>
            </div>
          )}

          {/* 現在のステータス（補助表示） */}
          <p style={{ marginTop: 24, textAlign: "center" }}>
            <span className={`status-pill ${statusColor(letter.status)}`}>
              現在のステータス：{statusLabel(letter.status)}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
