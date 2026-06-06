"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isLoggedIn: boolean;
  isAdmin?: boolean;
};

export default function Header({ isLoggedIn, isAdmin }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <Image src="/logo.png" alt="KKL" width={36} height={36} className="object-contain w-8 h-8 sm:w-9 sm:h-9" />
          <span className="font-bold text-sm sm:text-xl tracking-widest text-rose-700">KAKULETTER</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <Link
            href="/send"
            className="bg-rose-700 text-white px-3 sm:px-4 py-1.5 rounded-full hover:bg-rose-800 transition-colors whitespace-nowrap"
          >
            手紙を送る
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-stone-600 hover:text-stone-900 whitespace-nowrap">
                マイページ
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-stone-600 hover:text-stone-900">
                  管理
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-stone-500 hover:text-stone-700 hidden sm:block whitespace-nowrap"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-stone-600 hover:text-stone-900 whitespace-nowrap">
                ログイン
              </Link>
              <Link href="/auth/register" className="text-stone-600 hover:text-stone-900 whitespace-nowrap hidden sm:block">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
