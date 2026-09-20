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
});
