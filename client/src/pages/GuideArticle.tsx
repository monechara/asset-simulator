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
              if (block.type === "table") {
                return (
                  <figure
                    key={`${block.type}-${index}`}
                    className="overflow-hidden rounded-2xl border border-[#d8ebe3] bg-white shadow-sm"
                  >
                    <figcaption className="border-b border-[#d8ebe3] bg-[#eef8f3] px-4 py-3 text-sm font-black leading-6 text-[#10243a]">
                      {block.caption}
                    </figcaption>
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="min-w-[760px] w-full border-collapse text-left text-xs text-[#425d55]">
                        <thead className="bg-[#f7fbf8] text-[#10243a]">
                          <tr>
                            {block.columns.map(column => (
                              <th
                                key={column}
                                className="border-b border-[#d8ebe3] px-3 py-3 font-black"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, rowIndex) => (
                            <tr
                              key={`${rowIndex}-${row[0]}`}
                              className="align-top odd:bg-white even:bg-[#fbfefc]"
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={`${rowIndex}-${cellIndex}`}
                                  className="border-b border-[#edf3ef] px-3 py-3 leading-5"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-3 p-3 sm:hidden">
                      {block.rows.map((row, rowIndex) => (
                        <section
                          key={`${rowIndex}-${row[0]}`}
                          className="rounded-2xl border border-[#d8ebe3] bg-[#fbfefc] p-4"
                        >
                          <h3 className="text-base font-black text-[#10243a]">
                            {row[0]}
                          </h3>
                          <dl className="mt-3 grid gap-2">
                            {block.columns
                              .slice(1)
                              .map((column, columnIndex) => (
                                <div
                                  key={`${rowIndex}-${column}`}
                                  className="flex items-start justify-between gap-3 border-t border-[#edf3ef] pt-2 text-xs"
                                >
                                  <dt className="font-bold text-[#61726c]">
                                    {column}
                                  </dt>
                                  <dd className="text-right font-black text-[#183b35]">
                                    {row[columnIndex + 1]}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        </section>
                      ))}
                    </div>
                  </figure>
                );
              }
              if (block.type === "summaryCard") {
                return (
                  <section
                    key={`${block.type}-${index}`}
                    className="rounded-3xl border border-[#9ad8c7] bg-[#eaf8f2] px-5 py-5 shadow-sm sm:px-6"
                  >
                    <p className="text-xl font-black leading-8 text-[#087f6e]">
                      {block.title}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#183b35]">
                      {block.text}
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {block.items.map(item => (
                        <p
                          key={item}
                          className="rounded-2xl bg-white/80 px-3 py-2 text-sm font-bold leading-6 text-[#425d55]"
                        >
                          <span className="mr-1 text-[#078c72]">✓</span>
                          {item}
                        </p>
                      ))}
                    </div>
                  </section>
                );
              }
              if (block.type === "imagePlaceholder") {
                return (
                  <figure
                    key={`${block.type}-${index}`}
                    className="rounded-3xl border border-dashed border-[#9acfc0] bg-[#eef8f3] px-5 py-8 text-center"
                  >
                    {(block.src ?? article.instagramImage) ? (
                      <img
                        src={block.src ?? article.instagramImage}
                        alt={block.alt}
                        className="mx-auto max-h-[520px] rounded-2xl object-contain"
                      />
                    ) : (
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-[#087f6e]">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                          画像差し替え欄
                        </span>
                        <p className="text-sm font-bold leading-6">
                          {block.label}
                        </p>
                        <p className="text-xs leading-5 text-[#61726c]">
                          正式なInstagram投稿画像を受領後、記事データのinstagramImageへ設定します。
                        </p>
                      </div>
                    )}
                  </figure>
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
            <p className="text-lg font-black leading-7 text-[#10243a]">
              {article.ctaTitle ?? "あなたの場合は？"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#61726c]">
              {article.ctaDescription ??
                "実際の条件を入力して、将来の資産をシミュレーションしてみましょう。"}
            </p>
            <Link
              href="/?start=simple"
              className="mt-5 inline-flex rounded-full bg-[#078c72] px-6 py-3.5 text-sm font-black text-white shadow-[0_7px_16px_rgba(7,140,114,0.18)]"
            >
              {article.ctaLabel ?? "実際にシミュレーションしてみる"} →
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
