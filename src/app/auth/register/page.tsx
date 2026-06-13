import Link from "next/link";
import Header from "@/components/Header";
import RegisterForm from "./RegisterForm";

export const metadata = {
  title: "新規登録 | KAKULETTER",
};

export default function RegisterPage() {
  return (
    <div className="app-shell">
      <Header isLoggedIn={false} />
      <main className="app-main">
        <section className="screen auth-screen">
          <div className="auth-wrap">
            <div className="screen-heading">
              <p className="eyebrow">RECEIVE LETTERS</p>
              <h1>新規登録</h1>
              <p>登録完了後、あなた専用のIDが発行されます。</p>
            </div>
            <RegisterForm />
            <p className="switch-copy">
              すでにアカウントをお持ちの方は <Link href="/auth/login">ログイン</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
