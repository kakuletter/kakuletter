import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import SubscribeButton from "./SubscribeButton";

export const metadata = {
  title: "プレミアムプラン | KAKULETTER",
};

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/subscribe");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("subscription_status, is_admin")
    .eq("auth_id", user.id)
    .single<{ subscription_status: string; is_admin: boolean }>();

  if (profile?.subscription_status === "premium") {
    redirect("/dashboard?subscription=already");
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header isLoggedIn={true} isAdmin={profile?.is_admin ?? false} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 space-y-8">
        <div className="text-center">
          <span className="inline-block bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide">
            PREMIUM PLAN
          </span>
          <h1 className="text-3xl font-bold text-stone-900 mb-3">
            ファンレターを<br />ビジネスにする
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            インフルエンサー・クリエイター向けのプランです。<br />
            カスタムIDで自分のブランドを表現し、ファンレターから収益を得られます。
          </p>
        </div>

        {params.canceled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
            登録がキャンセルされました。いつでも再試行できます。
          </div>
        )}

        {/* 料金カード */}
        <div className="bg-white rounded-2xl border-2 border-rose-200 p-8 shadow-sm space-y-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-stone-900">
              ¥980
              <span className="text-base font-normal text-stone-400 ml-1">/ 月</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">税込・月単位で解約可能</p>
          </div>

          <ul className="space-y-3">
            {[
              { label: "カスタムID", desc: "好きなIDを設定（例：KKL-yamada）" },
              { label: "手数料を自由に設定", desc: "500円〜10,000円の範囲で設定可" },
              { label: "収益の80%を受け取り", desc: "（手数料 − 310円）× 80%が報酬として記録される" },
              { label: "受け取り無制限", desc: "無料会員の月10通制限が解除される" },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="shrink-0 w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <SubscribeButton />

          <p className="text-xs text-stone-400 text-center">
            Stripeで安全に決済されます。解約はダッシュボードからいつでも可能です。
          </p>
        </div>

        {/* 無料プランとの比較 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">プラン比較</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-2 text-stone-500 font-normal"></th>
                <th className="text-center py-2 text-stone-500 font-medium">無料</th>
                <th className="text-center py-2 text-rose-700 font-semibold">プレミアム</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {[
                ["受け取り上限", "月10通", "無制限"],
                ["ID", "KKL-XXXXX（自動）", "KKL-名前（自由設定）"],
                ["送り手の手数料", "310円固定", "自由設定"],
                ["収益", "なし", "手数料の80%"],
                ["月額", "無料", "¥980"],
              ].map(([item, free, premium]) => (
                <tr key={item}>
                  <td className="py-2.5 text-stone-600">{item}</td>
                  <td className="py-2.5 text-center text-stone-400">{free}</td>
                  <td className="py-2.5 text-center text-rose-700 font-medium">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
