import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";

const sections = [
  {
    title: "運営者情報",
    content: (
      <>
        <p>サイト名：資産形成シミュレーター</p>
        <p>運営者：資産形成シミュレーター運営</p>
        <p className="mt-4">
          本サイトは、将来のお金について気軽にシミュレーションし、資産形成について考えるきっかけを提供することを目的としたWebサービスです。
        </p>
      </>
    ),
  },
  {
    title: "免責事項",
    content: (
      <p>
        本サイトで表示されるシミュレーション結果は、入力された条件および一定の仮定に基づく参考値です。実際の運用成果、金利、税金、物価、各種費用等を保証するものではありません。投資、住宅ローン、保険その他の金融に関する最終的な判断は、ご自身の責任において行ってください。本サイトの情報を利用したことによって生じた損害等について、運営者は法令上認められる範囲で責任を負いません。
      </p>
    ),
  },
  {
    title: "広告・アフィリエイトについて",
    content: (
      <p>
        本サイトでは、アフィリエイトプログラム等を利用して商品・サービスを紹介する場合があります。リンクを経由して商品・サービスの申込みや購入が行われた場合、運営者が広告主等から報酬を受け取ることがあります。広告であることが分かるよう適切な表示を行います。
      </p>
    ),
  },
  {
    title: "プライバシーポリシー",
    content: (
      <p>
        本サイトでは、サービス改善や利用状況の分析を目的として、Google Analytics
        4（GA4）等のアクセス解析サービスを利用しています。これらのサービスではCookie等を利用してアクセス情報を収集する場合があります。収集される情報には、通常、氏名やメールアドレスなど利用者を直接特定する情報は含まれません。取得した情報は、サイトの利用状況の分析およびサービス改善等の目的で利用します。お問い合わせフォームから取得した情報は、お問い合わせへの対応に必要な範囲で利用します。
      </p>
    ),
  },
];

export default function Policy() {
  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#183b35]">
      <header className="border-b border-[#d8e8df] bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-extrabold tracking-wide text-[#087f6e]"
          >
            資産形成シミュレーター
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#61726c] hover:text-[#087f6e]"
          >
            シミュレーターへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#e69b22]">
            SITE INFORMATION
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#183b35] sm:text-3xl">
            運営・サイトポリシー
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#61726c]">
            当サイトの運営者情報、免責事項、広告・アフィリエイト、プライバシーに関する方針をご案内します。
          </p>
        </div>

        <div className="space-y-4">
          {sections.map(section => (
            <section
              key={section.title}
              className="rounded-2xl border border-[#d8e8df] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(25,78,64,0.05)] sm:px-7"
            >
              <h2 className="text-base font-black text-[#087f6e]">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-8 text-[#425d55]">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="inline-flex rounded-full bg-[#087f6e] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,127,110,0.18)] transition hover:bg-[#066b5d]"
          >
            お問い合わせはこちら
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
