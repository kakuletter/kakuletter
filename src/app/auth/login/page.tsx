import Link from "next/link";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "ログイン | KAKULETTER",
};

export default function LoginPage() {
  return (
    <div className="app-shell">
      <Header isLoggedIn={false} />
      <main className="app-main">
        <section className="screen auth-screen">
          <div className="auth-wrap login-wrap">
            <div className="screen-heading">
              <p className="eyebrow">WELCOME BACK</p>
              <h1>ログイン</h1>
              <p>アカウントにログインしてください。</p>
            </div>
            <LoginForm />
            <p className="switch-copy">
              アカウントをお持ちでない方は <Link href="/auth/register">新規登録</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
