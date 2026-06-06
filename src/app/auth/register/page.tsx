import Link from "next/link";
import RegisterForm from "./RegisterForm";

export const metadata = {
  title: "新規登録 | KAKULETTER",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-bold text-xl tracking-widest text-rose-700">
            KAKULETTER
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">新規登録</h1>
          <p className="text-stone-500 text-sm mb-8">
            登録完了後、あなた専用のIDが発行されます。
          </p>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
            <RegisterForm />
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/auth/login" className="text-rose-700 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
