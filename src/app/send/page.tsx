import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import SendForm from "./SendForm";
import RecentLetters from "./RecentLetters";
import type { UserProfile } from "@/types";

export const metadata = {
  title: "手紙を送る | KAKULETTER",
};

export default async function SendPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("users")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single<Pick<UserProfile, "is_admin">>();
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <div className="app-shell">
      <Header isLoggedIn={!!user} isAdmin={isAdmin} />

      <main className="app-main">
        <section className="screen send-screen">
          <div className="screen-heading centered">
            <p className="eyebrow">SEND A LETTER</p>
            <h1>手紙を送る</h1>
            <p>受取人のIDを入力すると、封筒に貼るQRコードが発行されます。</p>
          </div>

          <div className="flow-layout">
            <SendForm />

            <aside className="steps-card">
              <p className="eyebrow">HOW TO SEND</p>
              <h2>送り方</h2>
              <ol>
                <li><span>1</span><p><strong>IDを入力して料金を支払う</strong><small>基本料金310円です。</small></p></li>
                <li><span>2</span><p><strong>QRコードを印刷して封筒に貼る</strong><small>好きな便箋と封筒を使えます。</small></p></li>
                <li><span>3</span><p><strong>運営の住所に手紙を郵送する</strong><small>宛先は発行画面に表示されます。</small></p></li>
                <li><span>4</span><p><strong>運営が受取人へ転送する</strong><small>相手の住所は最後まで非公開です。</small></p></li>
              </ol>
              <RecentLetters />
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
