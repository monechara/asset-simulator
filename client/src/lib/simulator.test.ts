import { describe, expect, it } from "vitest";
import {
  calculateEventComparison,
  calculateMonthlyComparison,
  calculateSimulation,
  createEvent,
  createHousingEvent,
  type SimulatorInput,
} from "./simulator";

const base = (overrides: Partial<SimulatorInput> = {}): SimulatorInput => ({
  currentAge: 30,
  targetAge: 31,
  currentCashAssets: 1_000_000,
  currentInvestmentAssets: 0,
  monthlyIncome: 0,
  monthlyLivingExpenses: 0,
  monthlyInvestmentContribution: 0,
  annualBonusInvestment: 0,
  annualReturnRate: 0,
  retirementAge: 65,
  annualRetirementIncome: 0,
  retirementLivingExpenseRatio: 0.75,
  targetAssets: 0,
  lifeEvents: [],
  ...overrides,
});

describe("人生全体マネープラン計算", () => {
  it("ケースA: 収支・積立・利回りが0なら100万円のまま", () => {
    const result = calculateSimulation(base());
    expect(result.targetAgeAssets).toBe(1_000_000);
    expect(result.isDepleted).toBe(false);
  });

  it("ケースB: 現金60万円と投資60万円が増え、総金融資産は220万円", () => {
    const result = calculateSimulation(base({
      monthlyIncome: 300_000,
      monthlyLivingExpenses: 200_000,
      monthlyInvestmentContribution: 50_000,
    }));
    const yearEnd = result.yearlyRecords.at(-1)!;
    expect(yearEnd.cashEnd).toBe(1_600_000);
    expect(yearEnd.investmentEnd).toBe(600_000);
    expect(result.targetAgeAssets).toBe(2_200_000);
  });

  it("年間ボーナス投資は年末に投資資産へ振り替え、総資産へ一度だけ加算する", () => {
    const result = calculateSimulation(base({ annualBonusInvestment: 200_000 }));
    const yearEnd = result.yearlyRecords.at(-1)!;
    expect(yearEnd.cashEnd).toBe(1_000_000);
    expect(yearEnd.investmentEnd).toBe(200_000);
    expect(result.targetAgeAssets).toBe(1_200_000);
    expect(result.totalPrincipalContributed).toBe(200_000);
  });

  it("年金の年間収入は老後開始年齢以降の収支へ反映する", () => {
    const result = calculateSimulation(base({
      currentAge: 64,
      targetAge: 66,
      currentCashAssets: 0,
      monthlyLivingExpenses: 100_000,
      retirementAge: 65,
      annualRetirementIncome: 1_800_000,
    }));
    const retirementYear = result.yearlyRecords.find((record) => record.age === 65)!;
    expect(retirementYear.annualIncome).toBe(1_800_000);
    expect(retirementYear.annualLivingExpenses).toBe(900_000);
  });

  it("ケースC: 年末に資産が不足し、年次枯渇判定が立つ", () => {
    const result = calculateSimulation(base({
      monthlyLivingExpenses: 100_000,
    }));
    expect(result.isDepleted).toBe(true);
    expect(result.depletedAge).toBe(31);
    expect(result.depletedMonth).toBe(10);
    expect(result.targetAgeAssets).toBe(0);
  });

  it("ケースD: 住宅購入年は頭金、翌年からローン返済だけを反映する", () => {
    const event = createHousingEvent({
      age: 31,
      propertyPrice: 40_000_000,
      downPayment: 5_000_000,
      annualInterestRate: 1,
      repaymentYears: 35,
    });
    const result = calculateSimulation(base({
      targetAge: 33,
      currentCashAssets: 10_000_000,
      lifeEvents: [event],
    }));
    const purchaseYear = result.yearlyRecords.find((record) => record.age === 31)!;
    const repaymentYear = result.yearlyRecords.find((record) => record.age === 32)!;
    expect(purchaseYear.eventCost).toBe(5_000_000);
    expect(purchaseYear.loanRepayment).toBe(0);
    expect(repaymentYear.eventCost).toBe(0);
    expect(repaymentYear.loanRepayment).toBeGreaterThan(0);
    expect(result.targetAgeAssets).toBeLessThan(10_000_000);
  });

  it("積立額変更のもしも比較は基準より金融資産を増やす", () => {
    const input = base({
      targetAge: 40,
      monthlyInvestmentContribution: 30_000,
      annualReturnRate: 5,
    });
    const comparisons = calculateMonthlyComparison(input, [10_000, 30_000]);
    expect(comparisons[0].monthlyInvestment).toBe(40_000);
    expect(comparisons[0].difference).toBeGreaterThan(0);
    expect(comparisons[1].finalAssets).toBeGreaterThan(comparisons[0].finalAssets);
  });

  it("ライフイベント追加は該当年の支出として金融資産を減らす", () => {
    const event = createEvent({ type: "marriage", title: "結婚", age: 31, cost: 3_000_000 });
    const comparison = calculateEventComparison(base({ targetAge: 40, currentCashAssets: 10_000_000 }), event);
    expect(comparison.finalAssetsWithEvent).toBeLessThan(comparison.finalAssetsWithoutEvent);
    expect(comparison.difference).toBe(-3_000_000);
  });

  it("不正な年齢・負数・非有限値を安全に拒否する", () => {
    expect(() => calculateSimulation(base({ currentAge: 17 }))).toThrow();
    expect(() => calculateSimulation(base({ currentCashAssets: -1 }))).toThrow();
    expect(() => calculateSimulation(base({ monthlyIncome: Number.NaN }))).toThrow();
  });
});
