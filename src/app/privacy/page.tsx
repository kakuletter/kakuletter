import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | KAKULETTER",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf8f3]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-bold text-xl tracking-widest text-rose-700">
            KAKULETTER
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-stone-500">
            KAKULETTER事務所（以下「当社」）は、ユーザーの個人情報の取り扱いについて、以下のとおり定めます。
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">1. 収集する個人情報</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            当社は、サービス提供にあたり以下の個人情報を収集します。
          </p>
          <ul className="text-sm text-stone-700 leading-relaxed space-y-1 list-disc list-inside pl-2">
            <li>氏名（本名）</li>
            <li>住所（郵便番号・都道府県・市区町村・番地・建物名）</li>
            <li>メールアドレス</li>
            <li>サービス利用履歴（手紙の送受信記録・ステータス）</li>
            <li>決済情報（PayPayによる決済記録。カード番号等は当社では保持しません）</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">2. 利用目的</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            収集した個人情報は、以下の目的にのみ使用します。
          </p>
          <ul className="text-sm text-stone-700 leading-relaxed space-y-1 list-disc list-inside pl-2">
            <li>手紙の転送処理（住所は転送作業にのみ使用し、文通相手には一切開示しません）</li>
            <li>サービスに関する重要なお知らせの送付</li>
            <li>不正利用の防止および調査</li>
            <li>サービスの改善・品質向上</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">3. 第三者への提供</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          </p>
          <ul className="text-sm text-stone-700 leading-relaxed space-y-1 list-disc list-inside pl-2">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づき開示が必要な場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">4. 業務委託先への提供</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            当社は、サービス運営のため以下の外部サービスを利用しており、必要な範囲で個人情報を提供する場合があります。各社のプライバシーポリシーに従って管理されます。
          </p>
          <ul className="text-sm text-stone-700 leading-relaxed space-y-1 list-disc list-inside pl-2">
            <li>Supabase, Inc.（データベース・認証管理）</li>
            <li>PayPay株式会社（決済処理）</li>
            <li>Vercel Inc.（アプリケーションホスティング）</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">5. 個人情報の管理</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            当社は、個人情報の漏洩・滅失・毀損を防ぐため、適切な安全管理措置を講じます。
            データベースへのアクセスは認証・権限管理により制限しており、
            住所等の機微情報は転送作業を担当する運営者のみが業務上必要な範囲でアクセスします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">6. 保存期間</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            個人情報は、退会手続き完了後または最終利用日から1年間保存した後、速やかに削除します。
            ただし、法令上の保存義務がある場合はこの限りではありません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">7. 開示・訂正・削除の請求</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            ユーザーは自己の個人情報について、開示・訂正・削除・利用停止を請求できます。
            下記の問い合わせ先までご連絡ください。合理的な期間内に対応します。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">8. Cookie・アクセス解析</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            当社はログイン状態の維持のためにCookieを使用します。
            現時点ではアクセス解析ツール（Google Analytics等）は導入していません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">9. ポリシーの変更</h2>
          <p className="text-sm text-stone-700 leading-relaxed">
            本ポリシーは法令の改正やサービス内容の変更に伴い、予告なく改定することがあります。
            重要な変更については、サービス内またはメールにてお知らせします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">10. お問い合わせ</h2>
          <div className="text-sm text-stone-700 leading-relaxed space-y-1">
            <p>個人情報の取り扱いに関するお問い合わせは下記までご連絡ください。</p>
            <p>事業者名：KAKULETTER事務所</p>
            <p>代表者：冨田航平</p>
            <p>メール：kakuletter@gmail.com</p>
            <p>電話：080-8034-2637</p>
          </div>
        </section>

        <p className="text-xs text-stone-400 pt-4 border-t border-stone-200">
          制定日：2026年6月1日
        </p>
      </main>

      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm">
        <p>&copy; 2025 KAKULETTER</p>
      </footer>
    </div>
  );
}
