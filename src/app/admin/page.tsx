import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import LookupForm from "./LookupForm";
import ScanForm from "./ScanForm";
import LetterStatusButton from "./LetterStatusButton";
import PayoutSection from "./PayoutSection";
import { statusLabel, statusColor } from "@/lib/utils";
import type { UserProfile, Letter } from "@/types";

export const metadata = {
  title: "管理者パネル | KAKULETTER",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single<UserProfile>();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: rawLetters } = await adminClient
    .from("letters")
    .select("*")
    .order("received_at", { ascending: false });

  const letters = rawLetters as Letter[] | null;

  // 精算待ちの手紙（プレミアム会員宛で未精算）
  const { data: rawPending } = await adminClient
    .from("letters")
    .select("id, recipient_display_id, payout_amount, fee_amount, received_at")
    .eq("payout_status", "pending")
    .neq("status", "payment_pending")
    .order("received_at", { ascending: false });

  const pendingPayouts = (rawPending ?? []) as {
    id: string; recipient_display_id: string; payout_amount: number; fee_amount: number; received_at: string;
  }[];

  return (
    <div className="min-h-screen flex flex-col">
      <Header isLoggedIn={true} isAdmin={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-10">
        <h1 className="text-2xl font-bold text-stone-900">管理者パネル</h1>

        {/* バーコードスキャン */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
          <h2 className="font-semibold text-stone-900 mb-1">バーコードスキャン</h2>
          <p className="text-sm text-stone-500 mb-5">
            封筒のQRコードをスキャンすると受取人の住所が表示されます。
          </p>
          <ScanForm />
        </section>

        {/* 新規受付（手動） */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
          <h2 className="font-semibold text-stone-900 mb-1">手動受付</h2>
          <p className="text-sm text-stone-500 mb-5">
            バーコードなしで届いた手紙の受付登録に使います。
          </p>
          <LookupForm />
        </section>

        {/* 精算管理 */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
          <h2 className="font-semibold text-stone-900 mb-1">収益精算</h2>
          <p className="text-sm text-stone-500 mb-5">
            プレミアム会員への未払い収益（手数料の80%）の一覧です。振込後に「精算済み」にしてください。
          </p>
          <PayoutSection letters={pendingPayouts} />
        </section>

        {/* 手紙一覧 */}
        <section>
          <h2 className="font-semibold text-stone-900 mb-4">
            手紙一覧
            <span className="ml-2 text-sm text-stone-400 font-normal">
              {letters?.length ?? 0}件
            </span>
          </h2>

          {!letters || letters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
              手紙はまだありません
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-stone-600 font-medium">受取人ID</th>
                    <th className="text-left px-5 py-3 text-stone-600 font-medium">送信者</th>
                    <th className="text-left px-5 py-3 text-stone-600 font-medium">受付日</th>
                    <th className="text-left px-5 py-3 text-stone-600 font-medium">ステータス</th>
                    <th className="text-left px-5 py-3 text-stone-600 font-medium">メモ</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {letters.map((letter, i) => (
                    <tr
                      key={letter.id}
                      className={i % 2 === 0 ? "" : "bg-stone-50/50"}
                    >
                      <td className="px-5 py-3 font-mono font-medium text-stone-900">
                        {letter.recipient_display_id}
                      </td>
                      <td className="px-5 py-3">
                        {letter.sender_name ? (
                          <div>
                            <p className="text-stone-800 text-sm">{letter.sender_name}</p>
                            <p className="text-stone-400 text-xs">{letter.sender_email}</p>
                          </div>
                        ) : letter.sender_email ? (
                          <p className="text-stone-400 text-xs">{letter.sender_email}</p>
                        ) : (
                          <span className="text-stone-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {new Date(letter.received_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(letter.status)}`}>
                          {statusLabel(letter.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-400 text-xs">
                        {letter.admin_notes ?? "-"}
                      </td>
                      <td className="px-5 py-3">
                        <LetterStatusButton
                          letterId={letter.id}
                          currentStatus={letter.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
