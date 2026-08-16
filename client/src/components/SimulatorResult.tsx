/**
 * SimulatorResult — 人生全体マネープランの結果画面
 * 表示対象は「金融資産残高」。住宅価値を含む純資産ではない。
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, ChevronDown, ChevronUp, MapPin, RotateCcw, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { SimulatorInput, SimulatorResult } from "@/lib/simulator";
import { calculateImprovementSimulation, calculateMonthlyComparison, calculateStartAgeComparison, formatCurrency } from "@/lib/simulator";
import { buildAssetChartData, mergePlanBChartData } from "@/lib/chartData";
import { getImprovementDisplayMetrics } from "@/lib/improvementDisplay";

interface Props {
  result: SimulatorResult;
  input: SimulatorInput;
  onReset: () => void;
  onUpdateInput?: (input: SimulatorInput) => void;
  isSimpleResult?: boolean;
}

import { calculateSimulation } from "@/lib/simulator";
import SimulatorForm from "@/components/SimulatorForm";

function SummaryMetric({ label, value, accent = "sky", detail }: { label: string; value: string; accent?: "sky" | "emerald" | "amber"; detail?: string }) {
  const colors = {
    sky: "border-sky-100 bg-sky-50/70 text-sky-700",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[accent]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs opacity-75">{detail}</p>}
    </div>
  );
}

export default function SimulatorResultView({ result, input, onReset, onUpdateInput, isSimpleResult }: Props) {
  const [showMonthly, setShowMonthly] = useState(false);
  const [showStartAge, setShowStartAge] = useState(false);

  // 比較プランBの状態
  const [hasPlanB, setHasPlanB] = useState(false);
  const [planBInput, setPlanBInput] = useState<SimulatorInput>(input);
  const [isEditingPlanB, setIsEditingPlanB] = useState(false);

  const planBResult = useMemo(() => {
    if (!hasPlanB) return null;
    try {
      return calculateSimulation(planBInput);
    } catch {
      return null;
    }
  }, [hasPlanB, planBInput]);

  const improvement = useMemo(() => calculateImprovementSimulation(input, result), [input, result]);
  const improvementMetrics = useMemo(
    () => getImprovementDisplayMetrics(improvement.bestProposal, input.retirementEndAge),
    [improvement.bestProposal, input.retirementEndAge],
  );

  // 年齢に応じた公的統計目安の取得（金融広報中央委員会「家計の金融行動に関する世論調査」等に基づく）
  const ageGroupLabel = useMemo(() => {
    if (input.currentAge < 30) return "20代";
    if (input.currentAge < 40) return "30代";
    if (input.currentAge < 50) return "40代";
    if (input.currentAge < 60) return "50代";
    return "60代以上";
  }, [input.currentAge]);

  const benchmarkData = useMemo(() => {
    switch (ageGroupLabel) {
      case "20代":
        return {
          group: "20代",
          totalAvg: 400,
          totalMedian: 130,
          cashAvg: 250,
          cashMedian: 100,
          investAvg: 150,
          investMedian: 0,
          monthlySaveAvg: 3.5,
          sourceNote: "金融広報中央委員会「家計の金融行動に関する世論調査（令和5年）」20代世帯調査"
        };
      case "30代":
        return {
          group: "30代",
          totalAvg: 800,
          totalMedian: 450,
          cashAvg: 500,
          cashMedian: 300,
          investAvg: 300,
          investMedian: 50,
          monthlySaveAvg: 5.2,
          sourceNote: "金融広報中央委員会「家計の金融行動に関する世論調査（令和5年）」30代世帯調査"
        };
      case "40代":
        return {
          group: "40代",
          totalAvg: 1200,
          totalMedian: 650,
          cashAvg: 700,
          cashMedian: 400,
          investAvg: 500,
          investMedian: 100,
          monthlySaveAvg: 6.8,
          sourceNote: "金融広報中央委員会「家計の金融行動に関する世論調査（令和5年）」40代世帯調査"
        };
      case "50代":
        return {
          group: "50代",
          totalAvg: 1700,
          totalMedian: 950,
          cashAvg: 900,
          cashMedian: 500,
          investAvg: 800,
          investMedian: 150,
          monthlySaveAvg: 7.5,
          sourceNote: "金融広報中央委員会「家計の金融行動に関する世論調査（令和5年）」50代世帯調査"
        };
      default:
        return {
          group: "60代以上",
          totalAvg: 2300,
          totalMedian: 1500,
          cashAvg: 1200,
          cashMedian: 700,
          investAvg: 1100,
          investMedian: 300,
          monthlySaveAvg: 6.0,
          sourceNote: "金融広報中央委員会「家計の金融行動に関する世論調査（令和5年）」60代以上世帯調査"
        };
    }
  }, [ageGroupLabel]);

  const currentTotalAssets = Math.round((input.currentCashAssets + input.currentInvestmentAssets) / 10_000);
  const currentCash = Math.round(input.currentCashAssets / 10_000);
  const currentInvest = Math.round(input.currentInvestmentAssets / 10_000);
  const currentMonthlySave = Math.round(input.monthlyInvestmentContribution / 10_000);
  const currentAnnualBonus = Math.round(input.annualBonusInvestment / 10_000);
  const comparisonScaleMax = Math.max(benchmarkData.totalAvg, benchmarkData.totalMedian, currentTotalAssets, 1) * 1.15;
  const markerPosition = (value: number) => `${Math.min(100, Math.max(0, (value / comparisonScaleMax) * 100))}%`;
  const currentReturnRate = input.annualReturnRate;
  const retirementMonthlyLiving = Math.round((input.retirementMonthlyLivingExpenses ?? input.monthlyLivingExpenses * input.retirementLivingExpenseRatio) / 10_000);
  const retirementMonthlyIncome = Math.round(input.annualRetirementIncome / 12 / 10_000);
  const retirementYears = Math.max(0, input.retirementEndAge - input.retirementAge);
  const totalRetirementLivingCost = retirementMonthlyLiving * 12 * retirementYears;
  const totalRetirementIncome = retirementMonthlyIncome * 12 * retirementYears;

  // 資産推移シミュレーション結果（result.isDepleted / 枯渇年齢）を基準に不足額を判定
  // 途中で枯渇しない場合は不足0円、枯渇する場合は推定不足額または直近の不足量を算出
  const netRetirementLivingNeed = Math.max(0, totalRetirementLivingCost - totalRetirementIncome);
  const retirementShortfall = result.isDepleted
    ? Math.max(1, Math.round(netRetirementLivingNeed - Math.round((result.targetAgeAssets + (result.yearlyRecords.find(r => r.age === result.depletedAge)?.totalFinancialAssets ?? 0)) / 10_000)))
    : 0;

  const retirementSummaryMessage = retirementShortfall === 0
    ? "現在の条件では老後資金をまかなえる見込みです"
    : `現在の条件では老後資金が約${retirementShortfall.toLocaleString()}万円不足する見込みです`;
  const retirementGapDetail = retirementShortfall === 0
    ? `老後期間（${input.retirementAge}〜${input.retirementEndAge}歳 / ${retirementYears}年間）の生活費総額に対し、年金収入と運用資産が想定終了年齢（${input.retirementEndAge}歳）まで持続する試算です。`
    : `老後期間（${input.retirementAge}〜${input.retirementEndAge}歳 / ${retirementYears}年間）の試算において、${result.depletedAge}歳頃に資産が枯渇する見込みです。`;
  const hasTargetAge = input.targetAssets > 0 && Boolean(result.targetAchievedAge);

  // 資産が最も少なくなる年齢と金額を算出するヘルパー
  const getMinAssetInfo = (records: any[]) => {
    if (!records || records.length === 0) return { age: input.currentAge, amount: 0 };
    let minRec = records[0];
    for (const r of records) {
      if (r.totalFinancialAssets < minRec.totalFinancialAssets) {
        minRec = r;
      }
    }
    return { age: minRec.age, amount: minRec.totalFinancialAssets };
  };

  const planAMin = useMemo(() => getMinAssetInfo(result.yearlyRecords), [result.yearlyRecords]);
  const planBMin = useMemo(() => planBResult ? getMinAssetInfo(planBResult.yearlyRecords) : null, [planBResult]);

  const chartData = useMemo(() => {
    const planAData = buildAssetChartData(result.yearlyRecords);
    return planBResult
      ? mergePlanBChartData(planAData, planBResult.yearlyRecords)
      : planAData;
  }, [result.yearlyRecords, planBResult]);

  const monthlyComparisons = useMemo(
    () => calculateMonthlyComparison(input, [10_000, 30_000]),
    [input],
  );
  const startAges = useMemo(() => {
    const ages: number[] = [];
    for (let age = Math.max(18, input.currentAge - 10); age < input.currentAge; age += 5) ages.push(age);
    return ages;
  }, [input.currentAge]);
  const startComparisons = useMemo(
    () => calculateStartAgeComparison(input, startAges),
    [input, startAges],
  );
  const eventRecords = result.yearlyRecords.filter((record) => record.activeEvents.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {isSimpleResult ? (
        <>
          {/* 1. 予想金融資産（最上部） */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="order-1 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm ring-1 ring-sky-100 sm:p-8 text-center space-y-2">
            <p className="text-xs font-bold text-sky-800 tracking-wide uppercase">✨ かんたんシミュレーション結果</p>
            <p className="text-sm font-medium text-slate-600">{input.retirementEndAge}歳時点の予想金融資産</p>
            <p className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900">{formatCurrency(result.targetAgeAssets)}</p>
            <p className="text-xs text-slate-400">※ 生活費や年金は統計目安を仮定した試算です。</p>
            <div className={`mt-3 rounded-2xl border p-3.5 text-left ${retirementShortfall === 0 ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
              <p className={`text-sm font-bold ${retirementShortfall === 0 ? "text-emerald-900" : "text-amber-950"}`}>{retirementSummaryMessage}</p>
              <p className={`mt-1 text-xs leading-relaxed ${retirementShortfall === 0 ? "text-emerald-800" : "text-amber-900"}`}>{retirementGapDetail}</p>
            </div>
          </motion.section>

          {/* 2. 資産推移グラフ */}
          <Card className="order-3">
            <CardHeader>
              <CardTitle className="text-base">資産の推移グラフ</CardTitle>
              <p className="text-xs text-slate-500">今後、資産がどのように増減していくのか一目で分かります。</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} /><stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} /></linearGradient>
                    <linearGradient id="investmentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.45} /><stop offset="95%" stopColor="#34d399" stopOpacity={0.08} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="age" tickFormatter={(value) => `${value}歳`} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `${value}`} width={42} />
                  <Tooltip labelFormatter={(value) => `${value}歳`} formatter={(value) => [`${Number(value).toLocaleString()}万円`, ""]} />
                  <Area type="monotone" dataKey="総金融資産" stroke="#10b981" strokeWidth={2.5} fill="url(#investmentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. 同年代と比べると？（金融行動調査の中央値ベース比較） */}
          <Card className="order-2 border-sky-100 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📊</span>
                <span>同年代と比べると？（{benchmarkData.group}の目安）</span>
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">{benchmarkData.sourceNote}の中央値データとの比較です。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ① 現在の金融資産比較（同一尺度マーカーバー） */}
              {(() => {
                const maxVal = Math.max(currentTotalAssets, benchmarkData.totalMedian, 100) * 1.3;
                const userPercent = Math.min(100, Math.max(3, (currentTotalAssets / maxVal) * 100));
                const medianPercent = Math.min(100, Math.max(3, (benchmarkData.totalMedian / maxVal) * 100));
                const diff = currentTotalAssets - benchmarkData.totalMedian;
                return (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>現在の金融資産（現金＋投資）</span>
                      <span className={diff >= 0 ? "text-emerald-700" : "text-amber-700"}>
                        {diff >= 0 ? `中央値より +${diff.toLocaleString()}万円` : `中央値まで あこと${Math.abs(diff).toLocaleString()}万円`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-xs">
                        <p className="text-[11px] text-slate-500">あなた</p>
                        <p className="text-lg font-black text-sky-700 mt-0.5">{currentTotalAssets.toLocaleString()}万円</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <p className="text-[11px] text-slate-500">同年代中央値</p>
                        <p className="text-lg font-bold text-slate-700 mt-0.5">{benchmarkData.totalMedian.toLocaleString()}万円</p>
                      </div>
                    </div>

                    {/* 同一尺度バー */}
                    <div className="pt-6 pb-2 px-2">
                      <div className="relative w-full bg-slate-200 h-3 rounded-full">
                        {/* あなたのマーカー */}
                        <div className="absolute -top-5 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300" style={{ left: `${userPercent}%` }}>
                          <span className="text-[10px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap">あなた ({currentTotalAssets}万)</span>
                          <div className="w-0.5 h-3 bg-sky-600 mt-0.5" />
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-600 -mt-0.5 ring-2 ring-white" />
                        </div>
                        {/* 中央値のマーカー */}
                        <div className="absolute top-4 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300" style={{ left: `${medianPercent}%` }}>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600 -mb-0.5 ring-2 ring-white" />
                          <div className="w-0.5 h-3 bg-slate-600 mb-0.5" />
                          <span className="text-[10px] font-bold bg-slate-700 text-white px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap">中央値 ({benchmarkData.totalMedian}万)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </CardContent>
          </Card>

          {/* 4. 登録したライフイベントの影響 */}
          <Card className="order-4 border-amber-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-amber-600" />ライフイベントの影響</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eventRecords.length > 0 ? eventRecords.map((record) => (
                <div key={record.age} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3">
                  <div><p className="text-sm font-semibold text-slate-800">{record.age}歳：{record.activeEvents.join("・")}</p><p className="text-xs text-slate-500">イベント費 {formatCurrency(record.eventCost)} / ローン返済 {formatCurrency(record.loanRepayment)}</p></div>
                  <p className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(record.totalFinancialAssets)}</p>
                </div>
              )) : <p className="text-sm text-slate-500">登録したライフイベントはありません。</p>}
            </CardContent>
          </Card>

          {/* 5. 詳しい結果を見る */}
          <Accordion type="single" collapsible className="order-5 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
            <AccordionItem value="detailed-results" className="border-b-0">
              <AccordionTrigger className="py-4 text-sm font-bold text-slate-900">詳しい結果を見る</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                  <p className="text-xs font-bold text-sky-900">資金フローの内訳</p>
                  <div className="mt-2 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between"><span>＋ 累計投資元本</span><span className="font-bold">{formatCurrency(result.totalPrincipalContributed)}</span></div>
                    <div className="flex items-center justify-between"><span>＋ 累計運用収益</span><span className="font-bold text-emerald-700">+{formatCurrency(result.totalInvestmentGain)}</span></div>
                    <div className="flex items-center justify-between"><span>− 累計取り崩し</span><span className="font-bold text-amber-800">-{formatCurrency(result.yearlyRecords.reduce((sum, record) => sum + record.investmentWithdrawal, 0))}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-700">
                  <p className="font-bold text-slate-800">現在の金融資産の内訳と同年代比較</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <p>現金資産：{currentCash}万円（平均 約{benchmarkData.cashAvg}万／中央値 約{benchmarkData.cashMedian}万）</p>
                    <p>投資資産：{currentInvest}万円（平均 約{benchmarkData.investAvg}万／中央値 約{benchmarkData.investMedian}万）</p>
                  </div>
                  <p className="mt-2">毎月の積立：{currentMonthlySave}万円／月（{ageGroupLabel}平均 約{benchmarkData.monthlySaveAvg}万円／月）</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-700">
                  <p className="font-bold text-slate-800">老後の生活費・年金の比較</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <p>老後生活費：{retirementMonthlyLiving}万円／月（平均 約26万円・中央値 約24万円）</p>
                    <p>年金収入：{retirementMonthlyIncome}万円／月（平均 約15万円・中央値 約14万円）</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  <p className="font-bold text-slate-800">平均と中央値の見方</p>
                  <p className="mt-1"><strong>平均：</strong>全体の合計を人数で割った値です。<br /><strong>中央値：</strong>金額を少ない順に並べたときの中央の値です。</p>
                  <p className="mt-2 text-[11px]">統計データ出典：{benchmarkData.sourceNote}。あくまで比較用の参考値です。</p>
                </div>
                <ComparisonPanel title="毎月の積立を増やした場合" icon={<TrendingUp className="h-4 w-4 text-sky-600" />} open={showMonthly} onToggle={() => setShowMonthly(!showMonthly)}>
                  <div className="space-y-2">{monthlyComparisons.map((comparison) => <div key={comparison.monthlyInvestment} className="flex items-center justify-between rounded-xl bg-sky-50 p-3"><span className="text-xs font-semibold">毎月 {formatCurrency(comparison.monthlyInvestment)}</span><span className="text-sm font-bold text-sky-700">{formatCurrency(comparison.finalAssets)}</span></div>)}</div>
                </ComparisonPanel>
                <ComparisonPanel title="もっと早く始めた場合" icon={<Calendar className="h-4 w-4 text-emerald-600" />} open={showStartAge} onToggle={() => setShowStartAge(!showStartAge)}>
                  <div className="space-y-2">{startComparisons.map((comparison) => <div key={comparison.startAge} className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><span className="text-xs font-semibold">{comparison.startAge}歳から開始</span><span className="text-sm font-bold text-emerald-700">{formatCurrency(comparison.finalAssets)}</span></div>)}</div>
                </ComparisonPanel>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 6. 詳細設定への分かりやすいCTA（入力値を引き継いで詳細設定フォームを直接開く） */}
          <div className="order-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-sky-600 p-6 text-white text-center shadow-md space-y-3">
            <h4 className="text-lg font-black">もっと正確に未来を見てみませんか？</h4>
            <p className="text-xs text-emerald-100 max-w-md mx-auto leading-relaxed">実際の生活費、マイホーム購入、子育て費用などのライフイベントを個別に追加して、さらに精度の高いプランを作成できます。</p>
            <Button
              type="button"
              onClick={() => {
                if (onUpdateInput) {
                  onUpdateInput(input);
                }
              }}
              className="h-14 px-8 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 shadow-sm"
            >
              詳細設定でシミュレーションする →
            </Button>
          </div>

          {/* 詳しい分析についての簡単な予告案内 */}
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500 shadow-xs space-y-1">
            <p className="font-bold text-slate-700">💡 詳しい分析（資金フロー・年齢別表・改善提案など）</p>
            <p>詳細設定を入力すると、さらに詳しいマネープランの分析やカスタマイズが確認できます。</p>
          </div>
        </>
      ) : (
        <>


          {/* 比較プラン管理バー */}
          <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-sky-800">比較プラン機能</p>
              <p className="text-xs text-slate-500">{hasPlanB ? "プランAとプランBを並べて比較中" : "別の条件（積立額やリタイア年齢など）を比較できます"}</p>
            </div>
            {!hasPlanB ? (
              <Button
                type="button"
                onClick={() => {
                  setPlanBInput(input);
                  setHasPlanB(true);
                  setIsEditingPlanB(true);
                }}
                className="h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold"
              >
                ＋ 比較プラン（プランB）を作る
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingPlanB(!isEditingPlanB)}
                  className="h-9 rounded-xl text-xs font-semibold"
                >
                  {isEditingPlanB ? "比較結果を見る" : "プランBを編集する"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHasPlanB(false);
                    setIsEditingPlanB(false);
                  }}
                  className="h-9 rounded-xl text-xs text-rose-600 hover:bg-rose-50"
                >
                  比較を閉じる
                </Button>
              </div>
            )}
          </div>

          {/* プランB編集モーダル/セクション */}
          {hasPlanB && isEditingPlanB && (
            <Card className="border-sky-200 bg-sky-50/50 shadow-sm">
              <CardHeader><CardTitle className="text-base text-sky-900">プランBの条件編集</CardTitle><p className="text-xs text-slate-600">プランAをコピーしています。変更したい項目を調整して「プランBで再計算」を押してください。</p></CardHeader>
              <CardContent>
                <SimulatorForm
                  initialInput={planBInput}
                  onCalculate={(updated) => {
                    setPlanBInput(updated);
                    setIsEditingPlanB(false);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* A/B比較カード（プランBがある場合） */}
          {hasPlanB && planBResult && (
            <Card className="border-sky-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50 pb-3">
                <CardTitle className="text-base text-slate-900">プランA ＆ プランB 比較結果</CardTitle>
                <p className="text-xs text-slate-500">2つのプランの主要指標の比較</p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1">
                    <p className="font-bold text-sky-800">プランA（現在）</p>
                    <p className="text-slate-500">90歳時点資産: <span className="font-bold text-slate-900">{formatCurrency(result.targetAgeAssets)}</span></p>
                    <p className="text-slate-500">最小資産: <span className="font-bold text-slate-900">{formatCurrency(planAMin.amount)} ({planAMin.age}歳)</span></p>
                    <p className="text-slate-500">枯渇判定: <span className="font-bold text-slate-900">{result.isDepleted ? `${result.depletedAge}歳で枯渇` : "枯渇なし"}</span></p>
                    <p className="text-slate-500">累計元本: <span className="font-bold text-slate-900">{formatCurrency(result.totalPrincipalContributed)}</span></p>
                    <p className="text-slate-500">累計運用益: <span className="font-bold text-emerald-700">+{formatCurrency(result.totalInvestmentGain)}</span></p>
                    <p className="text-slate-500">累計取り崩し: <span className="font-bold text-amber-800">-{formatCurrency(result.yearlyRecords.reduce((s, x) => s + x.investmentWithdrawal, 0))}</span></p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-1">
                    <p className="font-bold text-emerald-800">プランB（比較）</p>
                    <p className="text-slate-500">90歳時点資産: <span className="font-bold text-slate-900">{formatCurrency(planBResult.targetAgeAssets)}</span></p>
                    <p className="text-slate-500">最小資産: <span className="font-bold text-slate-900">{formatCurrency(planBMin?.amount ?? 0)} ({planBMin?.age}歳)</span></p>
                    <p className="text-slate-500">枯渇判定: <span className="font-bold text-slate-900">{planBResult.isDepleted ? `${planBResult.depletedAge}歳で枯渇` : "枯渇なし"}</span></p>
                    <p className="text-slate-500">累計元本: <span className="font-bold text-slate-900">{formatCurrency(planBResult.totalPrincipalContributed)}</span></p>
                    <p className="text-slate-500">累計運用益: <span className="font-bold text-emerald-700">+{formatCurrency(planBResult.totalInvestmentGain)}</span></p>
                    <p className="text-slate-500">累計取り崩し: <span className="font-bold text-amber-800">-{formatCurrency(planBResult.yearlyRecords.reduce((s, x) => s + x.investmentWithdrawal, 0))}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isSimpleResult && <>
      {/* プランB編集モーダル/セクション */}
      {hasPlanB && isEditingPlanB && (
        <Card className="border-sky-200 bg-sky-50/50 shadow-sm">
          <CardHeader><CardTitle className="text-base text-sky-900">プランBの条件編集</CardTitle><p className="text-xs text-slate-600">プランAをコピーしています。変更したい項目を調整して「プランBで再計算」を押してください。</p></CardHeader>
          <CardContent>
            <SimulatorForm
              initialInput={planBInput}
              onCalculate={(updated) => {
                setPlanBInput(updated);
                setIsEditingPlanB(false);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* A/B比較カード（プランBがある場合） */}
      {hasPlanB && planBResult && (
        <Card className="border-sky-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-emerald-50 pb-3">
            <CardTitle className="text-base text-slate-900">プランA ＆ プランB 比較結果</CardTitle>
            <p className="text-xs text-slate-500">2つのプランの主要指標の比較</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1">
                <p className="font-bold text-sky-800">プランA（現在）</p>
                <p className="text-slate-500">90歳時点資産: <span className="font-bold text-slate-900">{formatCurrency(result.targetAgeAssets)}</span></p>
                <p className="text-slate-500">最小資産: <span className="font-bold text-slate-900">{formatCurrency(planAMin.amount)} ({planAMin.age}歳)</span></p>
                <p className="text-slate-500">枯渇判定: <span className="font-bold text-slate-900">{result.isDepleted ? `${result.depletedAge}歳で枯渇` : "枯渇なし"}</span></p>
                <p className="text-slate-500">累計元本: <span className="font-bold text-slate-900">{formatCurrency(result.totalPrincipalContributed)}</span></p>
                <p className="text-slate-500">累計運用益: <span className="font-bold text-emerald-700">+{formatCurrency(result.totalInvestmentGain)}</span></p>
                <p className="text-slate-500">累計取り崩し: <span className="font-bold text-amber-800">-{formatCurrency(result.yearlyRecords.reduce((s, x) => s + x.investmentWithdrawal, 0))}</span></p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-1">
                <p className="font-bold text-emerald-800">プランB（比較）</p>
                <p className="text-slate-500">90歳時点資産: <span className="font-bold text-slate-900">{formatCurrency(planBResult.targetAgeAssets)}</span></p>
                <p className="text-slate-500">最小資産: <span className="font-bold text-slate-900">{formatCurrency(planBMin?.amount ?? 0)} ({planBMin?.age}歳)</span></p>
                <p className="text-slate-500">枯渇判定: <span className="font-bold text-slate-900">{planBResult.isDepleted ? `${planBResult.depletedAge}歳で枯渇` : "枯渇なし"}</span></p>
                <p className="text-slate-500">累計元本: <span className="font-bold text-slate-900">{formatCurrency(planBResult.totalPrincipalContributed)}</span></p>
                <p className="text-slate-500">累計運用益: <span className="font-bold text-emerald-700">+{formatCurrency(planBResult.totalInvestmentGain)}</span></p>
                <p className="text-slate-500">累計取り崩し: <span className="font-bold text-amber-800">-{formatCurrency(planBResult.yearlyRecords.reduce((s, x) => s + x.investmentWithdrawal, 0))}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1. 3秒で理解できる将来のシミュレーション結果 */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="order-1 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm ring-1 ring-sky-100 sm:p-7">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-sky-800">
          <Target className="h-4 w-4" />
          <span>あなたのシミュレーション結果</span>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-600">{input.retirementEndAge}歳時点の予想金融資産</p>
        <p className="mt-1 text-center text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{formatCurrency(result.targetAgeAssets)}</p>
        <p className="mt-2 text-center text-xs text-slate-500">現金資産＋投資資産。住宅価値は含みません。</p>

        {result.isDepleted && result.depletedAge !== null && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm font-bold">{result.depletedAge}歳で資産が枯渇する試算です</p>
            </div>
            <p className="mt-1 text-xs text-rose-700">想定終了年齢（{input.retirementEndAge}歳）に到達する前に金融資産がゼロになる試算となっています。</p>
          </div>
        )}

        <div className={`mt-4 rounded-2xl border p-3.5 ${retirementShortfall === 0 ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
          <div className="flex items-start gap-2.5">
            {retirementShortfall === 0 ? <Target className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />}
            <div>
              <p className={`text-sm font-bold ${retirementShortfall === 0 ? "text-emerald-900" : "text-amber-950"}`}>{retirementSummaryMessage}</p>
              <p className={`mt-1 text-xs leading-relaxed ${retirementShortfall === 0 ? "text-emerald-800" : "text-amber-900"}`}>{retirementGapDetail}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
          <div><p className="text-[11px] font-medium text-slate-500">退職</p><p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{input.retirementAge}歳</p></div>
          <div><p className="text-[11px] font-medium text-slate-500">老後生活費</p><p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{retirementMonthlyLiving}万円/月</p></div>
          <div><p className="text-[11px] font-medium text-slate-500">年金</p><p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{retirementMonthlyIncome}万円/月</p></div>
        </div>

        {/* 資金フローの内訳（累計投資元本・累計運用収益・累計取り崩し） */}
        <div className="hidden mt-3 rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-bold text-sky-900">資金フローの内訳（{input.currentAge}〜{input.retirementEndAge}歳）</p>
          <div className="mt-2.5 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-600">＋ 累計投資元本</span>
              <span className="font-bold tabular-nums text-slate-900">{formatCurrency(result.totalPrincipalContributed)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-600">＋ 累計運用収益</span>
              <span className="font-bold tabular-nums text-emerald-700">+{formatCurrency(result.totalInvestmentGain)}</span>
            </div>
            <div className="flex items-center justify-between pb-0.5">
              <span className="text-slate-600">− 投資資産からの累計取り崩し</span>
              <span className="font-bold tabular-nums text-amber-800">-{formatCurrency(result.yearlyRecords.reduce((s, x) => s + x.investmentWithdrawal, 0))}</span>
            </div>
          </div>
          <p className="mt-2.5 text-[10px] text-slate-400 leading-relaxed">
            ※初期投資＋実際に追加した積立の累計（取り崩しても減りません）。運用収益は全期間の合計であり、内部の残差 principal は表示していません。
          </p>
        </div>

        <div className="hidden mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-3">
          <div>
            <p className="text-[11px] font-medium text-slate-500">退職</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{input.retirementAge}歳</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">老後生活費</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{retirementMonthlyLiving}万円/月</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">年金</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-900">{retirementMonthlyIncome}万円/月</p>
          </div>
        </div>

        <div className={`mt-3 grid gap-3 ${input.targetAssets > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="rounded-2xl border border-slate-200 bg-white/75 px-3.5 py-3">
            <p className="text-[11px] font-medium text-slate-500">老後の不足見込み</p>
            <p className={`mt-0.5 text-xl font-black tabular-nums ${retirementShortfall === 0 ? "text-emerald-700" : "text-amber-800"}`}>{retirementShortfall.toLocaleString()}万円</p>
            <p className="mt-0.5 text-[10px] text-slate-400">老後期間の生活費総額 − 年金収入総額 − 65歳時点資産</p>
          </div>
          {input.targetAssets > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white/75 px-3.5 py-3 text-right">
              <p className="text-[11px] font-medium text-slate-500">設定した資産目標</p>
              <p className="mt-0.5 text-xl font-black tabular-nums text-slate-900">
                {hasTargetAge ? `資産${Math.round(input.targetAssets / 10_000).toLocaleString()}万円の達成：${result.targetAchievedAge}歳` : `資産${Math.round(input.targetAssets / 10_000).toLocaleString()}万円：未到達`}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">任意の資産目標に対する到達予想</p>
            </div>
          )}
        </div>
      </motion.section>

      {result.isDepleted && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-bold">金融資産が枯渇する可能性があります</p><p className="mt-1 text-sm leading-relaxed">{result.depletedAge}歳の年末に資産が不足する試算です。支出・積立・イベント条件を変えて比較してください。</p></div>
        </div>
      )}

      {/* 🔮 アフィリエイトCTA設定領域（将来の収益化用・デフォルト非表示） */}
      {/* 
        将来の収益化に備えて用意された拡張領域です。
        以下の設定オブジェクトやPropsを経由して、後から簡単にON/OFF・文言・リンクURLを変更できます。
      */}
      {false && (
        <div className="order-5 rounded-3xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900">PR / おすすめサービス</span>
            <span className="text-[10px] bg-sky-200 text-sky-800 px-2 py-0.5 rounded font-semibold">広告枠</span>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-sm font-bold text-slate-900">証券口座開設・資産形成の第一歩を踏み出す</p>
            <p className="text-xs text-slate-600">NISAやつみたて投資枠におすすめのネット証券を比較・詳細チェックできます。</p>
            <a
              href="https://example.com/affiliate-link"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-700"
            >
              おすすめの証券会社を見る →
            </a>
          </div>
        </div>
      )}

      {/* 💡 1つ変えた場合の改善シミュレーションカード（Before→After） */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="order-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <TrendingUp className="h-4 w-4" />
          <span>{input.monthlyInvestmentContribution === 0 && improvement.bestProposal?.category === "monthly-investment"
            ? `💡 まずは毎月${improvement.bestProposal.afterValueFormatted.replace("/月", "")}から積立を始めてみる`
            : "💡 1つ変えると…"}</span>
        </div>

        {improvement.bestProposal ? (
          <div className="mt-4 space-y-4">
            {improvementMetrics && (
              <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-500">{input.retirementEndAge}歳時点の予想金融資産</p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">現在のまま</p>
                    <p className="mt-1 text-lg font-black tabular-nums text-slate-800">{formatCurrency(improvementMetrics.beforeTargetAgeAssets)}</p>
                  </div>
                  <span className="pb-1 text-sm font-bold text-slate-400">→</span>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-emerald-700">{improvement.bestProposal.afterValueFormatted.replace("/月", "")}に変更</p>
                    <p className="mt-1 text-lg font-black tabular-nums text-emerald-800">{formatCurrency(improvementMetrics.afterTargetAgeAssets)}</p>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-center text-base font-black text-emerald-800">
                  {improvementMetrics.targetAgeAssetIncrease >= 0
                    ? `将来資産が約${formatCurrency(improvementMetrics.targetAgeAssetIncrease)}アップ`
                    : `将来資産が約${formatCurrency(Math.abs(improvementMetrics.targetAgeAssetIncrease))}減少`}
                </p>
              </div>
            )}

            {improvementMetrics && (improvementMetrics.showShortfallImprovement || improvementMetrics.showLifeExtension) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {improvementMetrics.showShortfallImprovement && (
                  <div className={`rounded-2xl border p-4 ${improvementMetrics.primaryMetric === "shortfall" ? "border-emerald-200 bg-emerald-50/90 shadow-sm" : "border-slate-200 bg-white/80"}`}>
                    <p className={`text-2xl font-black tracking-tight ${improvementMetrics.primaryMetric === "shortfall" ? "text-emerald-800" : "text-slate-900"}`}>
                      老後資金が{improvementMetrics.shortfallImprovement.toLocaleString()}万円改善
                    </p>
                  </div>
                )}

                {improvementMetrics.showLifeExtension && (
                  <div className={`rounded-2xl border p-4 ${improvementMetrics.primaryMetric === "life" ? "border-emerald-200 bg-emerald-50/90 shadow-sm" : "border-slate-200 bg-white/80"}`}>
                    <p className="text-xs font-bold text-slate-500">資産寿命</p>
                    <p className={`mt-1 text-xl font-black tracking-tight ${improvementMetrics.primaryMetric === "life" ? "text-emerald-800" : "text-slate-900"}`}>
                      {improvementMetrics.beforeLifeLabel} → {improvementMetrics.afterLifeLabel}
                    </p>
                    <p className={`mt-1 text-sm font-black ${improvementMetrics.primaryMetric === "life" ? "text-emerald-800" : "text-slate-700"}`}>
                      {improvementMetrics.lifeExtensionYears}年延長
                    </p>
                  </div>
                )}
              </div>
            )}

            <Accordion type="single" collapsible className="rounded-2xl border border-emerald-100 bg-white/60 px-3">
              <AccordionItem value="improvement-details" className="border-0">
                <AccordionTrigger className="py-3 text-xs font-bold text-slate-600 hover:no-underline">計算条件を見る</AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3 text-xs leading-relaxed text-slate-500">
                  <p>{improvement.bestProposal.changedParamLabel}：{improvement.bestProposal.beforeValueFormatted} → {improvement.bestProposal.afterValueFormatted}</p>
                  {improvementMetrics?.showShortfallImprovement && (
                    <p>不足額：{improvement.bestProposal.beforeShortfall.toLocaleString()}万円 → {improvement.bestProposal.afterShortfall.toLocaleString()}万円</p>
                  )}
                  <p>入力した条件をもとに、1つの変更だけを反映して再計算しています。</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {onUpdateInput && (
              <Button
                type="button"
                onClick={() => {
                  onUpdateInput(improvement.bestProposal!.updatedInput);
                }}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                この条件で試す
              </Button>
            )}
          </div>
        ) : improvement.status === "not-needed" ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-bold text-slate-900">
              現在の条件では{input.retirementEndAge}歳時点でも金融資産が
              <span className="text-emerald-700">約{Math.round(result.targetAgeAssets / 10_000).toLocaleString()}万円</span>
              残る見込みです
            </p>
            <p className="text-xs text-slate-600">想定終了年齢まで資産が枯渇しないため、追加の調整は必須ではありません。</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-base font-black text-slate-900">1つの変更だけでは十分な改善が難しいため、複数の条件を組み合わせて考える必要があります</p>
            <p className="text-xs leading-relaxed text-slate-600">生活費の調整、積立期間の延長、老後生活費や年金収入の再設計など複数の項目を見直すことで、より確実な資産形成につながります。</p>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
          ※入力条件をもとにした試算です。
        </p>
      </motion.div>

      {/* 2. あなたの現在地・同年代比較 */}
      <Card className="hidden border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700" />
              <span>{input.currentAge}歳のあなたの現在地</span>
            </CardTitle>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">{ageGroupLabel}の目安と比較</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            現在の資産形成状況を、公的統計（金融広報中央委員会「家計の金融行動に関する世論調査」等）の{ageGroupLabel}平均・中央値と比較します。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 金融資産合計の比較：このカードだけビジュアルで位置関係を表示 */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-wide text-emerald-700">現在の金融資産合計</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 tabular-nums">{currentTotalAssets}万円</p>
                <p className="mt-1 text-xs text-slate-500">現金資産＋投資資産</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
                <p className="text-[11px] font-bold text-emerald-800">{ageGroupLabel}の比較用目安</p>
                <p className="mt-1 text-xs text-emerald-900">平均 約{benchmarkData.totalAvg}万円</p>
                <p className="text-xs text-emerald-900">中央値 約{benchmarkData.totalMedian}万円</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>金融資産が少ない</span>
                <span>金融資産が多い</span>
              </div>
              <div className="relative mt-4 h-3 rounded-full bg-gradient-to-r from-slate-200 via-sky-100 to-emerald-200">
                <div className="absolute -top-1 h-5 w-px bg-slate-500/70" style={{ left: markerPosition(benchmarkData.totalMedian) }} />
                <div className="absolute -top-1 h-5 w-px bg-emerald-700" style={{ left: markerPosition(currentTotalAssets) }} />
                <div className="absolute -top-1 h-5 w-px bg-slate-700/80" style={{ left: markerPosition(benchmarkData.totalAvg) }} />
                <div className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-emerald-600 shadow" style={{ left: markerPosition(currentTotalAssets) }} aria-label={`あなた ${currentTotalAssets}万円`} />
              </div>
              <div className="relative mt-2 h-10 text-[10px]">
                <div className="absolute top-0 -translate-x-1/2 text-center text-slate-600" style={{ left: markerPosition(benchmarkData.totalMedian) }}>
                  <span className="font-bold">中央値</span><br />約{benchmarkData.totalMedian}万
                </div>
                <div className="absolute top-0 -translate-x-1/2 text-center text-emerald-800" style={{ left: markerPosition(currentTotalAssets) }}>
                  <span className="font-black">あなた</span><br />{currentTotalAssets}万
                </div>
                <div className="absolute top-0 -translate-x-1/2 text-center text-slate-700" style={{ left: markerPosition(benchmarkData.totalAvg) }}>
                  <span className="font-bold">平均</span><br />約{benchmarkData.totalAvg}万
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              {(() => {
                const medianDiff = currentTotalAssets - benchmarkData.totalMedian;
                const averageDiff = currentTotalAssets - benchmarkData.totalAvg;
                const medianText = medianDiff === 0 ? "中央値と同水準" : `中央値より 約${Math.abs(medianDiff)}万円${medianDiff > 0 ? "多い" : "少ない"}`;
                const averageText = averageDiff === 0 ? "平均と同水準" : `平均より 約${Math.abs(averageDiff)}万円${averageDiff > 0 ? "多い" : "少ない"}`;
                return <><strong className="text-slate-900">{medianText}</strong>、<strong className="text-slate-900">{averageText}</strong>です。これは優劣ではなく、同年代の比較用データとの差を示しています。</>;
              })()}
            </div>
          </div>

          {/* 詳細内訳テーブル ＋ 毎月の積立額比較 */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
                <p className="text-xs font-bold text-slate-700">預貯金（現金資産）</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">あなた: <strong className="text-slate-900">{currentCash}万円</strong></span>
                  <span className="text-slate-500">平均: 約{benchmarkData.cashAvg}万 / 中央値: 約{benchmarkData.cashMedian}万</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
                <p className="text-xs font-bold text-slate-700">投資資産（株・投資信託）</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">あなた: <strong className="text-slate-900">{currentInvest}万円</strong></span>
                  <span className="text-slate-500">平均: 約{benchmarkData.investAvg}万 / 中央値: 約{benchmarkData.investMedian}万</span>
                </div>
              </div>
            </div>

            {/* 毎月の積立額の比較 */}
            <div className="bg-white rounded-2xl p-3.5 border border-emerald-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">毎月の積立額（投資・貯蓄）</p>
                <span className="text-[11px] text-emerald-700 font-semibold">{ageGroupLabel}平均との比較</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">あなた：<strong className="text-slate-900 text-sm">{currentMonthlySave}万円/月</strong></span>
                <span className="text-slate-600">{ageGroupLabel}平均：<strong className="text-slate-900 text-sm">約{benchmarkData.monthlySaveAvg}万円/月</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2 flex items-center justify-between">
                <span>平均との差</span>
                <span className={`font-bold ${currentMonthlySave >= benchmarkData.monthlySaveAvg ? "text-emerald-700" : "text-sky-700"}`}>
                  {(() => {
                    const diff = Math.round((currentMonthlySave - benchmarkData.monthlySaveAvg) * 10) / 10;
                    if (diff === 0) return "平均と同水準";
                    return diff > 0 ? `平均より 約${diff}万円多い` : `平均より 約${Math.abs(diff)}万円少ない`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* 平均と中央値の用語解説 ＋ 統計ソースの明記 */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div>
              <p className="font-bold text-slate-800">💡 平均と中央値の見方について</p>
              <p className="leading-relaxed mt-1">
                <strong>平均：</strong>全体の合計を人数で割った値です（一部の高額保有者に引き上げられる傾向があります）。<br />
                <strong>中央値：</strong>金額を少ない順に並べたときに真ん中に位置する値です（実態のボリューム層を表します）。
              </p>
            </div>
            <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
              <p><strong>📊 統計データ出典：</strong>{benchmarkData.sourceNote}。</p>
              <p className="mt-0.5">※ 年齢はご入力いただいた{input.currentAge}歳に基づき「{ageGroupLabel}」の公的世帯統計を適用しています。分布データが限られるため上位パーセンタイルは推測せず、平均・中央値との比較として表示しています。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 現在の積立ペース */}
      <Card className="hidden border-violet-100 shadow-sm bg-violet-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-700" />
            <span>今の積立ペース</span>
          </CardTitle>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">現在の資産と積立条件が、{input.targetAge}歳時点の予想資産につながっています。</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryMetric label="毎月の積立" value={`${currentMonthlySave}万円`} detail="投資資産へ" />
            <SummaryMetric label="年間ボーナス投資" value={`${currentAnnualBonus}万円`} accent="amber" detail="年間合計" />
            <SummaryMetric label="想定利回り" value={`${currentReturnRate}%`} accent="emerald" detail="将来保証なし" />
            <SummaryMetric label="現在の金融資産" value={`${currentTotalAssets}万円`} accent="sky" detail="現金＋投資" />
          </div>
        </CardContent>
      </Card>

      {/* 4. 統計上の目安（生活費・年金）との比較カード */}
      <Card className="hidden border-sky-100 shadow-sm bg-gradient-to-b from-white to-sky-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span>
              <span>あなたと統計上の目安を比較</span>
            </CardTitle>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2.5 py-1 rounded-full">公的統計ベース</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            平均（全体の合計を人数で割った一般的な平均値）や中央値（金額を小さい順に並べた真ん中の値）とご自身の想定を比較し、これからのライフプランの参考にしてください。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 老後の生活費比較 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">老後の毎月の生活費</span>
              <span className="text-xs text-slate-500">統計上の目安（生命保険文化センター等）</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-sky-800">あなた</p>
                <p className="text-base font-black text-sky-900 mt-0.5">{retirementMonthlyLiving}万円</p>
                <p className="text-[10px] text-sky-700 mt-0.5">想定月額</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-slate-700">平均値</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">約26万円</p>
                <p className="text-[10px] text-slate-500 mt-0.5">高齢無職世帯(総務省)</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-slate-700">中央値</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">約24万円</p>
                <p className="text-[10px] text-slate-500 mt-0.5">実態ボリューム層</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
              <span>統計目安（平均26万）との差</span>
              <span className={`font-bold ${retirementMonthlyLiving >= 26 ? "text-amber-700" : "text-emerald-700"}`}>
                {(() => {
                  const userVal = retirementMonthlyLiving;
                  const diff = userVal - 26;
                  if (diff === 0) return "平均と同水準";
                  return diff > 0 ? `平均より 約${diff}万円多い` : `平均より 約${Math.abs(diff)}万円少ない`;
                })()}
              </span>
            </div>
          </div>

          {/* 老後の年金収入比較 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">老後の毎月の収入（年金等）</span>
              <span className="text-xs text-slate-500">公的年金受給者平均</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-emerald-800">あなた</p>
                <p className="text-base font-black text-emerald-900 mt-0.5">{retirementMonthlyIncome}万円</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">想定月額</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-slate-700">平均値</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">約15万円</p>
                <p className="text-[10px] text-slate-500 mt-0.5">公的年金受給実績</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-slate-700">中央値</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">約14万円</p>
                <p className="text-[10px] text-slate-500 mt-0.5">受給ボリューム層</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
              <span>統計目安（平均15万）との差</span>
              <span className={`font-bold ${retirementMonthlyIncome >= 15 ? "text-emerald-700" : "text-amber-700"}`}>
                {(() => {
                  const userVal = retirementMonthlyIncome;
                  const diff = userVal - 15;
                  if (diff === 0) return "平均と同水準";
                  return diff > 0 ? `平均より 約${diff}万円多い` : `平均より 約${Math.abs(diff)}万円少ない`;
                })()}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            ※ 平均・中央値は一般的な統計データの参考値であり、加入状況や地域、生活スタイルにより大きく異なります。
          </p>
        </CardContent>
      </Card>

      <Card className="order-2 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">年齢ごとの金融資産推移 {hasPlanB && "(プランA ＆ プランB比較)"}</CardTitle>
          <p className="text-xs text-slate-500">単位：万円。イベントのある年はグラフ上の点で確認できます。</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="planAFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} /><stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="planBFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="age" tickFormatter={(value) => `${value}歳`} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `${value}`} width={42} />
              <Tooltip labelFormatter={(value) => `${value}歳`} formatter={(value, name) => [`${Number(value).toLocaleString()}万円`, name]} />
              {/* RechartsではFragment内の系列が走査されないため、すべてAreaChart直下に置きhideで切り替える。 */}
              <Area hide={hasPlanB} type="monotone" dataKey="現金資産" stackId="assets" stroke="#0ea5e9" fill="url(#planAFill)" name="現金資産" />
              <Area hide={hasPlanB} type="monotone" dataKey="投資資産" stackId="assets" stroke="#10b981" fill="url(#planBFill)" name="投資資産" />
              <Line hide={hasPlanB} type="monotone" dataKey="総金融資産" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 2, strokeWidth: 1, fill: "#0f766e" }} name="総金融資産" />
              <Area hide={!hasPlanB} type="monotone" dataKey="プランA_金融資産" stroke="#0284c7" strokeWidth={2} fill="url(#planAFill)" name="プランA(金融資産)" />
              <Area hide={!hasPlanB} type="monotone" dataKey="プランB_金融資産" stroke="#10b981" strokeWidth={2} fill="url(#planBFill)" name="プランB(金融資産)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. 詳細なシミュレーション結果（資産ピークは資金フロー内に保持） */}
      <div className="hidden grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryMetric label="資産ピーク" value={formatCurrency(result.peakFinancialAssets)} detail={`${result.peakAge}歳時点`} />
      </div>

      <Card className="order-3 border-amber-100 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-amber-600" />ライフイベントと資産への影響</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {eventRecords.length > 0 ? eventRecords.map((record) => <div key={record.age} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3"><div><p className="text-sm font-semibold text-slate-800">{record.age}歳：{record.activeEvents.join("・")}</p><p className="text-xs text-slate-500">イベント費 {formatCurrency(record.eventCost)} / ローン返済 {formatCurrency(record.loanRepayment)}</p></div><p className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(record.totalFinancialAssets)}</p></div>) : <p className="text-sm text-slate-500">登録したライフイベントはありません。</p>}
        </CardContent>
      </Card>

      <Card className="order-4 border-sky-100 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">資金フローの内訳</CardTitle><p className="text-xs text-slate-500">積立・運用・取り崩しの累計を確認できます。</p></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs"><span className="text-slate-600">＋ 累計投資元本</span><span className="font-bold tabular-nums text-slate-900">{formatCurrency(result.totalPrincipalContributed)}</span></div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs"><span className="text-slate-600">＋ 累計運用収益</span><span className="font-bold tabular-nums text-emerald-700">+{formatCurrency(result.totalInvestmentGain)}</span></div>
          <div className="flex items-center justify-between text-xs"><span className="text-slate-600">− 累計取り崩し</span><span className="font-bold tabular-nums text-amber-800">-{formatCurrency(result.yearlyRecords.reduce((sum, record) => sum + record.investmentWithdrawal, 0))}</span></div>
          <p className="text-[10px] leading-relaxed text-slate-400">※初期投資＋実際に追加した積立の累計。運用収益は全期間の合計です。</p>
          <p className="text-xs text-slate-600">資産ピーク：<strong className="text-slate-900">{formatCurrency(result.peakFinancialAssets)}</strong>（{result.peakAge}歳）</p>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="order-6 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        <AccordionItem value="detailed-comparisons" className="border-b-0">
          <AccordionTrigger className="py-4 text-sm font-bold text-slate-900">同年代との比較を見る</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-xs font-bold text-emerald-800">現在の金融資産（{ageGroupLabel}の目安）</p>
              <div className="mt-2 flex items-end justify-between gap-3"><div><p className="text-[11px] text-slate-500">あなた</p><p className="text-2xl font-black tabular-nums text-slate-900">{currentTotalAssets}万円</p></div><div className="text-right text-xs text-slate-600"><p>平均 約{benchmarkData.totalAvg}万円</p><p>中央値 約{benchmarkData.totalMedian}万円</p></div></div>
              <div className="relative mt-5 h-3 rounded-full bg-gradient-to-r from-slate-200 via-sky-100 to-emerald-200"><div className="absolute -top-1 h-5 w-px bg-slate-500/70" style={{ left: markerPosition(benchmarkData.totalMedian) }} /><div className="absolute -top-1 h-5 w-px bg-emerald-700" style={{ left: markerPosition(currentTotalAssets) }} /><div className="absolute -top-1 h-5 w-px bg-slate-700/80" style={{ left: markerPosition(benchmarkData.totalAvg) }} /><div className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-emerald-600 shadow" style={{ left: markerPosition(currentTotalAssets) }} /></div>
              <div className="relative mt-2 h-9 text-[10px]"><span className="absolute -translate-x-1/2 text-center text-slate-600" style={{ left: markerPosition(benchmarkData.totalMedian) }}>中央値<br />約{benchmarkData.totalMedian}万</span><span className="absolute -translate-x-1/2 text-center font-black text-emerald-800" style={{ left: markerPosition(currentTotalAssets) }}>あなた<br />{currentTotalAssets}万</span><span className="absolute -translate-x-1/2 text-center text-slate-700" style={{ left: markerPosition(benchmarkData.totalAvg) }}>平均<br />約{benchmarkData.totalAvg}万</span></div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3 text-xs"><p className="font-bold text-slate-700">現金資産</p><p className="mt-1">あなた：{currentCash}万円</p><p className="text-slate-500">平均 約{benchmarkData.cashAvg}万／中央値 約{benchmarkData.cashMedian}万</p></div>
              <div className="rounded-2xl border border-slate-200 p-3 text-xs"><p className="font-bold text-slate-700">投資資産</p><p className="mt-1">あなた：{currentInvest}万円</p><p className="text-slate-500">平均 約{benchmarkData.investAvg}万／中央値 約{benchmarkData.investMedian}万</p></div>
            </div>
            <div className="rounded-2xl border border-emerald-200 p-3 text-xs"><p className="font-bold text-slate-700">毎月の積立額</p><p className="mt-1">あなた：{currentMonthlySave}万円／月　{ageGroupLabel}平均：約{benchmarkData.monthlySaveAvg}万円／月</p></div>
            <div className="rounded-2xl border border-slate-200 p-3 text-xs text-slate-700"><p className="font-bold text-slate-800">老後生活費・年金の比較</p><p className="mt-1">老後生活費：{retirementMonthlyLiving}万円／月（平均 約26万円・中央値 約24万円）</p><p>年金収入：{retirementMonthlyIncome}万円／月（平均 約15万円・中央値 約14万円）</p></div>
            <div className="rounded-2xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600"><p><strong>平均：</strong>全体の合計を人数で割った値。<br /><strong>中央値：</strong>金額を少ない順に並べた中央の値。</p><p className="mt-1">出典：{benchmarkData.sourceNote}。比較用の参考値です。</p></div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="hidden">
      <ComparisonPanel title="毎月の積立を増やしたら？" icon={<TrendingUp className="h-4 w-4 text-sky-600" />} open={showMonthly} onToggle={() => setShowMonthly(!showMonthly)}>
        <div className="space-y-2">{monthlyComparisons.map((comparison) => <div key={comparison.monthlyInvestment} className="flex items-center justify-between rounded-xl bg-sky-50 p-3"><div><p className="text-sm font-semibold text-slate-800">毎月 {formatCurrency(comparison.monthlyInvestment)}</p><p className="text-xs text-slate-500">基準との差 {comparison.difference >= 0 ? "+" : ""}{formatCurrency(comparison.difference)}</p></div><p className="font-bold text-sky-700">{formatCurrency(comparison.finalAssets)}</p></div>)}</div>
      </ComparisonPanel>

      {startComparisons.length > 0 && <ComparisonPanel title="もっと早く始めたら？" icon={<Calendar className="h-4 w-4 text-emerald-600" />} open={showStartAge} onToggle={() => setShowStartAge(!showStartAge)}><div className="space-y-2">{startComparisons.map((comparison) => <div key={comparison.startAge} className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><div><p className="text-sm font-semibold text-slate-800">{comparison.startAge}歳から開始</p><p className="text-xs text-slate-500">基準との差 {comparison.difference >= 0 ? "+" : ""}{formatCurrency(comparison.difference)}</p></div><p className="font-bold text-emerald-700">{formatCurrency(comparison.finalAssets)}</p></div>)}</div></ComparisonPanel>}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950"><strong>注意：</strong>本結果は入力条件に基づく試算であり、将来の運用成果を保証するものではありません。実際の資産運用では価格変動や元本割れの可能性があります。特定の金融商品や証券会社を推奨するものではありません。</div>
      <Button onClick={onReset} variant="outline" className="h-12 w-full rounded-xl"><RotateCcw className="mr-2 h-4 w-4" />条件を変更する</Button>
      </>}
    </div>
  );
}

function ComparisonPanel({ title, icon, open, onToggle, children }: { title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <Card className="border-slate-200 shadow-sm"><button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-4 text-left"><span className="flex items-center gap-2 text-sm font-bold text-slate-900">{icon}{title}</span>{open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}</button>{open && <CardContent className="border-t border-slate-100 pt-4">{children}</CardContent>}</Card>;
}
