import Link from "next/link";

// 全ページ共通のフッター
export default function SiteFooter() {
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
            <strong>メニュー</strong>
            <Link href="/">友達向けトップ</Link>
            <Link href="/creator">配信者向けトップ</Link>
            <Link href="/send">手紙を送る</Link>
          </div>
          <div>
            <strong>アカウント</strong>
            <Link href="/auth/register">新規登録</Link>
            <Link href="/auth/login">ログイン</Link>
            <Link href="/dashboard">マイページ</Link>
          </div>
          <div>
            <strong>サポート</strong>
            <Link href="/creator#faq">よくある質問</Link>
            <Link href="/legal">特定商取引法に基づく表記</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>住所を知らなくても、本物の手紙は届けられる。</p>
        <small>&copy; 2026 KAKULETTER</small>
      </div>
    </footer>
  );
}
