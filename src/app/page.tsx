import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header isLoggedIn={!!user} />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <p className="text-rose-700 text-sm font-medium tracking-widest mb-4 uppercase">
          Anonymous Pen-Pal Service
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-6">
          あなたの想いを、<br />IDで届ける。
        </h1>
        <p className="text-stone-600 text-lg max-w-xl mb-10 leading-relaxed">
          KAKULETTERは、住所を明かさずに文通できるサービスです。
          IDを交換するだけで、実際の手紙を匿名で送り合えます。
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/send"
            className="bg-rose-700 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-800 transition-colors"
          >
            手紙を送る
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="border border-stone-300 text-stone-700 px-8 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
            >
              マイページへ
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="border border-stone-300 text-stone-700 px-8 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
              >
                無料登録（受取人はこちら）
              </Link>
              <a
                href="#how-it-works"
                className="border border-stone-300 text-stone-700 px-8 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
              >
                使い方を見る
              </a>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-900 mb-12">
            3ステップで始められる
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "登録してIDを取得",
                desc: "氏名と住所を登録すると、あなた専用のIDが発行されます。このIDが文通の「住所」になります。",
              },
              {
                step: "02",
                title: "IDを交換する",
                desc: "文通したい相手とIDを交換します。SNSや直接会った際に教え合いましょう。",
              },
              {
                step: "03",
                title: "QRコードを貼って郵送",
                desc: "相手のIDを入力してPayPayで310円を支払うとQRコードが発行されます。封筒に貼って運営へ郵送すると、運営が相手の住所へ転送します。",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-rose-700 font-bold text-sm">{step}</span>
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-stone-900 mb-12">
            KAKULETTERの特徴
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔒",
                title: "完全匿名",
                desc: "相手に実際の住所が伝わることはありません。IDだけで文通できます。",
              },
              {
                icon: "✉️",
                title: "本物の手紙",
                desc: "デジタルではなく、実際の紙の手紙でやりとりします。温かみのある体験を。",
              },
              {
                icon: "🛡️",
                title: "安心・安全",
                desc: "運営が中継するため、個人情報が相手に漏れる心配がありません。",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-stone-200">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-rose-700 py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          さっそく手紙を送ってみませんか？
        </h2>
        <p className="text-rose-100 mb-8">
          登録不要。相手のIDを入力してPayPayで310円を支払うだけ。
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/send"
            className="bg-white text-rose-700 px-8 py-3 rounded-full font-medium hover:bg-rose-50 transition-colors"
          >
            手紙を送る
          </Link>
          {!user && (
            <Link
              href="/auth/register"
              className="border border-white text-white px-8 py-3 rounded-full font-medium hover:bg-rose-800 transition-colors"
            >
              受取人として登録する
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm space-y-2">
        <p>&copy; 2025 KAKULETTER</p>
        <div className="flex justify-center gap-6">
          <Link href="/legal" className="hover:text-stone-200 underline">
            特定商取引法に基づく表示
          </Link>
          <Link href="/privacy" className="hover:text-stone-200 underline">
            プライバシーポリシー
          </Link>
        </div>
      </footer>
    </div>
  );
}
