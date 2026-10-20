import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { guides, type GuideArticle, type GuideBodyBlock } from "../client/src/content/guides";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(projectRoot, "dist", "public");
const siteUrl = "https://assetsim.jp";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function staticImagePath(src: string | undefined): string {
  return src ?? "";
}

function renderBlock(block: GuideBodyBlock): string {
  switch (block.type) {
    case "heading":
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "list":
      return `<ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "table":
      return `<figure><figcaption>${escapeHtml(block.caption)}</figcaption><table><thead><tr>${block.columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></figure>`;
    case "imagePlaceholder":
      return block.src
        ? `<figure><img src="${escapeHtml(staticImagePath(block.src))}" alt="${escapeHtml(block.alt)}"><figcaption>${escapeHtml(block.label)}</figcaption></figure>`
        : `<p><strong>${escapeHtml(block.label)}</strong></p>`;
    case "summaryCard":
      return `<section><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.text)}</p><ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
    case "affiliateLink":
      return `<p><a href="${escapeHtml(block.href)}">${escapeHtml(block.buttonText)}</a></p>`;
    case "serviceInfo":
      return `<section><h2>${escapeHtml(block.service)}</h2><p><strong>特徴：</strong>${escapeHtml(block.feature)}</p><h3>こんな人におすすめ</h3><ul>${block.recommendedFor.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
    case "affiliateAd":
      return `<aside><p><strong>PR</strong> ${escapeHtml(block.label)}</p><a href="${escapeHtml(block.href)}"><img src="${escapeHtml(block.imageSrc)}" alt="${escapeHtml(block.alt)}" width="${block.width}" height="${block.height}"></a></aside>`;
  }
}

function renderArticle(article: GuideArticle): string {
  const publishedDate = article.publishedAt.replaceAll(".", "-");
  const updatedDate = article.updatedAt?.replaceAll(".", "-");
  const hero = `<figure><img src="${escapeHtml(staticImagePath(article.heroImage))}" alt="${escapeHtml(article.title)}"><figcaption>${escapeHtml(article.imageNote ?? "")}</figcaption></figure>`;
  const body = article.body.map(renderBlock).join("\n");
  const sources = article.sources.map(source => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a></li>`).join("");
  const related = `<p><a href="${siteUrl}/guide/">お金のガイド一覧へ戻る</a></p>`;

  return `<article class="seo-guide-article">
    <header>
      <p>${escapeHtml(article.category)} · <time datetime="${publishedDate}">公開 ${escapeHtml(article.publishedAt)}</time>${updatedDate ? ` · <time datetime="${updatedDate}">更新 ${escapeHtml(article.updatedAt!)}</time>` : ""}</p>
      <h1>${escapeHtml(article.title)}</h1>
      <p>${escapeHtml(article.summary)}</p>
      ${hero}
    </header>
    <div class="seo-guide-body">${body}</div>
    <section><h2>${escapeHtml(article.ctaTitle ?? "あなたの場合は？")}</h2><p>${escapeHtml(article.ctaDescription ?? "")}</p><p><a href="${siteUrl}/?start=simple">${escapeHtml(article.ctaLabel ?? "30秒でシミュレーションする")}</a></p></section>
    <section><h2>前提条件・注意事項</h2><ul>${article.assumptions.concat(article.cautions).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
    <section><h2>出典・参考資料</h2><ul>${sources}</ul></section>
    ${related}
  </article>`;
}

function insertBeforeRoot(html: string, content: string): string {
  const marker = '<div id="root"></div>';
  if (!html.includes(marker)) throw new Error("index.html root marker was not found");
  return html.replace(marker, `<div id="seo-static-content">${content}</div>${marker}`);
}

function upsertMeta(html: string, article: GuideArticle): string {
  const title = escapeHtml(`${article.title} | お金のガイド | 資産形成シミュレーター`);
  const description = escapeHtml(article.summary);
  const canonical = `${siteUrl}/guide/${article.slug}`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${description}" />`)
    .replace("</head>", `    <link rel="canonical" href="${canonical}" />\n  </head>`);
}

const baseHtml = await readFile(path.join(publicDir, "index.html"), "utf8");

for (const article of guides) {
  const articleDir = path.join(publicDir, "guide", article.slug);
  await mkdir(articleDir, { recursive: true });
  const html = insertBeforeRoot(upsertMeta(baseHtml, article), renderArticle(article));
  await writeFile(path.join(articleDir, "index.html"), html, "utf8");
}

console.log(`Prerendered ${guides.length} guide articles into ${path.join(publicDir, "guide")}`);
