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

  const { data: receivedLetters } = await adminClient
    .from("letters")
    .select("*")
    .eq("recipient_display_id", profile.display_id)
    .neq("status", "payment_pending")
    .order("received_at", { ascending: false }) as { data: Letter[] | null };

  const { data: sentLetters } = await adminClient
    .from("letters")
    .select("*")
    .eq("sender_email", user.email)
    .order("created_at", { ascending: false }) as { data: Letter[] | null };

  const serviceAddress = process.env.NEXT_PUBLIC_SERVICE_ADDRESS ?? "（運営事務局住所）";

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
  const fullAddress = `${profile.prefecture}${profile.city}${profile.address_line}${profile.building ? " " + profile.building : ""}`;

  let connectStatus: "none" | "pending" | "active" = "none";
  if (profile.stripe_connect_account_id) {
    connectStatus = (await isConnectAccountReady(profile.stripe_connect_account_id)) ? "active" : "pending";
  }

  return (
    <div className="app-shell">
      <Header isLoggedIn={true} isAdmin={profile.is_admin} />

      <main className="app-main">
        <section className="screen dashboard-screen">
          {params.connect === "return" && (
            <div className="form-success" style={{ marginBottom: 20, textAlign: "center" }}>
              {connectStatus === "active"
                ? "✓ 口座連携が完了しました。今後の収益は自動で振り込まれます。"
                : "口座連携を受け付けました。審査・確認が完了するまで少しお待ちください。"}
            </div>
          )}

          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">MY KAKULETTER</p>
              <h1>こんにちは、{profile.real_name}さん。</h1>
              <p>このIDが、あなたの文通の「住所」です。</p>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* ID カード */}
            <section className="id-card">
              <p>KAKULETTER ID</p>
              <strong>{displayedId}</strong>
              <span>
                住所の代わりに、このIDを文通相手へ伝えてください。
                {profile.custom_id && `（自動ID ${profile.display_id} でも受け取れます）`}
              </span>
              <div>
                <CopyIdButton id={displayedId} />
                <Link href="/send">手紙を送る</Link>
              </div>
            </section>

            {/* 収益（カスタムID設定者のみ） */}
            {profile.custom_id && (
              <section className="main-card earnings-card">
                <div className="card-heading">
                  <div><p className="eyebrow">EARNINGS</p><h2>収益状況</h2></div>
                </div>
                <div className="earnings-grid">
                  <div>
                    <small>今月の収益</small>
                    <strong>¥{monthlyEarnings.toLocaleString()}</strong>
                  </div>
                  <div>
                    <small>累計収益</small>
                    <strong className="earnings-total">¥{totalEarnings.toLocaleString()}</strong>
                  </div>
                </div>
                <p className="earnings-note">
                  ※ カスタムID宛の収益は、決済時にStripe経由であなたの連携口座へ自動的に振り込まれます。
                </p>
              </section>
            )}

            {/* 設定 */}
            <section className="main-card dashboard-span">
              <div className="card-heading">
                <div><p className="eyebrow">SETTINGS</p><h2>設定</h2></div>
              </div>
              <AccountSettings customId={profile.custom_id} connectStatus={connectStatus} />
            </section>

            {/* 転送先（非公開） */}
            <section className="main-card address-card">
              <div className="card-heading">
                <div><p className="eyebrow">PRIVATE ADDRESS</p><h2>手紙の転送先</h2></div>
                <span>非公開</span>
              </div>
              <dl>
                <div><dt>お名前</dt><dd>{profile.real_name}</dd></div>
                <div><dt>郵便番号</dt><dd>{profile.postal_code}</dd></div>
                <div><dt>住所</dt><dd>{fullAddress}</dd></div>
              </dl>
              <p className="info-note" style={{ border: 0, background: "transparent", padding: 0, color: "var(--muted)" }}>
                この情報はKAKULETTERが手紙を転送するためだけに使用し、文通相手には公開されません。
              </p>
            </section>

            {/* 手紙の送り方 */}
            <section className="main-card guide-card">
              <p className="eyebrow">HOW IT WORKS</p>
              <h2>手紙の送り方</h2>
              <ol>
                <li><span>1</span>受取人IDを入力し、PayPayまたはカードで支払う</li>
                <li><span>2</span>発行されたQRコードを印刷して封筒に貼る</li>
                <li><span>3</span>運営の住所へ郵送（運営が相手へ転送）</li>
              </ol>
              <div className="address-inline">
                <small>運営の郵送先住所</small>
                <p>{serviceAddress}</p>
              </div>
            </section>

            {/* 送った手紙 */}
            <section className="main-card dashboard-span">
              <div className="card-heading">
                <div><p className="eyebrow">SENT</p><h2>送った手紙</h2></div>
              </div>
              {!sentLetters || sentLetters.length === 0 ? (
                <p className="empty-row">まだ手紙を送っていません</p>
              ) : (
                <div className="letter-list">
                  {sentLetters.map((letter) => (
                    <Link key={letter.id} href={`/letters/${letter.id}`} className="letter-row">
                      <div>
                        <strong>宛先：{letter.recipient_display_id}</strong>
                        <small>{new Date(letter.created_at).toLocaleDateString("ja-JP")}</small>
                      </div>
                      <span className={`status-pill ${statusColor(letter.status)}`}>
                        {statusLabel(letter.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 受け取った手紙 */}
            <section className="main-card dashboard-span">
              <div className="card-heading">
                <div><p className="eyebrow">RECEIVED</p><h2>受け取った手紙</h2></div>
              </div>
              {!receivedLetters || receivedLetters.length === 0 ? (
                <p className="empty-row">まだ手紙は届いていません</p>
              ) : (
                <div className="letter-list">
                  {receivedLetters.map((letter) => (
                    <div key={letter.id} className="letter-row">
                      <div>
                        <strong>受付日：{new Date(letter.received_at).toLocaleDateString("ja-JP")}</strong>
                        {letter.payout_amount ? (
                          <small className="earn-tag">
                            収益：¥{letter.payout_amount.toLocaleString()}
                            {letter.payout_status === "paid" && "（振込済み）"}
                          </small>
                        ) : null}
                      </div>
                      <span className={`status-pill ${statusColor(letter.status)}`}>
                        {statusLabel(letter.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
