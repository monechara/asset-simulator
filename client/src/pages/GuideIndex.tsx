import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import GuideCard from "@/components/GuideCard";
import { guides } from "@/content/guides";

export default function GuideIndex() {
  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#183b35]">
      <header className="border-b border-[#d8e8df] bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
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

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
        <section className="rounded-[2rem] bg-[#eaf8f2] px-5 py-8 sm:px-10">
          <p className="text-xs font-black tracking-[0.18em] text-[#078c72]">
            MONEY GUIDE
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#10243a] sm:text-4xl">
            お金のガイド
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#61726c]">
            暮らしに役立つお金の情報を、わかりやすく。
          </p>
          {guides.some(article => article.isDraft) && (
            <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-xs font-semibold leading-6 text-[#9a6b3a]">
              掲載記事は現在、公開前の内容確認用です。数値・本文・出典は正式公開前に更新します。
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(article => (
            <GuideCard key={article.slug} article={article} compact />
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
