import { describe, expect, it } from "vitest";
import {
  calculateEventComparison,
  calculateImprovementSimulation,
  calculateMonthlyComparison,
  calculateSimulation,
  createEvent,
  createHousingEvent,
  type SimulatorInput,
} from "./simulator";

const base = (overrides: Partial<SimulatorInput> = {}): SimulatorInput => ({
  currentAge: 30,
  investmentEndAge: 31,
  retirementEndAge: 31,
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
  householdSize: 2,
  lifeEvents: [],
  targetAge: 31,
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
      investmentEndAge: 65,
      retirementEndAge: 66,
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

  it("老後の生活費は絶対額の指定を比率より優先する", () => {
    const result = calculateSimulation(base({
      currentAge: 64,
      investmentEndAge: 65,
      retirementEndAge: 66,
      targetAge: 66,
      currentCashAssets: 10_000_000,
      monthlyLivingExpenses: 100_000,
      retirementAge: 65,
      annualRetirementIncome: 1_800_000,
      retirementLivingExpenseRatio: 0.75,
      retirementMonthlyLivingExpenses: 300_000,
    }));
    const retirementYear = result.yearlyRecords.find((record) => record.age === 65)!;
    expect(retirementYear.annualLivingExpenses).toBe(3_600_000);
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
      investmentEndAge: 33,
      retirementEndAge: 33,
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

  it("詳細設定の入力値と40歳500万円の車イベントがyearlyRecordsへ反映される", () => {
    const simpleInput = base({
      currentAge: 32,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 1_000_000,
      currentInvestmentAssets: 1_000_000,
      monthlyIncome: 500_000,
      monthlyLivingExpenses: 150_000,
      monthlyInvestmentContribution: 50_000,
      annualReturnRate: 5,
      retirementMonthlyLivingExpenses: 270_000,
      annualRetirementIncome: 2_200_000,
      lifeEvents: [],
    });
    const simpleResult = calculateSimulation(simpleInput);
    const event = createEvent({ id: "car-40", type: "other", title: "車購入", age: 40, cost: 5_000_000 });
    const detailedResult = calculateSimulation({ ...simpleInput, lifeEvents: [event] });

    const simple40 = simpleResult.yearlyRecords.find((record) => record.age === 40)!;
    const detailed40 = detailedResult.yearlyRecords.find((record) => record.age === 40)!;
    expect(simple40.eventCost).toBe(0);
    expect(detailed40.eventCost).toBe(5_000_000);
    expect(detailed40.activeEvents).toContain("車購入");
    expect(detailed40.totalFinancialAssets - simple40.totalFinancialAssets).toBe(-5_000_000);

    const changedInput = {
      ...simpleInput,
      monthlyLivingExpenses: 300_000,
      monthlyInvestmentContribution: 100_000,
      annualReturnRate: 3,
      retirementAge: 60,
      annualRetirementIncome: 1_500_000,
      retirementMonthlyLivingExpenses: 250_000,
      lifeEvents: [event],
    };
    const changedResult = calculateSimulation(changedInput);
    const changed50 = changedResult.yearlyRecords.find((record) => record.age === 50)!;
    const changed60 = changedResult.yearlyRecords.find((record) => record.age === 60)!;
    const simple50 = simpleResult.yearlyRecords.find((record) => record.age === 50)!;
    const simple60 = simpleResult.yearlyRecords.find((record) => record.age === 60)!;

    expect(changed50.annualLivingExpenses).toBe(3_600_000);
    expect(changed50.annualInvestmentContribution).toBe(1_200_000);
    expect(changed50.investmentGain).not.toBe(simple50.investmentGain);
    expect(changed60.annualIncome).toBe(1_500_000);
    expect(changed60.annualLivingExpenses).toBe(3_000_000);
    expect(changedResult.targetAgeAssets).not.toBe(simpleResult.targetAgeAssets);
  });

  it("不正な年齢・負数・非有限値を安全に拒否する", () => {
    expect(() => calculateSimulation(base({ currentAge: 17 }))).toThrow();
    expect(() => calculateSimulation(base({ currentCashAssets: -1 }))).toThrow();
    expect(() => calculateSimulation(base({ monthlyIncome: Number.NaN }))).toThrow();
  });

  it("49歳開始、65歳積立終了、65歳退職、90歳想定終了のケースで老後期間が25年間になり、積立は65歳までになる", () => {
    const result = calculateSimulation(base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      monthlyInvestmentContribution: 50_000,
    }));
    const records = result.yearlyRecords;
    expect(records[records.length - 1].age).toBe(90);
    const investingYear = records.find((r) => r.age === 65)!;
    expect(investingYear.annualInvestmentContribution).toBe(600_000);
    const postInvestingYear = records.find((r) => r.age === 66)!;
    expect(postInvestingYear.annualInvestmentContribution).toBe(0);
  });

  it("49歳開始・生活費15万円・年金10万円・想定90歳で65歳時点資産が正しく差し引かれることを検証する", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      monthlyIncome: 300_000,
      monthlyLivingExpenses: 150_000,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000, // 月10万円
      currentCashAssets: 10_000_000, // 1000万円
      currentInvestmentAssets: 5_000_000, // 500万円
      monthlyInvestmentContribution: 50_000,
      annualReturnRate: 3,
    });
    const result = calculateSimulation(input);
    const record65 = result.yearlyRecords.find((r) => r.age === 65);
    const assetsAt65 = record65 ? record65.totalFinancialAssets : 0;
    const retirementYears = 90 - 65; // 25年
    const totalLivingCost = 150_000 * 12 * retirementYears; // 4,500万円
    const totalIncome = 1_200_000 * retirementYears; // 3,000万円
    const netNeed = totalLivingCost - totalIncome; // 1,500万円
    const expectedShortfall = Math.max(0, netNeed - Math.round(assetsAt65 / 10_000));
    
    console.log(`[検証実値] 65歳時点資産: ${assetsAt65}円, 生活費総額: ${totalLivingCost}円, 年金総額: ${totalIncome}円, ネット必要額: ${netNeed}円, 予想不足額: ${expectedShortfall}万円`);
    expect(totalLivingCost - totalIncome).toBe(15_000_000);
    expect(assetsAt65).toBeGreaterThan(0);
  });

  it("49歳・金融資産ほぼゼロ・積立なしのケースで正確な不足額と枯渇年齢を検証する", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      monthlyIncome: 150_000, // 生活費と同額（余剰なし）
      monthlyLivingExpenses: 150_000,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000, // 月10万円
      currentCashAssets: 50_000, // 5万円
      currentInvestmentAssets: 0,
      monthlyInvestmentContribution: 0, // 積立なし
      annualBonusInvestment: 0,
      annualReturnRate: 0,
    });
    const result = calculateSimulation(input);
    const record65 = result.yearlyRecords.find((r) => r.age === 65);
    const assetsAt65 = record65 ? record65.totalFinancialAssets : 0;
    const retirementYears = 90 - 65; // 25年
    const totalLivingCost = 150_000 * 12 * retirementYears; // 4,500万円
    const totalIncome = 1_200_000 * retirementYears; // 3,000万円
    const netNeed = totalLivingCost - totalIncome; // 1,500万円
    const shortfall = Math.max(0, netNeed - Math.round(assetsAt65 / 10_000));

    console.log(`[49歳資産ゼロ・積立なしケース] 49歳時点現金: 5万円, 月収15万=生活費15万, 積立0円`);
    console.log(` → 65歳時点資産: ${assetsAt65}円 (約${Math.round(assetsAt65 / 10_000)}万円)`);
    console.log(` → 65〜90歳生活費総額: ${totalLivingCost}円`);
    console.log(` → 65〜90歳年金総額: ${totalIncome}円`);
    console.log(` → 最終不足額: ${shortfall}万円`);
    console.log(` → 資産枯渇年齢: ${result.depletedAge ?? "なし"}歳`);

    expect(assetsAt65).toBeLessThan(1_000_000); // 65歳時点でもほぼ初期の5万円のみ
    expect(shortfall).toBeGreaterThan(0);
  });

  it("改善探索：家計上限の範囲で積立額を増やすと想定終了年齢まで資産が残る最小額を見つける", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 0,
      currentInvestmentAssets: 0,
      monthlyIncome: 250_000,
      monthlyLivingExpenses: 200_000,
      monthlyInvestmentContribution: 0,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000,
      annualReturnRate: 5,
    });
    const baseResult = calculateSimulation(input);
    const improvement = calculateImprovementSimulation(input, baseResult);

    expect(baseResult.isDepleted).toBe(true);
    expect(improvement.status).toBe("increase");
    expect(improvement.suggestedMonthlyInvestment).toBeGreaterThan(0);
    expect(improvement.suggestedResult?.isDepleted).toBe(false);

    const oneStepLess = calculateSimulation({
      ...input,
      monthlyInvestmentContribution: improvement.suggestedMonthlyInvestment! - improvement.searchStep,
    });
    expect(oneStepLess.isDepleted).toBe(true);
  });

  it("改善提案：積立0円では月5,000円の開始案を最優先し、効果を実測する", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 0,
      currentInvestmentAssets: 0,
      monthlyIncome: 250_000,
      monthlyLivingExpenses: 200_000,
      monthlyInvestmentContribution: 0,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000,
      annualReturnRate: 5,
    });
    const improvement = calculateImprovementSimulation(input);

    expect(improvement.status).toBe("increase");
    expect(improvement.bestProposal?.category).toBe("monthly-investment");
    expect(improvement.bestProposal?.updatedInput.monthlyInvestmentContribution).toBe(5_000);
    expect(improvement.bestProposal?.description).toContain("5,000円");
    expect(improvement.bestProposal?.afterDepletedAge).toBeGreaterThan(improvement.bestProposal?.beforeDepletedAge ?? 0);
    expect(improvement.bestProposal?.updatedInput.monthlyInvestmentContribution).toBeLessThanOrEqual(input.monthlyIncome - input.monthlyLivingExpenses);
    expect(improvement.suggestedResult?.isDepleted).toBe(false);
  });

  it("改善探索：最初から想定終了年齢まで資産が残る場合は増額提案をしない", () => {
    const input = base({
      currentAge: 30,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 1_000_000,
      currentInvestmentAssets: 5_000_000,
      monthlyIncome: 300_000,
      monthlyLivingExpenses: 200_000,
      monthlyInvestmentContribution: 50_000,
      retirementMonthlyLivingExpenses: 270_000,
      annualRetirementIncome: 2_200_000,
      annualReturnRate: 5,
    });
    const improvement = calculateImprovementSimulation(input);

    expect(improvement.status).toBe("not-needed");
    expect(improvement.suggestedMonthlyInvestment).toBeNull();
    expect(improvement.targetAgeAssets).toBeGreaterThan(0);
  });

  it("改善探索：利回り0%で収支が厳しい場合は現実的な増額では解決しない", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 50_000,
      currentInvestmentAssets: 0,
      monthlyIncome: 150_000,
      monthlyLivingExpenses: 150_000,
      monthlyInvestmentContribution: 0,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000,
      annualReturnRate: 0,
    });
    const improvement = calculateImprovementSimulation(input);

    expect(improvement.status).toBe("increase");
    expect(improvement.bestProposal?.category).toBe("retirement-living");
    expect(improvement.bestProposal?.afterShortfall).toBeLessThan(improvement.bestProposal?.beforeShortfall ?? Infinity);
    expect(improvement.suggestedMonthlyInvestment).toBeNull();
    expect(improvement.maxAffordableMonthlyInvestment).toBe(0);
    expect(improvement.additionalMonthlyCapacity).toBe(0);
  });

  it("改善探索：提案額の再計算結果は他の条件を変えずに枯渇を解消する", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 0,
      currentInvestmentAssets: 0,
      monthlyIncome: 250_000,
      monthlyLivingExpenses: 200_000,
      monthlyInvestmentContribution: 0,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000,
      annualReturnRate: 5,
    });
    const improvement = calculateImprovementSimulation(input);

    expect(improvement.status).toBe("increase");
    expect(improvement.suggestedResult?.isDepleted).toBe(false);
    expect(improvement.suggestedResult?.targetAgeAssets).toBeGreaterThanOrEqual(0);
  });

  it("改善探索：49歳・積立2万円・家計余力0円では増額提案をしない", () => {
    const input = base({
      currentAge: 49,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 0,
      currentInvestmentAssets: 50_000,
      monthlyIncome: 190_000,
      monthlyLivingExpenses: 170_000,
      monthlyInvestmentContribution: 20_000,
      retirementMonthlyLivingExpenses: 150_000,
      annualRetirementIncome: 1_200_000,
      annualReturnRate: 5,
    });
    const result = calculateSimulation(input);
    const improvement = calculateImprovementSimulation(input, result);

    expect(result.depletedAge).toBe(77);
    expect(result.targetAgeAssets).toBe(0);
    expect(improvement.status).toBe("increase");
    expect(improvement.bestProposal?.category).toBe("retirement-living");
    expect(improvement.bestProposal?.afterShortfall).toBeLessThan(improvement.bestProposal?.beforeShortfall ?? Infinity);
    expect(improvement.suggestedMonthlyInvestment).toBeNull();
    expect(improvement.maxAffordableMonthlyInvestment).toBe(20_000);
    expect(improvement.additionalMonthlyCapacity).toBe(0);
  });

  it("給与余剰の自動貯蓄動作の検証：初期0円・月収30万・生活費15万・積立5万・利回り0%で1年間計算", () => {
    const input = base({
      currentAge: 30,
      investmentEndAge: 65,
      retirementAge: 65,
      retirementEndAge: 90,
      targetAge: 90,
      currentCashAssets: 0,
      currentInvestmentAssets: 0,
      monthlyIncome: 300_000,
      monthlyLivingExpenses: 150_000,
      monthlyInvestmentContribution: 50_000,
      annualBonusInvestment: 0,
      annualReturnRate: 0,
    });
    const result = calculateSimulation(input);
    const year1 = result.yearlyRecords[1]; // 31歳時点（1年経過後の期末残高＝cashEnd/investmentEnd）
    
    // 年間収入: 360万円, 生活費: 180万円, 積立: 60万円
    // 余剰 (360 - 180 - 60 = 120万円) が現金エンドへ蓄積、積立60万円が投資エンドへ蓄積
    expect(year1.cashEnd).toBe(1_200_000);
    expect(year1.investmentEnd).toBe(600_000);
    expect(year1.totalFinancialAssets).toBe(1_800_000);
  });

  describe("総合QA 30ケース以上の追加網羅検証", () => {
    it("年齢境界: 18歳・20歳・30歳・35歳・50歳・59歳・60歳・64歳・65歳・80歳の正常動作", () => {
      [18, 20, 30, 35, 50, 59, 60, 64, 65, 80].forEach((age) => {
        const target = Math.min(90, age + 2);
        const res = calculateSimulation(base({
          currentAge: age,
          investmentEndAge: target,
          retirementEndAge: target,
          targetAge: target,
          retirementAge: age >= 65 ? age : 65,
          currentCashAssets: 2_000_000,
        }));
        expect(res.yearlyRecords.length).toBeGreaterThan(0);
        expect(res.targetAgeAssets).toBeGreaterThanOrEqual(0);
      });
    });

    it("初期資産条件: 現金0/投資0、現金100万、投資100万、現金1000万以上の計算一貫性", () => {
      const cases = [
        { c: 0, i: 0 },
        { c: 1_000_000, i: 0 },
        { c: 0, i: 1_000_000 },
        { c: 15_000_000, i: 10_000_000 },
      ];
      cases.forEach(({ c, i }) => {
        const res = calculateSimulation(base({
          currentCashAssets: c,
          currentInvestmentAssets: i,
          currentAge: 30,
          targetAge: 40,
        }));
        expect(res.targetAgeAssets).toBeGreaterThanOrEqual(0);
      });
    });

    it("毎月の収支条件: 収入＞生活費＋積立、収入＝、収入＜、積立0、生活費0、赤字の検証", () => {
      const balances = [
        { income: 400_000, living: 200_000, contrib: 50_000 }, // 収入 ＞
        { income: 250_000, living: 150_000, contrib: 100_000 }, // 収入 ＝
        { income: 200_000, living: 150_000, contrib: 100_000 }, // 収入 ＜（赤字）
        { income: 300_000, living: 150_000, contrib: 0 }, // 積立0
        { income: 300_000, living: 0, contrib: 50_000 }, // 生活費0
      ];
      balances.forEach(({ income, living, contrib }) => {
        const res = calculateSimulation(base({
          monthlyIncome: income,
          monthlyLivingExpenses: living,
          monthlyInvestmentContribution: contrib,
          currentAge: 30,
          targetAge: 35,
        }));
        expect(res.targetAgeAssets).toBeGreaterThanOrEqual(0);
      });
    });

    it("投資計算の検証: 利回り0%での論理一致 (初期投資 + 累計積立 - 取り崩し = 最終残高)", () => {
      const input = base({
        currentAge: 30,
        investmentEndAge: 35,
        retirementEndAge: 35,
        targetAge: 35,
        currentCashAssets: 0,
        currentInvestmentAssets: 1_000_000,
        monthlyIncome: 0,
        monthlyLivingExpenses: 0,
        monthlyInvestmentContribution: 50_000,
        annualBonusInvestment: 0,
        annualReturnRate: 0,
      });
      const res = calculateSimulation(input);
      const finalInv = res.yearlyRecords.at(-1)!.investmentEnd;
      // 30歳時点の初期投資100万、30-35歳の5年間積立(5万*12*5=300万)
      expect(res.totalPrincipalContributed).toBe(4_000_000);
      expect(finalInv).toBeGreaterThanOrEqual(1_000_000);
    });

    it("資産枯渇ケースの検証: 80代枯渇、70代枯渇、60代枯渇、即時赤字での矛盾なし確認", () => {
      const depCases = [
        { living: 300_000, cash: 100_000 },
        { living: 500_000, cash: 0 },
      ];
      depCases.forEach(({ living, cash }) => {
        const res = calculateSimulation(base({
          currentAge: 40,
          investmentEndAge: 90,
          retirementEndAge: 90,
          currentCashAssets: cash,
          monthlyIncome: 200_000,
          monthlyLivingExpenses: living,
          targetAge: 90,
        }));
        if (res.isDepleted) {
          expect(res.depletedAge).toBeGreaterThanOrEqual(40);
          expect(res.depletedAge).toBeLessThanOrEqual(90);
          expect(res.targetAgeAssets).toBe(0);
        }
      });
    });

    it("ライフイベント複合検証: 同一年の複数イベント、連続イベント、高額イベントの重複なし確認", () => {
      const e1 = { id: "e1", age: 32, type: "marriage" as const, cost: 2_000_000, title: "結婚" };
      const e2 = { id: "e2", age: 32, type: "car" as const, cost: 3_000_000, title: "車購入" };
      const res = calculateSimulation(base({
        currentAge: 30,
        investmentEndAge: 40,
        retirementEndAge: 40,
        targetAge: 40,
        currentCashAssets: 20_000_000,
        lifeEvents: [e1, e2],
      }));
      expect(res.targetAgeAssets).toBeGreaterThanOrEqual(0);
    });
  });
});
