import { describe, expect, it } from "vitest";
import { buildAssetChartData } from "./chartData";
import { calculateSimulation, createEvent, type SimulatorInput } from "./simulator";

const input: SimulatorInput = {
  currentAge: 32,
  investmentEndAge: 65,
  retirementEndAge: 90,
  currentCashAssets: 1_000_000,
  currentInvestmentAssets: 1_000_000,
  monthlyIncome: 500_000,
  monthlyLivingExpenses: 150_000,
  monthlyInvestmentContribution: 50_000,
  annualBonusInvestment: 0,
  annualReturnRate: 5,
  retirementAge: 65,
  annualRetirementIncome: 2_200_000,
  retirementMonthlyLivingExpenses: 270_000,
  retirementLivingExpenseRatio: 0.75,
  targetAssets: 0,
  householdSize: 1,
  lifeEvents: [createEvent({ id: "car-40", type: "other", title: "車購入", age: 40, cost: 5_000_000 })],
  targetAge: 90,
};

describe("asset chart data transformation", () => {
  it("keeps every yearly record and maps the same total used by yearlyRecords", () => {
    const result = calculateSimulation(input);
    const chartData = buildAssetChartData(result.yearlyRecords);

    expect(chartData).toHaveLength(result.yearlyRecords.length);
    expect(chartData[0].age).toBe(32);
    expect(chartData.at(-1)?.age).toBe(90);

    const record40 = result.yearlyRecords.find((record) => record.age === 40)!;
    const point40 = chartData.find((point) => point.age === 40)!;
    expect(point40.総金融資産).toBe(Math.round(record40.totalFinancialAssets / 10_000));
    expect(point40.現金資産 + point40.投資資産).toBe(point40.総金融資産);
    expect(point40.イベント費).toBe(500);
    expect(point40.イベント名).toBe("車購入");
  });
});
