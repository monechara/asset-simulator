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
  /** 積立終了年齢（何歳まで積み立てるか） */
  investmentEndAge: number;
  /** 老後資金を何歳まで想定するか */
  retirementEndAge: number;
  currentCashAssets: number;
  currentInvestmentAssets: number;
  monthlyIncome: number;
  monthlyLivingExpenses: number;
  monthlyInvestmentContribution: number;
  /** 年間合計。勤務中の年末に投資資産へ振り替える。 */
  annualBonusInvestment: number;
  annualReturnRate: number;
  retirementAge: number;
  annualRetirementIncome: number;
  /** 老後の毎月生活費。未指定時は従来の比率モデルへフォールバックする。 */
  retirementMonthlyLivingExpenses?: number;
  /** 既存互換用。新UIでは金額指定を優先する。 */
  retirementLivingExpenseRatio: number;
  targetAssets: number;
  householdSize: 1 | 2;
  lifeEvents: LifeEvent[];
  /** 既存互換用（targetAgeは retirementEndAge と同期） */
  targetAge: number;
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

export type ImprovementSimulationStatus = "increase" | "not-needed" | "no-capacity" | "not-found";

export type ImprovementCategory = "monthly-investment" | "bonus-investment" | "investment-end-age" | "retirement-living" | "retirement-age";

export interface ImprovementProposal {
  category: ImprovementCategory;
  title: string;
  description: string;
  changedParamLabel: string;
  beforeValueFormatted: string;
  afterValueFormatted: string;
  beforeTargetAgeAssets: number;
  beforeDepletedAge: number | null;
  afterDepletedAge: number | null;
  beforeShortfall: number;
  afterShortfall: number;
  score: number; // 改善の大きさ・現実性のスコア
  updatedInput: SimulatorInput;
  updatedResult: SimulatorResult;
}

export interface ImprovementSimulationResult {
  status: ImprovementSimulationStatus;
  currentMonthlyInvestment: number;
  suggestedMonthlyInvestment: number | null;
  additionalMonthlyInvestment: number | null;
  targetAgeAssets: number;
  suggestedResult: SimulatorResult | null;
  searchStep: number;
  maxAdditionalMonthlyInvestment: number;
  maxAffordableMonthlyInvestment: number;
  additionalMonthlyCapacity: number;
  bestProposal: ImprovementProposal | null;
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
  // 互換性のための同期
  if (input.investmentEndAge === undefined) {
    input.investmentEndAge = input.retirementAge ?? Math.min(100, input.currentAge + 35);
  }
  if (input.retirementEndAge === undefined) {
    input.retirementEndAge = input.targetAge ?? 90;
  }
  if (input.targetAge === undefined) {
    input.targetAge = input.retirementEndAge;
  }

  const fields: Array<[number, string]> = [
    [input.currentAge, "現在の年齢"],
    [input.investmentEndAge, "積立終了年齢"],
    [input.retirementEndAge, "老後想定終了年齢"],
    [input.currentCashAssets, "現在の現金資産"],
    [input.currentInvestmentAssets, "現在の投資資産"],
    [input.monthlyIncome, "手取り月収"],
    [input.monthlyLivingExpenses, "毎月の生活費"],
    [input.monthlyInvestmentContribution, "毎月の積立投資額"],
    [input.annualBonusInvestment, "年間ボーナス投資額"],
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
  if (input.investmentEndAge <= input.currentAge || input.investmentEndAge > MAX_AGE) {
    throw new Error("積立終了年齢は現在の年齢より大きく、100歳以下で入力してください");
  }
  if (input.retirementEndAge <= input.currentAge || input.retirementEndAge > MAX_AGE) {
    throw new Error("老後想定終了年齢は現在の年齢より大きく、100歳以下で入力してください");
  }
  if (input.currentCashAssets < 0 || input.currentInvestmentAssets < 0) {
    throw new Error("現在の資産は0以上で入力してください");
  }
  if (input.monthlyIncome < 0 || input.monthlyLivingExpenses < 0 || input.monthlyInvestmentContribution < 0 || input.annualBonusInvestment < 0) {
    throw new Error("収入・生活費・積立額・ボーナス投資額は0以上で入力してください");
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
  if (input.retirementMonthlyLivingExpenses !== undefined) {
    assertFiniteNumber(input.retirementMonthlyLivingExpenses, "老後の毎月生活費");
    if (input.retirementMonthlyLivingExpenses < 0) {
      throw new Error("老後の毎月生活費は0以上で入力してください");
    }
  }
  if (input.retirementLivingExpenseRatio < 0 || input.retirementLivingExpenseRatio > 2) {
    throw new Error("老後生活費比率は0〜200%の範囲で入力してください");
  }
  if (input.householdSize !== undefined && input.householdSize !== 1 && input.householdSize !== 2) {
    throw new Error("世帯人数は1人または2人で選択してください");
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
  annualBonusInvestment: number,
  annualReturnRate: number,
): { balance: number; gain: number } {
  const monthlyRate = annualReturnRate / 100 / MONTHS_PER_YEAR;
  let balance = investmentStart;

  for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
    balance *= 1 + monthlyRate;
    balance += monthlyContribution;
  }

  // ボーナス投資は年末に振り替えるため、同年の運用益には含めない。
  balance += annualBonusInvestment;
  const gain = balance - investmentStart - monthlyContribution * MONTHS_PER_YEAR - annualBonusInvestment;
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
  annualBonusInvestment: number,
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
    if (month === MONTHS_PER_YEAR) {
      // ボーナス投資は給与・現金資産とは別の年間ボーナスから年末に投資する。
      investment += annualBonusInvestment;
    }
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

  // 90歳到達時点（retirementEndAge）で終了するため、処理対象は age <= retirementEndAge とする
  // ただし、age は当年度の「期末（到達時点）」を表すため、現役期間は investmentEndAge 到達前（< investmentEndAge）までとする
  for (let year = 1; ; year += 1) {
    const age = input.currentAge + year;
    if (age > input.retirementEndAge) break;
    // age は「その年の年末（到達年齢）」を表す
    // 例: 35歳開始で year=1 の age=36 は、35歳〜36歳の1年間（36歳到達時点）の処理
    // 現役期間は 35歳〜65歳到達直前（age <= input.retirementAge すなわち age 36〜65）
    // 退職（老後）期間は 65歳到達後（age > input.retirementAge すなわち age 66〜90）
    // 積立期間は investmentEndAge 到達前（age <= input.investmentEndAge すなわち age 36〜65）
    const isRetired = age >= input.retirementAge;
    const isInvesting = age <= input.investmentEndAge;
    const monthlyIncome = isRetired ? input.annualRetirementIncome / MONTHS_PER_YEAR : input.monthlyIncome;
    const retirementMonthlyLivingExpenses = input.retirementMonthlyLivingExpenses ?? input.monthlyLivingExpenses * input.retirementLivingExpenseRatio;
    const monthlyLivingExpenses = isRetired ? retirementMonthlyLivingExpenses : input.monthlyLivingExpenses;
    const monthlyContribution = isInvesting ? input.monthlyInvestmentContribution : 0;
    const annualBonusInvestment = isInvesting ? input.annualBonusInvestment : 0;
    const annualIncome = monthlyIncome * MONTHS_PER_YEAR;
    const annualLivingExpenses = monthlyLivingExpenses * MONTHS_PER_YEAR;
    const annualMonthlyInvestmentContribution = monthlyContribution * MONTHS_PER_YEAR;
    const annualInvestmentContribution = annualMonthlyInvestmentContribution + annualBonusInvestment;
    const eventCost = getEventCostForAge(input.lifeEvents, age);
    const loanRepayment = getLoanRepaymentForAge(input.lifeEvents, age);
    const cashStart = cashAssets;
    const investmentStart = investmentAssets;

    const investmentYear = calculateInvestmentYear(
      investmentStart,
      monthlyContribution,
      annualBonusInvestment,
      input.annualReturnRate,
    );
    // 月次積立は給与からの現金→投資振替。ボーナス投資は外部ボーナスからの拠出なので現金を二重控除しない。
    const cashFlowBeforeWithdrawal =
      cashStart + annualIncome - annualLivingExpenses - annualMonthlyInvestmentContribution - eventCost - loanRepayment;
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
        annualBonusInvestment,
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
  const targetRecord = records.find((record) => record.age === input.retirementEndAge) ?? finalRecord;

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

/**
 * 現在の条件で枯渇する場合に、他の条件を固定したまま、
 * 想定終了年齢まで枯渇しない最小の毎月積立額を探索する。
 * 既存の calculateSimulation を呼び出すだけの独立した比較計算であり、
 * 基本の計算ロジック自体は変更しない。
 */
export function calculateImprovementSimulation(
  input: SimulatorInput,
  currentResult?: SimulatorResult,
): ImprovementSimulationResult {
  const searchStep = 1_000;
  const baseResult = currentResult ?? calculateSimulation(input);
  const currentMonthlyInvestment = input.monthlyInvestmentContribution;
  const baseDepletedAge = baseResult.depletedAge;
  // 現役期間の給与から捻出できる毎月積立額の上限。
  // 積立額を増やした結果、現金不足を投資資産から補填する循環を改善探索へ持ち込まない。
  const maxAffordableMonthlyInvestment = Math.max(0, Math.round(input.monthlyIncome - input.monthlyLivingExpenses));
  const additionalMonthlyCapacity = Math.max(0, maxAffordableMonthlyInvestment - currentMonthlyInvestment);

  const baseFields = {
    currentMonthlyInvestment,
    targetAgeAssets: baseResult.targetAgeAssets,
    searchStep,
    maxAdditionalMonthlyInvestment: additionalMonthlyCapacity,
    maxAffordableMonthlyInvestment,
    additionalMonthlyCapacity,
  };

  if (!baseResult.isDepleted) {
    // 資産が枯渇しない場合でも、現金・投資資産の状況から「ひとつ足すなら」の余裕資金投資配分提案を検討する。
    // ① 投資資産が0円の場合、または ② 現金は十分あるが投資割合が低い場合
    const totalCurrentAssets = input.currentCashAssets + input.currentInvestmentAssets;
    const investmentRatio = totalCurrentAssets > 0 ? input.currentInvestmentAssets / totalCurrentAssets : 0;
    
    // 生活防衛資金（生活費の3〜6ヶ月分、または最低100万円）と近いライフイベント支出の合算を保護する
    const emergencyFund = Math.max(1_000_000, input.monthlyLivingExpenses * 6);
    const nearEventCost = input.lifeEvents
      .filter((ev) => ev.age >= input.currentAge && ev.age <= input.currentAge + 3)
      .reduce((sum, ev) => sum + ev.cost, 0);
    const protectedCash = emergencyFund + nearEventCost;
    const surplusCash = input.currentCashAssets - protectedCash;

    // 投資額が0円、または（現金余剰が十分あり、かつ投資割合が20%未満）の場合にソフトな提案を生成する
    if (input.currentInvestmentAssets === 0 || (surplusCash >= 1_000_000 && investmentRatio < 0.20)) {
      const suggestedMonthly = input.currentInvestmentAssets === 0 ? 10_000 : Math.min(maxAffordableMonthlyInvestment, 30_000);
      const updatedInput: SimulatorInput = {
        ...input,
        monthlyInvestmentContribution: Math.max(input.monthlyInvestmentContribution, suggestedMonthly),
      };
      const res = calculateSimulation(updatedInput);
      const isZeroInvest = input.currentInvestmentAssets === 0;

      const proposal: ImprovementProposal = {
        category: "monthly-investment",
        title: isZeroInvest ? "まずは少額から投資を始める" : "余裕資金の一部を投資に回す",
        description: isZeroInvest
          ? "現金に余裕があるなら、まずは少額から投資を始めるのも選択肢です。長期ではインフレによる現金の実質的な目減りへの備えにもなります。"
          : "現金はしっかり確保できています。すぐに使う予定のない余裕資金があるなら、一部を投資に回すことでインフレへの備えもできます。",
        changedParamLabel: "投資への取り組み",
        beforeValueFormatted: isZeroInvest ? "投資0円" : `投資割合 ${(investmentRatio * 100).toFixed(0)}%`,
        afterValueFormatted: "余裕資金の投資活用",
        beforeTargetAgeAssets: baseResult.targetAgeAssets,
        beforeDepletedAge: baseDepletedAge,
        afterDepletedAge: res.depletedAge,
        beforeShortfall: 0,
        afterShortfall: 0,
        score: 100,
        updatedInput,
        updatedResult: res,
      };

      return {
        status: "increase",
        suggestedMonthlyInvestment: suggestedMonthly,
        additionalMonthlyInvestment: suggestedMonthly - currentMonthlyInvestment,
        suggestedResult: res,
        bestProposal: proposal,
        ...baseFields,
      };
    }

    return {
      status: "not-needed",
      suggestedMonthlyInvestment: null,
      additionalMonthlyInvestment: null,
      suggestedResult: baseResult,
      bestProposal: null,
      ...baseFields,
    };
  }

  // 想定終了年齢まで枯渇しないために必要な積立額も別途探索する。
  // これは既存の「完全解消額」情報として保持し、表示用の最小改善案とは分けて扱う。
  let suggestedMonthlyInvestment: number | null = null;
  let additionalMonthlyInvestment: number | null = null;
  let suggestedResult: SimulatorResult | null = null;
  if (additionalMonthlyCapacity >= searchStep) {
    for (let additional = searchStep; additional <= additionalMonthlyCapacity; additional += searchStep) {
      const candidateMonthlyInvestment = currentMonthlyInvestment + additional;
      const candidateResult = calculateSimulation({
        ...input,
        monthlyInvestmentContribution: candidateMonthlyInvestment,
      });

      if (!candidateResult.isDepleted) {
        suggestedMonthlyInvestment = candidateMonthlyInvestment;
        additionalMonthlyInvestment = additional;
        suggestedResult = candidateResult;
        break;
      }
    }
  }

  const proposals: ImprovementProposal[] = [];

  // 補助関数：老後不足額（万円）の計算
  const calcShortfall = (inp: SimulatorInput, res: SimulatorResult): number => {
    const living = Math.round((inp.retirementMonthlyLivingExpenses ?? inp.monthlyLivingExpenses * inp.retirementLivingExpenseRatio) / 10_000);
    const income = Math.round(inp.annualRetirementIncome / 12 / 10_000);
    const years = Math.max(0, inp.retirementEndAge - inp.retirementAge);
    const totalLiving = living * 12 * years;
    const totalIncome = income * 12 * years;
    const netNeed = Math.max(0, totalLiving - totalIncome);
    return Math.max(0, netNeed - Math.round(res.targetAgeAssets / 10_000));
  };

  const baseShortfall = calcShortfall(input, baseResult);

  // 候補1：毎月積立を始める／増額する。
  // まず5,000円、次に1万円、その後は5,000円刻みで実測する。
  // 上限は「手取り−現役生活費」であり、家計余力を超える候補は作らない。
  if (additionalMonthlyCapacity > 0) {
    const formatMonthlyContribution = (amount: number): string => (
      amount > 0 && amount % 10_000 === 0 ? `${amount / 10_000}万円` : `${amount.toLocaleString()}円`
    );
    const increments = Array.from(
      { length: Math.floor(additionalMonthlyCapacity / 5_000) },
      (_, index) => (index + 1) * 5_000,
    );
    if (additionalMonthlyCapacity % 5_000 !== 0) increments.push(additionalMonthlyCapacity);

    for (const inc of increments) {
      const newMonthly = currentMonthlyInvestment + inc;
      const updatedInput: SimulatorInput = { ...input, monthlyInvestmentContribution: newMonthly };
      const res = calculateSimulation(updatedInput);
      const shortfall = calcShortfall(updatedInput, res);
      const ageDiff = (res.depletedAge ?? 999) - (baseDepletedAge ?? 999);
      const shortfallDiff = baseShortfall - shortfall;
      const score = ageDiff * 10 + shortfallDiff * 2 - inc / 5_000;

      const proposal: ImprovementProposal = {
        category: "monthly-investment",
        title: currentMonthlyInvestment === 0 ? "まずは積立を始める" : "毎月の積立額を増やす",
        description: currentMonthlyInvestment === 0
          ? `まずは毎月 ${formatMonthlyContribution(newMonthly)} から積立を始めると…`
          : `毎月の積立投資額を ${formatMonthlyContribution(currentMonthlyInvestment)} → ${formatMonthlyContribution(newMonthly)} に増やす`,
        changedParamLabel: "毎月の積立額",
        beforeValueFormatted: `${formatMonthlyContribution(currentMonthlyInvestment)}/月`,
        afterValueFormatted: `${formatMonthlyContribution(newMonthly)}/月`,
        beforeTargetAgeAssets: baseResult.targetAgeAssets,
        beforeDepletedAge: baseDepletedAge,
        afterDepletedAge: res.depletedAge,
        beforeShortfall: baseShortfall,
        afterShortfall: shortfall,
        score,
        updatedInput,
        updatedResult: res,
      };

      proposals.push(proposal);
    }
  }

  // 候補2：年間ボーナス投資額を増やす（ボーナス収入上限などがないため、現実的な範囲で最大+20万円程度まで）
  const bonusIncrements = [50_000, 100_000, 200_000];
  for (const inc of bonusIncrements) {
    const newBonus = input.annualBonusInvestment + inc;
    const updatedInput: SimulatorInput = { ...input, annualBonusInvestment: newBonus };
    const res = calculateSimulation(updatedInput);
    const shortfall = calcShortfall(updatedInput, res);
    const ageDiff = (res.depletedAge ?? 999) - (baseDepletedAge ?? 999);
    const shortfallDiff = baseShortfall - shortfall;
    const score = ageDiff * 10 + shortfallDiff * 2 + (inc / 50_000);

    const proposal: ImprovementProposal = {
      category: "bonus-investment",
      title: "年間ボーナス投資額を増やす",
      description: `年間ボーナス投資額を ${(input.annualBonusInvestment / 10_000).toFixed(0)}万円 → ${(newBonus / 10_000).toFixed(0)}万円 に増やす`,
      changedParamLabel: "年間ボーナス投資",
      beforeValueFormatted: `${(input.annualBonusInvestment / 10_000).toFixed(0)}万円/年`,
      afterValueFormatted: `${(newBonus / 10_000).toFixed(0)}万円/年`,
      beforeTargetAgeAssets: baseResult.targetAgeAssets,
      beforeDepletedAge: baseDepletedAge,
      afterDepletedAge: res.depletedAge,
      beforeShortfall: baseShortfall,
      afterShortfall: shortfall,
      score,
      updatedInput,
      updatedResult: res,
    };

    proposals.push(proposal);
  }

  // 候補3：積立終了年齢を1〜5年延長する
  for (let years = 1; years <= 5; years += 1) {
    const newEndAge = Math.min(input.retirementEndAge, input.investmentEndAge + years);
    if (newEndAge <= input.investmentEndAge) continue;
    const updatedInput: SimulatorInput = { ...input, investmentEndAge: newEndAge };
    const res = calculateSimulation(updatedInput);
    const shortfall = calcShortfall(updatedInput, res);
    const ageDiff = (res.depletedAge ?? 999) - (baseDepletedAge ?? 999);
    const shortfallDiff = baseShortfall - shortfall;
    const score = ageDiff * 10 + shortfallDiff * 2 + years * 3;

    const proposal: ImprovementProposal = {
      category: "investment-end-age",
      title: "積立終了年齢を延長する",
      description: `積立を続ける期間を ${input.investmentEndAge}歳 → ${newEndAge}歳 まで ${years}年 延長する`,
      changedParamLabel: "積立終了年齢",
      beforeValueFormatted: `${input.investmentEndAge}歳`,
      afterValueFormatted: `${newEndAge}歳`,
      beforeTargetAgeAssets: baseResult.targetAgeAssets,
      beforeDepletedAge: baseDepletedAge,
      afterDepletedAge: res.depletedAge,
      beforeShortfall: baseShortfall,
      afterShortfall: shortfall,
      score,
      updatedInput,
      updatedResult: res,
    };

    proposals.push(proposal);
  }

  // 候補4：老後の毎月生活費を1万円単位で下げる（最大20%程度または最大-3万円まで）
  const currentRetirementLivingYen = input.retirementMonthlyLivingExpenses ?? input.monthlyLivingExpenses * input.retirementLivingExpenseRatio;
  const currentRetirementLivingMan = currentRetirementLivingYen / 10_000;
  const reductionSteps = [10_000, 20_000, 30_000].filter(step => currentRetirementLivingYen - step >= 80_000 && step <= currentRetirementLivingYen * 0.2);
  for (const red of reductionSteps) {
    const newLivingYen = currentRetirementLivingYen - red;
    const updatedInput: SimulatorInput = { ...input, retirementMonthlyLivingExpenses: newLivingYen };
    const res = calculateSimulation(updatedInput);
    const shortfall = calcShortfall(updatedInput, res);
    const ageDiff = (res.depletedAge ?? 999) - (baseDepletedAge ?? 999);
    const shortfallDiff = baseShortfall - shortfall;
    const score = ageDiff * 10 + shortfallDiff * 3 + (red / 10_000) * 4;

    const proposal: ImprovementProposal = {
      category: "retirement-living",
      title: "老後の毎月生活費を見直す",
      description: `老後の毎月生活費を ${(currentRetirementLivingYen / 10_000).toFixed(1)}万円 → ${(newLivingYen / 10_000).toFixed(1)}万円 に下げる`,
      changedParamLabel: "老後の毎月生活費",
      beforeValueFormatted: `${(currentRetirementLivingYen / 10_000).toFixed(1)}万円/月`,
      afterValueFormatted: `${(newLivingYen / 10_000).toFixed(1)}万円/月`,
      beforeTargetAgeAssets: baseResult.targetAgeAssets,
      beforeDepletedAge: baseDepletedAge,
      afterDepletedAge: res.depletedAge,
      beforeShortfall: baseShortfall,
      afterShortfall: shortfall,
      score,
      updatedInput,
      updatedResult: res,
    };

    proposals.push(proposal);
  }

  // 候補5：退職年齢を1〜3年遅らせる。
  for (let years = 1; years <= 3; years += 1) {
    const newRetirementAge = Math.min(input.retirementEndAge - 1, input.retirementAge + years);
    if (newRetirementAge <= input.retirementAge) continue;
    const updatedInput: SimulatorInput = { ...input, retirementAge: newRetirementAge };
    const res = calculateSimulation(updatedInput);
    const shortfall = calcShortfall(updatedInput, res);
    const ageDiff = (res.depletedAge ?? 999) - (baseDepletedAge ?? 999);
    const shortfallDiff = baseShortfall - shortfall;
    const score = ageDiff * 10 + shortfallDiff * 3 - years;

    proposals.push({
      category: "retirement-age",
      title: "退職時期を少し遅らせる",
      description: `退職年齢を ${input.retirementAge}歳 → ${newRetirementAge}歳 に ${years}年 遅らせる`,
      changedParamLabel: "退職年齢",
      beforeValueFormatted: `${input.retirementAge}歳`,
      afterValueFormatted: `${newRetirementAge}歳`,
      beforeTargetAgeAssets: baseResult.targetAgeAssets,
      beforeDepletedAge: baseDepletedAge,
      afterDepletedAge: res.depletedAge,
      beforeShortfall: baseShortfall,
      afterShortfall: shortfall,
      score,
      updatedInput,
      updatedResult: res,
    });
  }

  const improvesOutcome = (proposal: ImprovementProposal): boolean => (
    proposal.afterShortfall < baseShortfall
    || (proposal.afterDepletedAge ?? 999) > (baseDepletedAge ?? 999)
    || proposal.updatedResult.targetAgeAssets > baseResult.targetAgeAssets
  );
  const categoryPriority: Record<ImprovementCategory, number> = {
    "monthly-investment": 1,
    "retirement-living": 2,
    "retirement-age": 3,
    "investment-end-age": 4,
    "bonus-investment": 5,
  };
  const rankedProposals = proposals
    .filter(improvesOutcome)
    .sort((a, b) => {
      const categoryDiff = categoryPriority[a.category] - categoryPriority[b.category];
      if (categoryDiff !== 0) return categoryDiff;
      if (a.category === "monthly-investment" && b.category === "monthly-investment") {
        return (a.updatedInput.monthlyInvestmentContribution - input.monthlyInvestmentContribution)
          - (b.updatedInput.monthlyInvestmentContribution - input.monthlyInvestmentContribution);
      }
      if (a.afterShortfall !== b.afterShortfall) return a.afterShortfall - b.afterShortfall;
      return b.score - a.score;
    });
  const bestProposal = rankedProposals[0] ?? null;
  const hasImprovement = bestProposal !== null || suggestedResult !== null;

  return {
    ...baseFields,
    status: hasImprovement ? "increase" : "no-capacity",
    suggestedMonthlyInvestment,
    additionalMonthlyInvestment,
    targetAgeAssets: suggestedResult?.targetAgeAssets ?? bestProposal?.updatedResult.targetAgeAssets ?? baseResult.targetAgeAssets,
    suggestedResult,
    bestProposal,
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
  investmentEndAge: 65,
  retirementEndAge: 90,
  currentCashAssets: 1_000_000,
  currentInvestmentAssets: 0,
  monthlyIncome: 300_000,
  monthlyLivingExpenses: 200_000,
  monthlyInvestmentContribution: 50_000,
  annualBonusInvestment: 0,
  annualReturnRate: 5,
  retirementAge: 65,
  annualRetirementIncome: 2_200_000,
  retirementMonthlyLivingExpenses: 270_000,
  retirementLivingExpenseRatio: 0.75,
  targetAssets: 0,
  householdSize: 2,
  lifeEvents: DEFAULT_LIFE_EVENTS,
  targetAge: 90,
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
