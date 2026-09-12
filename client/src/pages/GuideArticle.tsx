import { Link, useRoute } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import GuideCard from "@/components/GuideCard";
import { getGuideBySlug, getRelatedGuides } from "@/content/guides";

export default function GuideArticle() {
  const [, params] = useRoute("/guide/:slug");
  const article = params?.slug ? getGuideBySlug(params.slug) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#183b35]">
        <main className="mx-auto max-w-2xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black text-[#10243a]">
            記事が見つかりません
          </h1>
          <p className="mt-3 text-sm text-[#61726c]">
            URLをご確認いただくか、記事一覧へお戻りください。
          </p>
          <Link
            href="/guide/"
            className="mt-6 inline-flex rounded-full bg-[#087f6e] px-5 py-3 text-sm font-bold text-white"
          >
            お金のガイドへ戻る
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const relatedGuides = getRelatedGuides(article);

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#183b35]">
      <header className="border-b border-[#d8e8df] bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href="/guide/"
            className="text-sm font-extrabold tracking-wide text-[#087f6e]"
          >
            お金のガイド
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#61726c] hover:text-[#087f6e]"
          >
            シミュレーターへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <article>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#078c72]">
            <span className="rounded-full bg-[#e5f6ee] px-3 py-1.5">
              {article.category}
            </span>
            <time dateTime={article.publishedAt.replaceAll(".", "-")}>
              公開 {article.publishedAt}
            </time>
            {article.updatedAt && (
              <time dateTime={article.updatedAt.replaceAll(".", "-")}>
                更新 {article.updatedAt}
              </time>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#10243a] sm:text-4xl">
            {article.title}
          </h1>
          {article.isDraft && (
            <p className="mt-4 rounded-xl border border-[#f0d5aa] bg-[#fff8e9] px-4 py-3 text-xs font-bold leading-6 text-[#9a6b3a]">
              公開前確認用の仮記事です。数値・本文・出典は正式公開前に確認・更新します。
            </p>
          )}
          <div className="mt-6 overflow-hidden rounded-3xl border border-[#d8ebe3] bg-[#eaf8f2] p-6">
            <img
              src={article.heroImage}
              alt=""
              className="mx-auto max-h-64 w-full object-contain"
            />
          </div>

          <div className="mt-8 space-y-6">
            {article.body.map((block, index) => {
              if (block.type === "heading") {
                return (
                  <h2
                    key={`${block.type}-${index}`}
                    className="border-l-4 border-[#078c72] pl-3 text-xl font-black text-[#10243a]"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "list") {
                return (
                  <ul
                    key={`${block.type}-${index}`}
                    className="space-y-2 rounded-2xl bg-white px-5 py-4 text-sm leading-7 text-[#425d55] shadow-sm"
                  >
                    {block.items.map(item => (
                      <li key={item} className="flex gap-2">
                        <span className="font-black text-[#078c72]">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={`${block.type}-${index}`}
                  className="text-sm leading-8 text-[#425d55]"
                >
                  {block.text}
                </p>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoBox
              title="計算・データの前提条件"
              items={article.assumptions}
              tone="bg-[#eef8f3]"
            />
            <InfoBox
              title="注意事項"
              items={article.cautions}
              tone="bg-[#fff8e9]"
            />
            <InfoBox
              title="出典・参考資料"
              items={article.sources}
              tone="bg-[#fff0f5]"
            />
          </div>

          <section className="mt-10 rounded-3xl bg-[#eaf8f2] px-5 py-7 text-center sm:px-8">
            <p className="text-lg font-black text-[#10243a]">
              あなたの場合は？
            </p>
            <p className="mt-2 text-sm leading-6 text-[#61726c]">
              実際の条件を入力して、将来の資産をシミュレーションしてみましょう。
            </p>
            <Link
              href="/?start=simple"
              className="mt-5 inline-flex rounded-full bg-[#078c72] px-6 py-3.5 text-sm font-black text-white shadow-[0_7px_16px_rgba(7,140,114,0.18)]"
            >
              実際にシミュレーションしてみる →
            </Link>
          </section>
        </article>

        {relatedGuides.length > 0 && (
          <section className="mt-12 border-t border-[#d8e8df] pt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-[#e69b22]">
                  RELATED ARTICLES
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#10243a]">
                  関連記事
                </h2>
              </div>
              <Link href="/guide/" className="text-xs font-bold text-[#078c72]">
                一覧を見る →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {relatedGuides.map(related => (
                <GuideCard key={related.slug} article={related} compact />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function InfoBox({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <section className={`rounded-2xl ${tone} p-4`}>
      <h2 className="text-sm font-black text-[#10243a]">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#61726c]">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
