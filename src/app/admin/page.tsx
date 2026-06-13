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
    <div className="app-shell">
      <Header isLoggedIn={true} isAdmin={true} />

      <main className="app-main">
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">ADMIN</p>
            <h1>管理者パネル</h1>
          </div>

          <div className="admin-stack">
            <section className="main-card">
              <div className="card-heading">
                <div><p className="eyebrow">SCAN</p><h2>バーコードスキャン</h2></div>
              </div>
              <p className="admin-desc">封筒のQRコードをスキャンすると受取人の住所が表示されます。</p>
              <ScanForm />
            </section>

            <section className="main-card">
              <div className="card-heading">
                <div><p className="eyebrow">MANUAL</p><h2>手動受付</h2></div>
              </div>
              <p className="admin-desc">バーコードなしで届いた手紙の受付登録に使います。</p>
              <LookupForm />
            </section>

            <section className="main-card">
              <div className="card-heading">
                <div><p className="eyebrow">PAYOUT</p><h2>収益精算</h2></div>
              </div>
              <p className="admin-desc">未払い収益（手数料の80%）の一覧です。振込後に「精算済み」にしてください。</p>
              <PayoutSection letters={pendingPayouts} />
            </section>

            <section className="main-card">
              <div className="card-heading">
                <div><p className="eyebrow">LETTERS</p><h2>手紙一覧（{letters?.length ?? 0}件）</h2></div>
              </div>
              {!letters || letters.length === 0 ? (
                <p className="empty-row">手紙はまだありません</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>受取人ID</th>
                        <th>送信者</th>
                        <th>受付日</th>
                        <th>ステータス</th>
                        <th>メモ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {letters.map((letter) => (
                        <tr key={letter.id}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{letter.recipient_display_id}</td>
                          <td>
                            {letter.sender_name ? (
                              <>
                                <div>{letter.sender_name}</div>
                                <small style={{ color: "var(--muted)" }}>{letter.sender_email}</small>
                              </>
                            ) : letter.sender_email ? (
                              <small style={{ color: "var(--muted)" }}>{letter.sender_email}</small>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>-</span>
                            )}
                          </td>
                          <td>{new Date(letter.received_at).toLocaleDateString("ja-JP")}</td>
                          <td>
                            <span className={`status-pill ${statusColor(letter.status)}`}>
                              {statusLabel(letter.status)}
                            </span>
                          </td>
                          <td style={{ color: "var(--muted)" }}>{letter.admin_notes ?? "-"}</td>
                          <td>
                            <LetterStatusButton letterId={letter.id} currentStatus={letter.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
