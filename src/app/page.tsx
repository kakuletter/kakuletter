import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RevealInit from "@/components/landing/RevealInit";

export const metadata = {
  title: "KAKULETTER | 住所を知らなくても、手紙は届く。",
  description:
    "住所を相手に伝えず、KKL-IDだけで友達と本物の手紙を送り合えるKAKULETTERの文通サービスです。",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="friend-page">
      <RevealInit />

      <Header isLoggedIn={!!user} />

      <main id="top">
        <section className="friend-landing-hero">
          <div className="friend-paper-pattern" aria-hidden="true" />
          <div className="container friend-hero-grid">
            <div className="friend-hero-copy reveal is-visible">
              <h1>思いが届く距離を<br /><span>もう一度近づける。</span></h1>
              <p>
                相手に住所を教えなくても、KKL-IDだけで手紙を届けられます。<br />
                好きな便箋と封筒で、気軽に文通を始めましょう。
              </p>
              <div className="hero-actions">
                <Link className="button button-large" href="/send">友達に手紙を送る</Link>
                <Link className="button button-large button-outline" href="/auth/register">受取人になる</Link>
              </div>
              <p className="hero-note">基本料金は1通310円です。</p>
            </div>

            <div className="friend-hero-visual reveal is-visible">
              <div className="friend-mail-scene friend-mail-scene-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="friend-online-letter-image"
                  src="/assets/hero-friends-manga-home.png"
                  alt="自宅でビデオ通話をしながら手紙を書き、受け取った手紙を読む女友達を描いた漫画"
                />
              </div>
              <div className="friend-mail-scene friend-mail-scene-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="friend-online-letter-image"
                  src="/assets/hero-friends-manga-cafe-mailbox.png"
                  alt="カフェで手紙を書く女性と、自宅の郵便受けで手紙を受け取る女友達を描いた漫画"
                />
              </div>
              <div className="friend-visual-id">
                <small>KKL-ID</small>
                <strong>KKL-TOMO7</strong>
              </div>
              <div className="friend-visual-chip friend-visual-chip-private">住所は相手に非公開</div>
              <div className="friend-online-letter-caption">本物の手紙が届く</div>
            </div>
          </div>
        </section>

        <section className="friend-choice-section">
          <div className="container">
            <div className="section-heading centered reveal">
              <p className="section-kicker">選べる2つの入口</p>
              <h2>あなたは、送りたい？<br />受け取りたい？</h2>
              <p>送り手の会員登録は不要です。受け取りたい方だけ、無料でKKL-IDを作成します。</p>
            </div>

            <div className="friend-landing-choices">
              <Link className="friend-landing-card friend-landing-send reveal" href="/send">
                <span className="friend-card-number">01</span>
                <span className="friend-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <path d="M7 14h34v25H7z" />
                    <path d="m8 16 16 13 16-13" />
                    <path d="M31 9h10M36 4v10" />
                  </svg>
                </span>
                <small>送りたい方</small>
                <strong>友達に手紙を送る</strong>
                <p>友達から教えてもらったKKL-IDを入力し、封筒に貼るQRコードを発行します。</p>
                <em>会員登録不要・基本料金310円</em>
                <b>送付画面へ進む →</b>
              </Link>

              <Link className="friend-landing-card friend-landing-receive reveal" href="/auth/register">
                <span className="friend-card-number">02</span>
                <span className="friend-card-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48">
                    <circle cx="24" cy="15" r="7" />
                    <path d="M10 40c1-10 6-16 14-16s13 6 14 16" />
                    <path d="M35 8v12M29 14h12" />
                  </svg>
                </span>
                <small>受け取りたい方</small>
                <strong>手紙の受取人になる</strong>
                <p>住所を相手へ公開せずに手紙を受け取れる、あなた専用のKKL-IDを作ります。</p>
                <em>受取人登録は無料</em>
                <b>IDを作成する →</b>
              </Link>
            </div>
          </div>
        </section>

        <section className="friend-how-section">
          <div className="container">
            <div className="section-heading centered reveal">
              <p className="section-kicker">使い方</p>
              <h2>住所を交換しない、文通の始め方。</h2>
            </div>
            <div className="friend-how-grid">
              <article className="friend-how-card reveal">
                <span>1</span>
                <h3>受取人がIDを作る</h3>
                <p>無料登録で専用のKKL-IDを取得し、手紙を送ってほしい友達に伝えます。</p>
              </article>
              <article className="friend-how-card reveal">
                <span>2</span>
                <h3>送り手がQRを発行</h3>
                <p>友達のIDを入力して基本料金310円を支払い、転送用QRコードを発行します。</p>
              </article>
              <article className="friend-how-card reveal">
                <span>3</span>
                <h3>封筒に貼って郵送</h3>
                <p>QRコードを封筒に貼ってKAKULETTERへ郵送すると、運営が相手の住所へ転送します。</p>
              </article>
            </div>
          </div>
        </section>

        <section className="friend-safety-section">
          <div className="container friend-safety-inner reveal">
            <div>
              <p className="section-kicker">安心の仕組み</p>
              <h2>住所は、お互いに見えません。</h2>
              <p>登録住所は手紙の転送にのみ使用します。封筒に相手の住所を書く必要もありません。</p>
            </div>
            <div className="friend-safety-points">
              <span>住所は相手に非公開</span>
              <span>運営が受取人へ転送</span>
              <span>KKL-IDだけで送れる</span>
            </div>
          </div>
        </section>

        <section className="final-cta friend-final-cta">
          <div className="cta-pattern" aria-hidden="true">LETTER LETTER LETTER</div>
          <div className="container cta-inner reveal">
            <div>
              <h2>手紙のやりとりを、<br />今日から始めよう。</h2>
            </div>
            <div className="friend-final-actions">
              <Link className="button button-white button-large" href="/send">手紙を送る</Link>
              <Link className="friend-white-link" href="/auth/register">受取人になる →</Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
