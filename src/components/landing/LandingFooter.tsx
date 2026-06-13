import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <Link className="brand footer-brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/logo.svg" alt="" />
          <span className="brand-name">KAKULETTER</span>
        </Link>
        <div className="footer-links">
          <div>
            <strong>サービス</strong>
            <Link href="/creator#about">KAKULETTERとは</Link>
            <Link href="/creator#how">使い方</Link>
            <Link href="/">友達との文通</Link>
            <Link href="/creator#faq">よくある質問</Link>
          </div>
          <div>
            <strong>サポート</strong>
            <Link href="/legal">特定商取引法に基づく表記</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
          </div>
          <div>
            <strong>はじめる</strong>
            <Link href="/send">手紙を送る</Link>
            <Link href="/auth/register">新規登録</Link>
            <Link href="/dashboard">マイページ</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>想いと応援を一通に。</p>
        <small>&copy; 2026 KAKULETTER</small>
      </div>
    </footer>
  );
}
