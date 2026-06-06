import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "ログイン | KAKULETTER",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-bold text-xl tracking-widest text-rose-700">
            KAKULETTER
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">ログイン</h1>
          <p className="text-stone-500 text-sm mb-8">
            アカウントにログインしてください。
          </p>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <LoginForm />
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            アカウントをお持ちでない方は{" "}
            <Link href="/auth/register" className="text-rose-700 hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
