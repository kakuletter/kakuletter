import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import CopyIdButton from "./CopyIdButton";
import AccountSettings from "./AccountSettings";
import { statusLabel, statusColor } from "@/lib/utils";
import { isConnectAccountReady } from "@/lib/stripe";
import type { UserProfile, Letter } from "@/types";

export const metadata = {
  title: "マイページ | KAKULETTER",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single<UserProfile>();

  if (!profile) redirect("/auth/login");

  // 受け取った手紙
  const { data: receivedLetters } = await adminClient
    .from("letters")
    .select("*")
    .eq("recipient_display_id", profile.display_id)
    .neq("status", "payment_pending")
    .order("received_at", { ascending: false }) as { data: Letter[] | null };

  // 送った手紙
  const { data: sentLetters } = await adminClient
    .from("letters")
    .select("*")
    .eq("sender_email", user.email)
    .order("created_at", { ascending: false }) as { data: Letter[] | null };

  const serviceAddress = process.env.NEXT_PUBLIC_SERVICE_ADDRESS ?? "（運営事務局住所）";

  // 収益集計（カスタムID宛の手紙のみ payout_amount を持つ）
  let monthlyEarnings = 0;
  let totalEarnings = 0;
  if (profile.custom_id) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    for (const l of receivedLetters ?? []) {
      const amount = l.payout_amount ?? 0;
      totalEarnings += amount;
      if (new Date(l.received_at) >= startOfMonth) monthlyEarnings += amount;
    }
  }

  const displayedId = profile.custom_id ?? profile.display_id;

  // Stripe Connect（収益の振込先）連携状態
  let connectStatus: "none" | "pending" | "active" = "none";
  if (profile.stripe_connect_account_id) {
    connectStatus = (await isConnectAccountReady(profile.stripe_connect_account_id)) ? "active" : "pending";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={true} isAdmin={profile.is_admin} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">

        {/* Connect連携バナー */}
        {params.connect === "return" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center">
            {connectStatus === "active"
              ? "✓ 口座連携が完了しました。今後の収益は自動で振り込まれます。"
              : "口座連携を受け付けました。審査・確認が完了するまで少しお待ちください。"}
          </div>
        )}

        {/* ID カード */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
          <p className="text-sm text-stone-500 mb-2">あなたのKAKULETTER ID</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-4xl font-bold tracking-widest text-rose-700 font-mono">
              {displayedId}
            </span>
            <CopyIdButton id={displayedId} />
          </div>
          {profile.custom_id && (
            <p className="text-xs text-stone-400 mt-1">
              自動ID（{profile.display_id}）でも受け取れます
            </p>
          )}
          <p className="text-sm text-stone-400 mt-3">
            このIDを文通したい相手に教えてください。相手があなたに手紙を送る際に使います。
          </p>
        </section>

        {/* 収益（カスタムID設定者のみ） */}
        {profile.custom_id && (
          <section className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
            <h2 className="font-semibold text-stone-900 mb-4">収益状況</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
                <p className="text-xs text-stone-400 mb-1">今月の収益</p>
                <p className="text-2xl font-bold text-stone-900">¥{monthlyEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-amber-100 text-center">
                <p className="text-xs text-stone-400 mb-1">累計収益</p>
                <p className="text-2xl font-bold text-rose-700">¥{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3">
              ※ カスタムID宛の収益は、決済時にStripe経由であなたの連携口座へ自動的に振り込まれます。
            </p>
          </section>
        )}

        {/* 設定（カスタムID・受取口座） */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
          <h2 className="font-semibold text-stone-900 mb-5">設定</h2>
          <AccountSettings customId={profile.custom_id} connectStatus={connectStatus} />
        </section>

        {/* 手紙の送り方 */}
        <section className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
          <h2 className="font-semibold text-stone-900 mb-3">手紙の送り方</h2>
          <ol className="space-y-2 text-sm text-stone-700">
            <li className="flex gap-2">
              <span className="text-rose-600 font-bold shrink-0">1.</span>
              「手紙を送る」から受取人IDを入力し、PayPayまたはカードで手数料を支払う。
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600 font-bold shrink-0">2.</span>
              発行されたQRコードを印刷して封筒に貼る。
            </li>
            <li className="flex gap-2">
              <span className="text-rose-600 font-bold shrink-0">3.</span>
              下記の運営住所へ郵送してください。運営が相手の住所へ転送します。
            </li>
          </ol>
          <div className="mt-4 bg-white rounded-xl p-3 border border-rose-200">
            <p className="text-xs text-stone-500 mb-1">運営の郵送先住所</p>
            <p className="text-sm font-medium text-stone-900">{serviceAddress}</p>
          </div>
        </section>

        {/* 送った手紙 */}
        <section>
          <h2 className="font-semibold text-stone-900 mb-4">送った手紙</h2>
          {!sentLetters || sentLetters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
              まだ手紙を送っていません
            </div>
          ) : (
            <div className="space-y-3">
              {sentLetters.map((letter) => (
                <Link
                  key={letter.id}
                  href={`/letters/${letter.id}`}
                  className="block bg-white rounded-xl border border-stone-200 px-5 py-4 hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-stone-800">
                        宛先：<span className="font-mono">{letter.recipient_display_id}</span>
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(letter.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(letter.status)}`}>
                        {statusLabel(letter.status)}
                      </span>
                      {letter.status !== "payment_pending" && (
                        <span className="text-xs text-stone-400 underline">QRコードを見る →</span>
                      )}
                    </div>
                  </div>
                  {letter.forwarded_at && (
                    <p className="text-xs text-stone-400 mt-1">
                      転送日：{new Date(letter.forwarded_at).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 受け取った手紙 */}
        <section>
          <h2 className="font-semibold text-stone-900 mb-4">受け取った手紙</h2>
          {!receivedLetters || receivedLetters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
              まだ手紙は届いていません
            </div>
          ) : (
            <div className="space-y-3">
              {receivedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white rounded-xl border border-stone-200 px-5 py-4 flex items-center justify-between flex-wrap gap-3"
                >
                  <div>
                    <p className="text-sm text-stone-600">
                      受付日：{new Date(letter.received_at).toLocaleDateString("ja-JP")}
                    </p>
                    {letter.forwarded_at && (
                      <p className="text-xs text-stone-400">
                        転送日：{new Date(letter.forwarded_at).toLocaleDateString("ja-JP")}
                      </p>
                    )}
                    {letter.payout_amount ? (
                      <p className="text-xs text-amber-600 mt-0.5">
                        収益：¥{letter.payout_amount.toLocaleString()}
                        {letter.payout_status === "paid" && " （振込済み）"}
                      </p>
                    ) : null}
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(letter.status)}`}>
                    {statusLabel(letter.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
