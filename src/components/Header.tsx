"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isLoggedIn: boolean;
  isAdmin?: boolean;
};

export default function Header({ isLoggedIn, isAdmin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // 現在のページかどうか
  const current = (href: string) =>
    pathname === href ? ("page" as const) : undefined;

  return (
    <header className="app-header">
      <Link className="brand" href="/" aria-label="KAKULETTER ホーム">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/logo.svg" alt="" />
        <strong className="brand-name">KAKULETTER</strong>
      </Link>
      <nav>
        <Link href="/" aria-current={current("/")}>友達向けトップ</Link>
        <Link href="/creator" aria-current={current("/creator")}>配信者向けトップ</Link>
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" aria-current={current("/dashboard")}>マイページ</Link>
            {isAdmin && <Link href="/admin" aria-current={current("/admin")}>管理</Link>}
            <button type="button" onClick={handleLogout}>ログアウト</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" aria-current={current("/auth/login")}>ログイン</Link>
            <Link href="/auth/register" aria-current={current("/auth/register")}>新規登録</Link>
          </>
        )}
        <Link className="primary-link" href="/send" aria-current={current("/send")}>手紙を送る</Link>
      </nav>
    </header>
  );
}
