import { describe, expect, it } from "vitest";
import {
  getGuideBySlug,
  getGuidesByNewest,
  getRelatedGuides,
  guides,
} from "./guides";

describe("money guide content", () => {
  it("contains the three formal release articles with configured images", () => {
    expect(guides).toHaveLength(4);
    expect(guides.map(article => article.slug)).toEqual([
      "house-price-by-household-income",
      "fixed-or-variable-mortgage",
      "child-cost-by-age",
      "smartphone-plan-comparison",
    ]);
    expect(guides.every(article => !article.isDraft)).toBe(true);
    expect(guides.map(article => article.publishedAt)).toEqual([
      "2026.09.16",
      "2026.09.16",
      "2026.09.16",
      "2026.09.20",
    ]);
    expect(
      guides.every(article => article.thumbnail.startsWith("/manus-storage/"))
    ).toBe(true);
    expect(
      guides.every(article => article.heroImage.startsWith("/manus-storage/"))
    ).toBe(true);
    expect(
      guides.every(article =>
        article.instagramImage?.startsWith("/manus-storage/")
      )
    ).toBe(true);
  });

  it("resolves an article and returns only existing related articles", () => {
    const article = getGuideBySlug("fixed-or-variable-mortgage");
    expect(article?.title).toContain("固定と変動");
    expect(getGuideBySlug("missing-article")).toBeUndefined();
    expect(getRelatedGuides(article!)).toHaveLength(3);
    expect(
      getRelatedGuides(article!).some(related => related.slug === article!.slug)
    ).toBe(false);
  });

  it("sorts guides by published date without mutating the source array", () => {
    const sorted = getGuidesByNewest();

    expect(sorted[0]?.slug).toBe("smartphone-plan-comparison");
    expect(sorted.map(article => article.publishedAt)).toEqual([
      "2026.09.20",
      "2026.09.16",
      "2026.09.16",
      "2026.09.16",
    ]);
    expect(guides[0]?.slug).toBe("house-price-by-household-income");
  });

  it("keeps the approved mineo and HIS mobile ad codes unchanged", () => {
    const article = getGuideBySlug("smartphone-plan-comparison");
    const relevantBlocks = article?.body.filter(
      block => block.type === "serviceInfo" || block.type === "affiliateAd",
    );

    expect(relevantBlocks).toEqual([
      {
        type: "serviceInfo",
        service: "mineo",
        feature:
          "独自サービスが豊富な格安SIM。データ容量で選ぶ「マイピタ」に加え、通信速度で選ぶ「マイそく」など、使い方に合わせてプランを選べるのが特徴です。",
        recommendedFor: [
          "データをたくさん使いたい人",
          "料金と使い方のバランスを自分で選びたい人",
        ],
      },
      {
        type: "affiliateAd",
        label: "mineo（マイネオ）広告",
        href: "https://h.accesstrade.net/sp/cc?rk=0100p12100oyul",
        imageSrc: "https://h.accesstrade.net/sp/rr?rk=0100p12100oyul",
        alt: "mineo（マイネオ）",
        width: 300,
        height: 250,
      },
      {
        type: "serviceInfo",
        service: "HISモバイル",
        feature:
          "少容量から選べる料金プランが特徴の格安SIM。Wi-Fi中心などデータ使用量が少ない人は、毎月の通信費を抑えやすい選択肢です。",
        recommendedFor: [
          "Wi-Fiを使うことが多い人",
          "毎月のデータ使用量が少ない人",
          "スマホの固定費を抑えたい人",
        ],
      },
      {
        type: "affiliateAd",
        label: "HISモバイル広告",
        href: "https://h.accesstrade.net/sp/cc?rk=0100o6ly00oyul",
        imageSrc: "https://h.accesstrade.net/sp/rr?rk=0100o6ly00oyul",
        alt: "HISモバイル",
        width: 300,
        height: 250,
      },
    ]);
  });
});
