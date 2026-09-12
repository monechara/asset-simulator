import { describe, expect, it } from "vitest";
import { getGuideBySlug, getRelatedGuides, guides } from "./guides";

describe("money guide content", () => {
  it("contains the three initial draft articles", () => {
    expect(guides).toHaveLength(3);
    expect(guides.map(article => article.slug)).toEqual([
      "house-price-by-household-income",
      "fixed-or-variable-mortgage",
      "child-cost-by-age",
    ]);
    expect(guides.every(article => article.isDraft)).toBe(true);
  });

  it("resolves an article and returns only existing related articles", () => {
    const article = getGuideBySlug("fixed-or-variable-mortgage");
    expect(article?.title).toContain("固定と変動");
    expect(getGuideBySlug("missing-article")).toBeUndefined();
    expect(getRelatedGuides(article!)).toHaveLength(2);
    expect(
      getRelatedGuides(article!).some(related => related.slug === article!.slug)
    ).toBe(false);
  });
});
