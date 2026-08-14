/**
 * 人生全体マネープランシミュレーターの計算エンジン
 *
 * 会計ルール:
 * - 総金融資産 = 現金資産 + 投資資産
 * - 積立投資は現金から投資資産への振替であり、二重加算しない
 * - 投資資産のみ月次複利で運用する
 * - ライフイベント・ローン返済は現金から支出する
 * - 現金不足は投資資産から補填し、それでも不足した年を枯渇年とする
 */

export type LifeEventType =
  | "marriage"
  | "housing"
  | "childbirth"
  | "education"
  | "retirement"
  | "other";

export interface HousingLoan {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  annualInterestRate: number;
  repaymentYears: number;
  annualRepayment?: number;
  loanStartAge: number;
  loanEndAge: number;
}

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  title: string;
  age: number;
  cost: number;
  durationYears?: number;
  annualCost?: number;
  housingLoan?: HousingLoan;
}

export interface SimulatorInput {
  currentAge: number;
  targetAge: number;
  currentCashAssets: number;
  currentInvestmentAssets: number;
  monthlyIncome: number;
  monthlyLivingExpenses: number;
  monthlyInvestmentContribution: number;
  annualReturnRate: number;
  retirementAge: number;
  annualRetirementIncome: number;
  retirementLivingExpenseRatio: number;
  targetAssets: number;
  lifeEvents: LifeEvent[];
}

export interface YearlyRecord {
  age: number;
  year: number;
  cashStart: number;
  investmentStart: number;
  annualIncome: number;
  annualLivingExpenses: number;
  annualInvestmentContribution: number;
  investmentGain: number;
  eventCost: number;
  loanRepayment: number;
  cashFlowBeforeWithdrawal: number;
  investmentWithdrawal: number;
  cashEnd: number;
  investmentEnd: number;
  totalFinancialAssets: number;
  // MVPでは未使用。将来は不動産価値とローン残高から純資産を算出する。
  propertyValue?: number;
  mortgageBalance?: number;
  netWorth?: number;
  activeEvents: string[];
  isDepleted: boolean;
  depletionMonth: number | null;

  // 既存チャートとの互換用の別名。新規コードでは金融資産系の名称を優先する。
  totalAssets: number;
  principal: number;
}

export interface SimulatorResult {
  yearlyRecords: YearlyRecord[];
  finalFinancialAssets: number;
  targetAgeAssets: number;
  peakFinancialAssets: number;
  peakAge: number;
  isDepleted: boolean;
  depletedAge: number | null;
  depletedMonth: number | null;
  totalPrincipalContributed: number;
  totalInvestmentGain: number;
  targetAchievedAge: number | null;

  // 既存共有カードとの互換用
  finalAssets: number;
  principalTotal: number;
  investmentGainTotal: number;
}

export interface ComparisonResult {
  monthlyInvestment: number;
  finalAssets: number;
  difference: number;
}

export interface StartAgeComparison {
  startAge: number;
  finalAssets: number;
  difference: number;
}

export interface EventComparisonResult {
  eventTitle: string;
  finalAssetsWithEvent: number;
  finalAssetsWithoutEvent: number;
  difference: number;
}

const MIN_AGE = 18;
const MAX_AGE = 100;
const MONTHS_PER_YEAR = 12;

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label}は数値で入力してください`);
  }
}

function normalizeNonNegative(value: number): number {
  return Math.max(0, Math.round(value));
}

export function validateSimulatorInput(input: SimulatorInput): void {
  const fields: Array<[number, string]> = [
    [input.currentAge, "現在の年齢"],
    [input.targetAge, "計画終了年齢"],
    [input.currentCashAssets, "現在の現金資産"],
    [input.currentInvestmentAssets, "現在の投資資産"],
    [input.monthlyIncome, "手取り月収"],
    [input.monthlyLivingExpenses, "毎月の生活費"],
    [input.monthlyInvestmentContribution, "毎月の積立投資額"],
    [input.annualReturnRate, "想定運用利回り"],
    [input.retirementAge, "老後開始年齢"],
    [input.annualRetirementIncome, "老後の年間収入"],
    [input.retirementLivingExpenseRatio, "老後生活費比率"],
    [input.targetAssets, "目標金融資産"],
  ];

  fields.forEach(([value, label]) => assertFiniteNumber(value, label));

  if (input.currentAge < MIN_AGE || input.currentAge > 80) {
    throw new Error("現在の年齢は18〜80歳の範囲で入力してください");
  }
  if (input.targetAge <= input.currentAge || input.targetAge > MAX_AGE) {
    throw new Error("計画終了年齢は現在の年齢より大きく、100歳以下で入力してください");
  }
  if (input.currentCashAssets < 0 || input.currentInvestmentAssets < 0) {
    throw new Error("現在の資産は0以上で入力してください");
  }
  if (input.monthlyIncome < 0 || input.monthlyLivingExpenses < 0 || input.monthlyInvestmentContribution < 0) {
    throw new Error("収入・生活費・積立額は0以上で入力してください");
  }
  if (input.annualReturnRate < 0 || input.annualReturnRate > 20) {
    throw new Error("想定運用利回りは0〜20%の範囲で入力してください");
  }
  if (input.retirementAge < input.currentAge || input.retirementAge > MAX_AGE) {
    throw new Error("老後開始年齢は現在の年齢以上、100歳以下で入力してください");
  }
  if (input.annualRetirementIncome < 0) {
    throw new Error("老後の年間収入は0以上で入力してください");
  }
  if (input.retirementLivingExpenseRatio < 0 || input.retirementLivingExpenseRatio > 2) {
    throw new Error("老後生活費比率は0〜200%の範囲で入力してください");
  }

  input.lifeEvents.forEach((event) => {
    if (!event.id || !event.title) throw new Error("ライフイベントの名称が不正です");
    if (event.age < input.currentAge || event.age > input.targetAge) {
      throw new Error(`${event.title}の年齢は計画期間内で入力してください`);
    }
    if (event.cost < 0 || (event.annualCost ?? 0) < 0) {
      throw new Error(`${event.title}の費用は0以上で入力してください`);
    }
    if (event.type === "housing" && event.housingLoan) {
      const loan = event.housingLoan;
      if (loan.downPayment < 0 || loan.loanAmount < 0 || loan.repaymentYears < 0) {
        throw new Error("住宅ローンの入力値は0以上で入力してください");
      }
      if (loan.loanEndAge < loan.loanStartAge) {
        throw new Error("住宅ローン完済年齢が不正です");
      }
    }
  });
}

function calculateAnnualRepayment(loan: HousingLoan): number {
  if (loan.annualRepayment !== undefined && loan.annualRepayment >= 0) {
    return loan.annualRepayment;
  }
  if (loan.loanAmount <= 0 || loan.repaymentYears <= 0) return 0;

  const monthlyRate = loan.annualInterestRate / 100 / MONTHS_PER_YEAR;
  const months = loan.repaymentYears * MONTHS_PER_YEAR;
  if (monthlyRate === 0) return loan.loanAmount / loan.repaymentYears;

  const monthlyPayment =
    loan.loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return monthlyPayment * MONTHS_PER_YEAR;
}

function getEventCostForAge(events: LifeEvent[], age: number): number {
  return events.reduce((total, event) => {
    if (event.type === "housing") return total + (age === event.age ? event.cost : 0);

    const duration = Math.max(1, event.durationYears ?? 1);
    const isActive = age >= event.age && age < event.age + duration;
    if (!isActive) return total;

    return total + (duration > 1 ? event.annualCost ?? event.cost / duration : event.cost);
  }, 0);
}

function getLoanRepaymentForAge(events: LifeEvent[], age: number): number {
  return events.reduce((total, event) => {
    if (event.type !== "housing" || !event.housingLoan) return total;
    const loan = event.housingLoan;
    const isRepaying = age > loan.loanStartAge && age <= loan.loanEndAge;
    return total + (isRepaying ? calculateAnnualRepayment(loan) : 0);
  }, 0);
}

function getActiveEventTitles(events: LifeEvent[], age: number): string[] {
  return events
    .filter((event) => {
      const duration = Math.max(1, event.durationYears ?? 1);
      return age >= event.age && age < event.age + duration;
    })
    .map((event) => event.title);
}

function calculateInvestmentYear(
  investmentStart: number,
  monthlyContribution: number,
  annualReturnRate: number,
): { balance: number; gain: number } {
  const monthlyRate = annualReturnRate / 100 / MONTHS_PER_YEAR;
  let balance = investmentStart;

  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    balance *= 1 + monthlyRate;
    balance += monthlyContribution;
  }

  const gain = balance - investmentStart - monthlyContribution * MONTHS_PER_YEAR;
  return { balance, gain: Math.max(0, gain) };
}

function calculateDepletionMonth(
  input: SimulatorInput,
  age: number,
  cashStart: number,
  investmentStart: number,
  monthlyIncome: number,
  monthlyLivingExpenses: number,
  monthlyContribution: number,
  eventCost: number,
  loanRepayment: number,
): number | null {
  let cash = cashStart;
  let investment = investmentStart;
  const monthlyRate = input.annualReturnRate / 100 / MONTHS_PER_YEAR;

  for (let month = 1; month <= MONTHS_PER_YEAR; month += 1) {
    investment *= 1 + monthlyRate;
    investment += monthlyContribution;
    cash += monthlyIncome - monthlyLivingExpenses - monthlyContribution;
    if (month === 1) cash -= eventCost;
    cash -= loanRepayment / MONTHS_PER_YEAR;

    if (cash < 0) {
      const required = -cash;
      const withdrawal = Math.min(required, investment);
      cash += withdrawal;
      investment -= withdrawal;
    }

    if (cash + investment < 0.0001) {
      return month;
    }
  }

  return null;
}

export function calculateSimulation(input: SimulatorInput): SimulatorResult {
  validateSimulatorInput(input);

  let cashAssets = normalizeNonNegative(input.currentCashAssets);
  let investmentAssets = normalizeNonNegative(input.currentInvestmentAssets);
  const records: YearlyRecord[] = [];
  let depletedAge: number | null = null;
  let depletedMonth: number | null = null;
  let targetAchievedAge: number | null = null;
  let totalPrincipalContributed = investmentAssets;
  let totalInvestmentGain = 0;

  // 現在年齢にイベントが設定された場合は、初期残高から一度だけ控除する。
  const initialEventCost = getEventCostForAge(input.lifeEvents, input.currentAge);
  const initialCashAfterEvent = cashAssets - initialEventCost;
  const initialWithdrawal = Math.min(Math.max(0, -initialCashAfterEvent), investmentAssets);
  cashAssets = Math.max(0, initialCashAfterEvent);
  investmentAssets = Math.max(0, investmentAssets - initialWithdrawal);
  const initialDepleted = initialCashAfterEvent + investmentAssets < 0;
  if (initialDepleted) {
    depletedAge = input.currentAge;
    depletedMonth = 1;
  }
  let peakFinancialAssets = cashAssets + investmentAssets;
  let peakAge = input.currentAge;

  records.push({
    age: input.currentAge,
    year: 0,
    cashStart: input.currentCashAssets,
    investmentStart: input.currentInvestmentAssets,
    annualIncome: 0,
    annualLivingExpenses: 0,
    annualInvestmentContribution: 0,
    investmentGain: 0,
    eventCost: Math.round(initialEventCost),
    loanRepayment: 0,
    cashFlowBeforeWithdrawal: Math.round(initialCashAfterEvent),
    investmentWithdrawal: Math.round(initialWithdrawal),
    cashEnd: Math.round(cashAssets),
    investmentEnd: Math.round(investmentAssets),
    totalFinancialAssets: Math.round(cashAssets + investmentAssets),
    activeEvents: getActiveEventTitles(input.lifeEvents, input.currentAge),
    isDepleted: initialDepleted,
    depletionMonth: initialDepleted ? 1 : null,
    totalAssets: Math.round(cashAssets + investmentAssets),
    principal: Math.round(investmentAssets),
  });

  for (let year = 1; year <= input.targetAge - input.currentAge; year += 1) {
    const age = input.currentAge + year;
    const isRetired = age >= input.retirementAge;
    const monthlyIncome = isRetired ? input.annualRetirementIncome / MONTHS_PER_YEAR : input.monthlyIncome;
    const monthlyLivingExpenses =
      input.monthlyLivingExpenses * (isRetired ? input.retirementLivingExpenseRatio : 1);
    const monthlyContribution = isRetired ? 0 : input.monthlyInvestmentContribution;
    const annualIncome = monthlyIncome * MONTHS_PER_YEAR;
    const annualLivingExpenses = monthlyLivingExpenses * MONTHS_PER_YEAR;
    const annualInvestmentContribution = monthlyContribution * MONTHS_PER_YEAR;
    const eventCost = getEventCostForAge(input.lifeEvents, age);
    const loanRepayment = getLoanRepaymentForAge(input.lifeEvents, age);
    const cashStart = cashAssets;
    const investmentStart = investmentAssets;

    const investmentYear = calculateInvestmentYear(
      investmentStart,
      monthlyContribution,
      input.annualReturnRate,
    );
    const cashFlowBeforeWithdrawal =
      cashStart + annualIncome - annualLivingExpenses - annualInvestmentContribution - eventCost - loanRepayment;
    const shortfall = Math.max(0, -cashFlowBeforeWithdrawal);
    const investmentWithdrawal = Math.min(shortfall, investmentYear.balance);
    const cashEnd = Math.max(0, cashFlowBeforeWithdrawal);
    const investmentEnd = Math.max(0, investmentYear.balance - investmentWithdrawal);
    const totalBeforeClamp = cashFlowBeforeWithdrawal + investmentYear.balance;
    const yearIsDepleted = totalBeforeClamp < 0;

    if (yearIsDepleted && depletedAge === null) {
      depletedAge = age;
      depletedMonth = calculateDepletionMonth(
        input,
        age,
        cashStart,
        investmentStart,
        monthlyIncome,
        monthlyLivingExpenses,
        monthlyContribution,
        eventCost,
        loanRepayment,
      );
    }

    cashAssets = cashEnd;
    investmentAssets = investmentEnd;
    totalPrincipalContributed += annualInvestmentContribution;
    totalInvestmentGain += investmentYear.gain;

    const totalFinancialAssets = Math.round(cashAssets + investmentAssets);
    if (totalFinancialAssets > peakFinancialAssets) {
      peakFinancialAssets = totalFinancialAssets;
      peakAge = age;
    }
    if (targetAchievedAge === null && input.targetAssets > 0 && totalFinancialAssets >= input.targetAssets) {
      targetAchievedAge = age;
    }

    records.push({
      age,
      year,
      cashStart: Math.round(cashStart),
      investmentStart: Math.round(investmentStart),
      annualIncome: Math.round(annualIncome),
      annualLivingExpenses: Math.round(annualLivingExpenses),
      annualInvestmentContribution: Math.round(annualInvestmentContribution),
      investmentGain: Math.round(investmentYear.gain),
      eventCost: Math.round(eventCost),
      loanRepayment: Math.round(loanRepayment),
      cashFlowBeforeWithdrawal: Math.round(cashFlowBeforeWithdrawal),
      investmentWithdrawal: Math.round(investmentWithdrawal),
      cashEnd: Math.round(cashAssets),
      investmentEnd: Math.round(investmentAssets),
      totalFinancialAssets,
      activeEvents: getActiveEventTitles(input.lifeEvents, age),
      isDepleted: yearIsDepleted,
      depletionMonth: yearIsDepleted ? depletedMonth : null,
      totalAssets: totalFinancialAssets,
      principal: Math.round(cashAssets + investmentAssets - totalInvestmentGain),
    });
  }

  const finalRecord = records[records.length - 1];
  const targetRecord = records.find((record) => record.age === input.targetAge) ?? finalRecord;

  return {
    yearlyRecords: records,
    finalFinancialAssets: finalRecord.totalFinancialAssets,
    targetAgeAssets: targetRecord.totalFinancialAssets,
    peakFinancialAssets: Math.round(peakFinancialAssets),
    peakAge,
    isDepleted: depletedAge !== null,
    depletedAge,
    depletedMonth,
    totalPrincipalContributed: Math.round(totalPrincipalContributed),
    totalInvestmentGain: Math.round(totalInvestmentGain),
    targetAchievedAge,
    finalAssets: finalRecord.totalFinancialAssets,
    principalTotal: Math.round(totalPrincipalContributed),
    investmentGainTotal: Math.round(totalInvestmentGain),
  };
}

export function calculateMonthlyComparison(
  input: SimulatorInput,
  increments: number[],
): ComparisonResult[] {
  const baseResult = calculateSimulation(input);
  return increments.map((increment) => {
    const monthlyInvestment = Math.max(0, input.monthlyInvestmentContribution + increment);
    const result = calculateSimulation({ ...input, monthlyInvestmentContribution: monthlyInvestment });
    return {
      monthlyInvestment,
      finalAssets: result.targetAgeAssets,
      difference: result.targetAgeAssets - baseResult.targetAgeAssets,
    };
  });
}

export function calculateStartAgeComparison(
  input: SimulatorInput,
  startAges: number[],
): StartAgeComparison[] {
  const baseResult = calculateSimulation(input);
  return startAges.map((startAge) => {
    if (startAge >= input.targetAge) {
      return { startAge, finalAssets: input.currentCashAssets + input.currentInvestmentAssets, difference: 0 };
    }
    const yearsEarlier = Math.max(0, input.currentAge - startAge);
    const result = calculateSimulation({
      ...input,
      currentAge: startAge,
      targetAge: input.targetAge,
      currentCashAssets: 0,
      currentInvestmentAssets: 0,
      lifeEvents: input.lifeEvents.filter((event) => event.age >= startAge),
    });
    return {
      startAge,
      finalAssets: result.targetAgeAssets,
      difference: result.targetAgeAssets - baseResult.targetAgeAssets,
    };
  });
}

export function calculateEventComparison(
  input: SimulatorInput,
  event: LifeEvent,
): EventComparisonResult {
  const withEvent = calculateSimulation({ ...input, lifeEvents: [...input.lifeEvents, event] });
  const withoutEvent = calculateSimulation({
    ...input,
    lifeEvents: input.lifeEvents.filter((item) => item.id !== event.id),
  });
  return {
    eventTitle: event.title,
    finalAssetsWithEvent: withEvent.targetAgeAssets,
    finalAssetsWithoutEvent: withoutEvent.targetAgeAssets,
    difference: withEvent.targetAgeAssets - withoutEvent.targetAgeAssets,
  };
}

export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const sign = safeAmount < 0 ? "−" : "";
  const absolute = Math.abs(safeAmount);
  if (absolute >= 100_000_000) {
    const oku = absolute / 100_000_000;
    return `${sign}${oku >= 10 ? Math.round(oku).toLocaleString() : oku.toFixed(1)}億円`;
  }
  if (absolute >= 10_000) {
    return `${sign}${Math.round(absolute / 10_000).toLocaleString()}万円`;
  }
  return `${sign}${Math.round(absolute).toLocaleString()}円`;
}

export function formatMan(amount: number): string {
  return `${Math.round(amount / 10_000).toLocaleString()}万`;
}

export const DEFAULT_LIFE_EVENTS: LifeEvent[] = [];

export const DEFAULT_INPUT: SimulatorInput = {
  currentAge: 30,
  targetAge: 65,
  currentCashAssets: 1_000_000,
  currentInvestmentAssets: 0,
  monthlyIncome: 300_000,
  monthlyLivingExpenses: 200_000,
  monthlyInvestmentContribution: 50_000,
  annualReturnRate: 5,
  retirementAge: 65,
  annualRetirementIncome: 1_800_000,
  retirementLivingExpenseRatio: 0.75,
  targetAssets: 30_000_000,
  lifeEvents: DEFAULT_LIFE_EVENTS,
};

export const createHousingEvent = (params: {
  id?: string;
  age: number;
  propertyPrice: number;
  downPayment: number;
  annualInterestRate: number;
  repaymentYears: number;
}): LifeEvent => {
  const loanAmount = Math.max(0, params.propertyPrice - params.downPayment);
  return {
    id: params.id ?? `housing-${params.age}`,
    type: "housing",
    title: "住宅購入",
    age: params.age,
    cost: params.downPayment,
    housingLoan: {
      propertyPrice: params.propertyPrice,
      downPayment: params.downPayment,
      loanAmount,
      annualInterestRate: params.annualInterestRate,
      repaymentYears: params.repaymentYears,
      loanStartAge: params.age,
      loanEndAge: params.age + params.repaymentYears,
    },
  };
};

export const createEvent = (params: {
  id?: string;
  type: LifeEventType;
  title: string;
  age: number;
  cost: number;
  durationYears?: number;
  annualCost?: number;
}): LifeEvent => ({
  id: params.id ?? `${params.type}-${params.age}`,
  type: params.type,
  title: params.title,
  age: params.age,
  cost: params.cost,
  durationYears: params.durationYears,
  annualCost: params.annualCost,
});
