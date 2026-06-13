import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RevealInit from "@/components/landing/RevealInit";

export const metadata = {
  title: "配信者・推し活向け | KAKULETTER",
  description: "住所を明かさずに配信者・クリエイターへ本物の手紙と応援金を届けられるサービスです。",
};

export default async function CreatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header isLoggedIn={!!user} />
      <RevealInit />

      <main id="top">
        <section className="hero">
          <div className="hero-deco hero-deco-one" />
          <div className="hero-deco hero-deco-two" />
          <div className="container hero-grid">
            <div className="hero-copy reveal is-visible">
              <div className="hero-tags" aria-label="サービスの特徴">
                <span>本物の手紙</span>
                <span>住所非公開</span>
                <span>配信者には応援金も</span>
              </div>
              <h1>
                想いと応援を<br />
                <span>一通に。</span>
              </h1>
              <p className="hero-lead">
                配信者への手紙には、自由な応援金を添えられます。<br className="desktop-only" />
                住所を明かさず、KAKULETTER IDだけで届けられます。
              </p>
              <form className="creator-quick-search hero-creator-search" action="/send" method="get">
                <span>
                  <strong>応援したい配信者へ送る</strong>
                </span>
                <label>
                  <span className="visually-hidden">配信者名またはKKL-ID</span>
                  <input type="search" name="id" placeholder="KKL-IDを入力" />
                </label>
                <button type="submit">送る</button>
              </form>
              <p className="hero-note">基本料金310円。応援金は送り手が自由に設定できます。</p>
            </div>

            <div className="hero-visual reveal is-visible">
              <div className="hero-spark spark-one">✦</div>
              <div className="hero-spark spark-two">＋</div>
              <div className="hero-spark spark-three">✉</div>
              <div className="visual-badge visual-badge-top">
                <span className="badge-icon">〒</span>
                <span>あなた専用の<br /><strong>KKL-ID</strong></span>
              </div>
              <div className="hero-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/hero-creator-fan-manga.png"
                  alt="配信を見ながら本物の手紙を書くファンを描いたイラスト"
                />
              </div>
              <div className="visual-badge visual-badge-bottom">
                <span className="mini-avatar">応</span>
                <span><strong>配信者への応援金 1,000円</strong><br />送り手による設定例</span>
              </div>
              <div className="floating-id-card">
                <small>KAKULETTER ID</small>
                <strong>KKL-A7M9X</strong>
                <span>住所の代わりに交換</span>
              </div>
              <div className="floating-qr-card" aria-hidden="true">
                <span className="mini-qr"><i /><i /><i /></span>
                <small>QR転送ラベル</small>
              </div>
              <div className="floating-sticker sticker-letter">✉ 手書きで届く</div>
              <div className="floating-sticker sticker-private">
                <span className="lock-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <rect x="5" y="10" width="14" height="10" rx="3" />
                    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                    <path d="M12 14v2.5" />
                  </svg>
                </span>
                住所は見えない
              </div>
            </div>
          </div>

          <div className="container proof-bar reveal is-visible">
            <p>手紙を送る人にも、受け取る人にも、やさしい仕組み。</p>
            <div className="proof-items">
              <div><strong>¥310</strong><span>1通の基本料金</span></div>
              <div><strong>ID</strong><span>住所の代わりに交換</span></div>
              <div><strong>応援</strong><span>配信者への手紙のみ</span></div>
            </div>
          </div>

          <div className="route-heading container reveal is-visible">
            <span>あなたに合った入口を選んでください</span>
            <h2>配信者へ送りたい方も、受け取りたい配信者の方も。</h2>
          </div>

          <div className="hero-action-cards container reveal is-visible">
            <Link className="action-card sender-card" href="/send">
              <span className="action-card-icon">✉</span>
              <span>
                <small>手紙と応援を届けたい方</small>
                <strong>手紙を送る</strong>
                <em>相手のKKL-IDを入力して、手紙と応援金を届けられます</em>
              </span>
              <b>→</b>
            </Link>
            <Link className="action-card creator-card" href="/auth/register">
              <span className="action-card-icon">〒</span>
              <span>
                <small>配信者・クリエイターの方</small>
                <strong>手紙を受け取る準備をする</strong>
                <em>無料登録で専用IDと公開プロフィールを作成できます</em>
              </span>
              <b>→</b>
            </Link>
          </div>

          <div className="friend-separate-link container reveal is-visible">
            <span>友達同士で手紙を送り合いたい方へ</span>
            <Link href="/">友達との文通ページはこちら →</Link>
          </div>

          <div className="message-marquee" aria-hidden="true">
            <div>
              <span>本物の手紙を送る</span><i>✦</i>
              <span>応援金を添える</span><i>＋</i>
              <span>KKL-IDでつながる</span><i>✉</i>
              <span>住所は相手に非公開</span><i>〒</i>
              <span>本物の手紙を送る</span><i>✦</i>
              <span>応援金を添える</span><i>＋</i>
              <span>KKL-IDでつながる</span><i>✉</i>
              <span>住所は相手に非公開</span><i>〒</i>
            </div>
          </div>
        </section>

        <section className="section concept" id="about">
          <div className="container narrow">
            <div className="section-heading centered reveal">
              <h2>住所ではなく、公開IDから届ける。<br />新しいファンレターのかたち。</h2>
              <p>
                自分で書いた手紙だからこそ伝わる、紙の温かさ。<br className="desktop-only" />
                KAKULETTERが住所を伏せたまま、相手のポストへ転送します。
              </p>
            </div>
          </div>
        </section>

        <section className="section how" id="how">
          <div className="container">
            <div className="section-heading reveal">
              <h2>はじめ方は、とてもシンプル。</h2>
              <p>配信者を探して、QRコードを発行し、封筒に貼って郵送するだけです。</p>
            </div>

            <div className="steps-grid">
              <article className="step-card reveal">
                <span className="step-number">01</span>
                <div className="step-icon">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="16" r="7" />
                    <path d="M11 39c1-9 5-14 13-14s12 5 13 14" />
                    <path d="M34 10v10M29 15h10" />
                  </svg>
                </div>
                <h3>配信者が無料登録</h3>
                <p>配信者・クリエイターがプロフィールを登録し、公開用のKAKULETTER IDを設定します。</p>
              </article>

              <article className="step-card reveal">
                <span className="step-number">02</span>
                <div className="step-icon">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M9 14h30v23H9z" />
                    <path d="m10 16 14 11 14-11" />
                    <path d="M32 8h8v8" />
                    <path d="m40 8-9 9" />
                  </svg>
                </div>
                <h3>配信者・推しを探す</h3>
                <p>名前やKKL-IDから相手の公開ページを探し、プロフィールや注意事項を確認します。</p>
              </article>

              <article className="step-card reveal">
                <span className="step-number">03</span>
                <div className="step-icon">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M8 18h32v21H8z" />
                    <path d="m9 20 15 11 15-11" />
                    <path d="M18 12c0-5 6-6 6-1 0-5 6-4 6 1 0 4-6 7-6 7s-6-3-6-7Z" />
                  </svg>
                </div>
                <h3>QRコードを貼って郵送</h3>
                <p>IDを入力して基本料金310円を支払い、発行されたQRコードを封筒に貼ります。配信者へ送る場合のみ、任意の応援金を追加できます。</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section features" id="features">
          <div className="container">
            <div className="feature-list">
              <article className="feature-row reveal">
                <div className="feature-copy">
                  <span className="feature-label">01 / 住所は非公開</span>
                  <h3>住所の代わりに、<br />IDだけを伝える。</h3>
                  <p>
                    送り手に配信者の実際の住所が伝わることはありません。公開用のKKL-IDから送れます。
                  </p>
                  <ul className="check-list">
                    <li>住所は送り手に非公開</li>
                    <li>IDはいつでも共有できる</li>
                  </ul>
                </div>
                <div className="feature-visual profile-mock">
                  <div className="mock-browser">
                    <span /><span /><span />
                  </div>
                  <div className="profile-cover" />
                  <div className="profile-avatar">K</div>
                  <h4>kaku</h4>
                  <p>ことばと暮らす人</p>
                  <Link className="profile-button" href="/send">手紙を送る</Link>
                </div>
              </article>

              <article className="feature-row feature-row-reverse postal-feature reveal">
                <div className="feature-copy">
                  <span className="feature-label">02 / 本物の手紙</span>
                  <h3>デジタルではなく、<br />自分で書いた本物の手紙。</h3>
                  <p>
                    好きな便箋と封筒を使って、自分の手で書く。文字や紙の手触りまでそのまま届きます。
                  </p>
                  <ul className="check-list">
                    <li>好きな便箋・封筒を使える</li>
                    <li>送り手は会員登録不要</li>
                  </ul>
                </div>
                <div className="feature-visual postal-mock" aria-hidden="true">
                  <div className="postmark">
                    <span>KAKULETTER</span>
                    <i /><i /><i />
                  </div>
                  <div className="mailbox">
                    <div className="mailbox-label"><span>〒</span> 手紙受け</div>
                    <div className="mailbox-slot">
                      <div className="mail-envelope">
                        <span className="mail-stamp">〒</span>
                        <span className="mail-lines"><i /><i /><i /></span>
                      </div>
                    </div>
                    <div className="mailbox-door">
                      <span />
                    </div>
                  </div>
                  <div className="delivery-tag">
                    <span>本物の手紙</span>
                    <strong>あなたのポストへ届く</strong>
                  </div>
                </div>
              </article>

              <article className="feature-row reveal">
                <div className="feature-copy">
                  <span className="feature-label">03 / 安心の転送</span>
                  <h3>運営が中継するから、<br />個人情報を守れる。</h3>
                  <p>
                    封筒は、いったんKAKULETTERへ送られます。QRコードから受取人を確認し、登録住所へ転送します。
                  </p>
                  <ul className="check-list">
                    <li>相手の住所を封筒に書かなくてよい</li>
                    <li>登録住所は転送のみに使用</li>
                  </ul>
                </div>
                <div className="feature-visual safe-mock">
                  <div className="shield">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M32 5 53 13v16c0 14-8 24-21 30C19 53 11 43 11 29V13L32 5Z" />
                      <path d="m22 31 7 7 14-16" />
                    </svg>
                  </div>
                  <div className="safe-message">
                    <span className="safe-dot" />
                    <div><strong>住所は非公開です</strong><p>運営が受取人の住所へ転送します</p></div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container faq-layout">
            <div className="section-heading reveal">
              <h2>よくある質問</h2>
              <p>ほかに気になることは、お問い合わせからご連絡ください。</p>
            </div>
            <div className="faq-list reveal">
              <details>
                <summary>手紙を送る料金はいくらですか？<span /></summary>
                <p>基本料金は1通310円です。カスタムID宛には、送り手が転送手数料を500〜50,000円の範囲で設定でき、310円を超えた分の80%が受取人への応援金として還元されます。運営宛ての郵送料は別途必要です。</p>
              </details>
              <details>
                <summary>送り手も会員登録が必要ですか？<span /></summary>
                <p>いいえ。相手のKAKULETTER IDがあれば、登録なしでQRコードを発行できます。</p>
              </details>
              <details>
                <summary>どうやって手紙を送りますか？<span /></summary>
                <p>相手のIDを入力して基本料金310円を支払います。配信者へ送る場合のみ任意の応援金を追加できます。発行されたQRコードを封筒に貼り、運営宛てに郵送します。</p>
              </details>
              <details>
                <summary>登録した住所は相手に見えますか？<span /></summary>
                <p>見えません。住所は運営が手紙を転送する目的だけに使用します。</p>
              </details>
            </div>
          </div>
        </section>

        <section className="final-cta" id="start">
          <div className="cta-pattern" aria-hidden="true">KAKULETTER KAKULETTER KAKULETTER</div>
          <div className="container cta-inner reveal">
            <div>
              <h2>推しの住所を知らなくても、<br />本物の手紙と応援は届けられる。</h2>
            </div>
            <div className="cta-action">
              <Link className="button button-white button-large" href="/send">
                手紙を送る
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
              <p>送り手の登録不要・基本料金310円・応援金は自由設定</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
