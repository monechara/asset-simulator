import { describe, expect, it } from "vitest";
import type { ImprovementProposal } from "./simulator";
import { getImprovementDisplayMetrics } from "./improvementDisplay";

const proposal = (overrides: Partial<ImprovementProposal> = {}): ImprovementProposal => ({
  category: "monthly-investment",
  title: "積立を始める",
  description: "毎月5,000円から積立を始める",
  changedParamLabel: "毎月の積立額",
  beforeValueFormatted: "0円/月",
  afterValueFormatted: "5,000円/月",
  beforeTargetAgeAssets: 0,
  beforeDepletedAge: 32,
  afterDepletedAge: 32,
  beforeShortfall: 2_700,
  afterShortfall: 2_700,
  score: 1,
  updatedInput: {} as ImprovementProposal["updatedInput"],
  updatedResult: {} as ImprovementProposal["updatedResult"],
  ...overrides,
});

describe("improvement display metrics", () => {
  it("不​​足額だけが改善した場合は改善額を返し、寿命指標を隠す", () => {
    const metrics = getImprovementDisplayMetrics(proposal({ afterShortfall: 2_432, updatedResult: { targetAgeAssets: 1_370 } as ImprovementProposal["updatedResult"] }), 90)!;

    expect(metrics.showShortfallImprovement).toBe(true);
    expect(metrics.shortfallImprovement).toBe(268);
    expect(metrics.showLifeExtension).toBe(false);
    expect(metrics.primaryMetric).toBe("shortfall");
    expect(metrics.beforeTargetAgeAssets).toBe(0);
    expect(metrics.afterTargetAgeAssets).toBe(1_370);
    expect(metrics.targetAgeAssetIncrease).toBe(1_370);
  });

  it("資産寿命だけが延びた場合は延長年数を返し、不足額指標を隠す", () => {
    const metrics = getImprovementDisplayMetrics(proposal({ beforeShortfall: 2_700, afterShortfall: 2_700, afterDepletedAge: 35 }), 90)!;

    expect(metrics.showShortfallImprovement).toBe(false);
    expect(metrics.showLifeExtension).toBe(true);
    expect(metrics.lifeExtensionYears).toBe(3);
    expect(metrics.primaryMetric).toBe("life");
  });

  it("両方改善した場合は両方を表示し、不足額を主指標にする", () => {
    const metrics = getImprovementDisplayMetrics(proposal({ afterShortfall: 2_432, afterDepletedAge: 35 }), 90)!;

    expect(metrics.showShortfallImprovement).toBe(true);
    expect(metrics.showLifeExtension).toBe(true);
    expect(metrics.shortfallImprovement).toBe(268);
    expect(metrics.lifeExtensionYears).toBe(3);
    expect(metrics.primaryMetric).toBe("shortfall");
  });

  it("変化がない場合は表示指標を返さない", () => {
    const metrics = getImprovementDisplayMetrics(proposal(), 90)!;

    expect(metrics.showShortfallImprovement).toBe(false);
    expect(metrics.showLifeExtension).toBe(false);
    expect(metrics.primaryMetric).toBeNull();
  });
});
