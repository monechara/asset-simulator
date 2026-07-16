/**
 * 資産形成シミュレーター — 計算ロジック
 * Clarity Dashboard デザイン準拠
 */

export interface SimulatorInput {
  currentAge: number;
  currentAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
  annualBonusInvestment: number;
  annualReturnRate: number; // 1〜10 (%)
  targetAssets: number;
}

export interface YearlyRecord {
  age: number;
  year: number;
  totalAssets: number;
  principal: number;
  investmentGain: number;
}

export interface SimulatorResult {
  yearlyRecords: YearlyRecord[];
  principalTotal: number;
  investmentGainTotal: number;
  finalAssets: number;
  targetAchievedAge: number | null;
  assetAt30: number | null;
  assetAt40: number | null;
  assetAt50: number | null;
}

const MAX_AGE = 80;

export function calculateSimulation(input: SimulatorInput): SimulatorResult {
  const {
    currentAge,
    currentAssets,
    monthlyInvestment,
    annualBonusInvestment,
    annualReturnRate,
    targetAssets,
  } = input;

  const monthlyRate = annualReturnRate / 100 / 12;
  const records: YearlyRecord[] = [];

  let totalAssets = currentAssets;
  let principalAccumulated = currentAssets;
  let targetAchievedAge: number | null = null;

  // 初期時点を記録
  records.push({
    age: currentAge,
    year: 0,
    totalAssets: currentAssets,
    principal: currentAssets,
    investmentGain: 0,
  });

  for (let year = 1; year <= MAX_AGE - currentAge; year++) {
    const age = currentAge + year;

    // 毎月の複利計算 (12ヶ月)
    for (let month = 0; month < 12; month++) {
      totalAssets = totalAssets * (1 + monthlyRate) + monthlyInvestment;
    }
    // ボーナス投資（年1回、年末に追加）
    totalAssets += annualBonusInvestment;
    principalAccumulated += monthlyInvestment * 12 + annualBonusInvestment;

    const investmentGain = Math.max(0, totalAssets - principalAccumulated);

    records.push({
      age,
      year,
      totalAssets: Math.round(totalAssets),
      principal: Math.round(principalAccumulated),
      investmentGain: Math.round(investmentGain),
    });

    // 目標達成チェック
    if (targetAchievedAge === null && targetAssets > 0 && totalAssets >= targetAssets) {
      targetAchievedAge = age;
    }
  }

  const lastRecord = records[records.length - 1];

  const getAssetAtAge = (age: number): number | null => {
    if (age < currentAge) return null;
    const record = records.find((r) => r.age === age);
    return record ? record.totalAssets : null;
  };

  return {
    yearlyRecords: records,
    principalTotal: lastRecord.principal,
    investmentGainTotal: lastRecord.investmentGain,
    finalAssets: lastRecord.totalAssets,
    targetAchievedAge,
    assetAt30: getAssetAtAge(30),
    assetAt40: getAssetAtAge(40),
    assetAt50: getAssetAtAge(50),
  };
}

/**
 * 金額を日本円表記にフォーマット
 */
export function formatCurrency(amount: number): string {
  if (amount >= 100_000_000) {
    const oku = amount / 100_000_000;
    if (oku >= 10) return `${Math.round(oku).toLocaleString()}億円`;
    return `${oku.toFixed(1)}億円`;
  }
  if (amount >= 10_000) {
    const man = amount / 10_000;
    if (man >= 1000) return `${Math.round(man).toLocaleString()}万円`;
    return `${man.toFixed(0)}万円`;
  }
  return `${Math.round(amount).toLocaleString()}円`;
}

/**
 * 万円単位でフォーマット（グラフ用）
 */
export function formatMan(amount: number): string {
  return `${Math.round(amount / 10000).toLocaleString()}万`;
}

/**
 * 入力値のデフォルト
 */
export const DEFAULT_INPUT: SimulatorInput = {
  currentAge: 30,
  currentAssets: 1_000_000,
  monthlyIncome: 300_000,
  monthlyExpenses: 200_000,
  monthlyInvestment: 30_000,
  annualBonusInvestment: 100_000,
  annualReturnRate: 5,
  targetAssets: 30_000_000,
};
