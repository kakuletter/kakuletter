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
    <div className="flex flex-col min-h-screen">
      <Header isLoggedIn={!!user} isAdmin={isAdmin} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">手紙を送る</h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            受取人のIDを入力し、PayPayで転送手数料を支払うと
            封筒に貼るバーコードが発行されます。
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <SendForm />
        </div>

        <div className="mt-6 space-y-3 text-sm text-stone-500">
          <p className="font-medium text-stone-700">手順</p>
          <ol className="space-y-2 list-none">
            {[
              "受取人IDを入力してPayPayで310円を支払う",
              "発行されたバーコードを印刷して封筒に貼る",
              "運営の住所に手紙を郵送する",
              "運営が受取人に転送する",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 w-5 h-5 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <RecentLetters />
      </main>

      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm space-y-2">
        <p>&copy; 2025 KAKULETTER</p>
        <div className="flex justify-center gap-6">
          <a href="/legal" className="hover:text-stone-200 underline">特定商取引法に基づく表示</a>
          <a href="/privacy" className="hover:text-stone-200 underline">プライバシーポリシー</a>
        </div>
      </footer>
    </div>
  );
}
