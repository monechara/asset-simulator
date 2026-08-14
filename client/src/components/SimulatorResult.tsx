/**
 * SimulatorResult — 人生全体マネープランの結果画面
 * 表示対象は「金融資産残高」。住宅価値を含む純資産ではない。
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, ChevronDown, ChevronUp, MapPin, RotateCcw, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SimulatorInput, SimulatorResult } from "@/lib/simulator";
import { calculateMonthlyComparison, calculateStartAgeComparison, formatCurrency } from "@/lib/simulator";

interface Props {
  result: SimulatorResult;
  input: SimulatorInput;
  onReset: () => void;
}

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

export default function SimulatorResultView({ result, input, onReset }: Props) {
  const [showMonthly, setShowMonthly] = useState(false);
  const [showStartAge, setShowStartAge] = useState(false);

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
  const retirementYears = Math.max(0, input.targetAge - input.retirementAge);
  const requiredRetirementAssets = Math.max(0, (retirementMonthlyLiving - retirementMonthlyIncome) * 12 * retirementYears);
  const retirementFundingGap = Math.round(result.targetAgeAssets / 10_000) - requiredRetirementAssets;
  const retirementShortfall = Math.max(0, -retirementFundingGap);
  const retirementSummaryMessage = retirementShortfall === 0
    ? "老後資金の目標を達成できる見込みです"
    : `現在の条件では老後資金が約${retirementShortfall.toLocaleString()}万円不足する見込みです`;
  const retirementGapDetail = retirementShortfall === 0
    ? "設定した年金等の収入で、想定した生活費をまかなえる試算です"
    : "想定した生活費と年金等の収入から算出した不足見込みです";
  const hasTargetAge = input.targetAssets > 0 && Boolean(result.targetAchievedAge);

  const chartData = useMemo(() => result.yearlyRecords
    .filter((record) => record.year === 0 || record.year % 5 === 0 || record.age === input.targetAge || record.activeEvents.length > 0)
    .map((record) => ({
      age: record.age,
      現金資産: Math.round(record.cashEnd / 10_000),
      投資資産: Math.round(record.investmentEnd / 10_000),
      金融資産: Math.round(record.totalFinancialAssets / 10_000),
    })), [result.yearlyRecords, input.targetAge]);

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
    <div className="space-y-5">
      {/* 1. 3秒で理解できる将来のシミュレーション結果 */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm ring-1 ring-sky-100 sm:p-7">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-sky-800">
          <Target className="h-4 w-4" />
          <span>あなたのシミュレーション結果</span>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-slate-600">{input.targetAge}歳時点の予想金融資産</p>
        <p className="mt-1 text-center text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{formatCurrency(result.targetAgeAssets)}</p>
        <p className="mt-2 text-center text-xs text-slate-500">現金資産＋投資資産。住宅価値は含みません。</p>

        <div className={`mt-4 rounded-2xl border p-3.5 ${retirementShortfall === 0 ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"}`}>
          <div className="flex items-start gap-2.5">
            {retirementShortfall === 0 ? <Target className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />}
            <div>
              <p className={`text-sm font-bold ${retirementShortfall === 0 ? "text-emerald-900" : "text-amber-950"}`}>{retirementSummaryMessage}</p>
              <p className={`mt-1 text-xs leading-relaxed ${retirementShortfall === 0 ? "text-emerald-800" : "text-amber-900"}`}>{retirementGapDetail}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-sky-100 bg-white/85 p-3">
            <p className="text-[11px] font-medium text-slate-500">投資元本</p>
            <p className="mt-1 text-lg font-black tabular-nums text-slate-900">{formatCurrency(result.totalPrincipalContributed)}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">積立の累計</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white/85 p-3">
            <p className="text-[11px] font-medium text-slate-500">運用益</p>
            <p className="mt-1 text-lg font-black tabular-nums text-emerald-800">{formatCurrency(result.totalInvestmentGain)}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">想定利回りによる試算</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/75 px-3.5 py-3">
          <div>
            <p className="text-[11px] font-medium text-slate-500">老後の不足見込み</p>
            <p className={`mt-0.5 text-xl font-black tabular-nums ${retirementShortfall === 0 ? "text-emerald-700" : "text-amber-800"}`}>{retirementShortfall.toLocaleString()}万円</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-500">目標達成予想</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-slate-900">{hasTargetAge ? `${result.targetAchievedAge}歳` : input.targetAssets > 0 ? "未到達" : "目標未設定"}</p>
          </div>
        </div>
      </motion.section>

      {result.isDepleted && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-bold">金融資産が枯渇する可能性があります</p><p className="mt-1 text-sm leading-relaxed">{result.depletedAge}歳の年末に資産が不足する試算です。支出・積立・イベント条件を変えて比較してください。</p></div>
        </div>
      )}

      {/* 2. あなたの現在地・同年代比較 */}
      <Card className="border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/50">
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
      <Card className="border-violet-100 shadow-sm bg-violet-50/30">
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
      <Card className="border-sky-100 shadow-sm bg-gradient-to-b from-white to-sky-50/40">
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

      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-base">年齢ごとの金融資産推移</CardTitle><p className="text-xs text-slate-500">単位：万円。イベントのある年はグラフ上の点で確認できます。</p></CardHeader>
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
              <Area type="monotone" dataKey="現金資産" stackId="assets" stroke="#0ea5e9" fill="url(#cashFill)" />
              <Area type="monotone" dataKey="投資資産" stackId="assets" stroke="#10b981" fill="url(#investmentFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. 詳細なシミュレーション結果 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryMetric label="資産ピーク" value={formatCurrency(result.peakFinancialAssets)} detail={`${result.peakAge}歳時点`} />
      </div>

      {eventRecords.length > 0 && <Card className="border-amber-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-amber-600" />ライフイベントの影響</CardTitle></CardHeader><CardContent className="space-y-2">{eventRecords.map((record) => <div key={record.age} className="flex items-center justify-between rounded-xl bg-amber-50 p-3"><div><p className="text-sm font-semibold text-slate-800">{record.age}歳：{record.activeEvents.join("・")}</p><p className="text-xs text-slate-500">イベント費 {formatCurrency(record.eventCost)} / ローン返済 {formatCurrency(record.loanRepayment)}</p></div><p className="text-sm font-bold text-slate-900">{formatCurrency(record.totalFinancialAssets)}</p></div>)}</CardContent></Card>}

      <ComparisonPanel title="毎月の積立を増やしたら？" icon={<TrendingUp className="h-4 w-4 text-sky-600" />} open={showMonthly} onToggle={() => setShowMonthly(!showMonthly)}>
        <div className="space-y-2">{monthlyComparisons.map((comparison) => <div key={comparison.monthlyInvestment} className="flex items-center justify-between rounded-xl bg-sky-50 p-3"><div><p className="text-sm font-semibold text-slate-800">毎月 {formatCurrency(comparison.monthlyInvestment)}</p><p className="text-xs text-slate-500">基準との差 {comparison.difference >= 0 ? "+" : ""}{formatCurrency(comparison.difference)}</p></div><p className="font-bold text-sky-700">{formatCurrency(comparison.finalAssets)}</p></div>)}</div>
      </ComparisonPanel>

      {startComparisons.length > 0 && <ComparisonPanel title="もっと早く始めたら？" icon={<Calendar className="h-4 w-4 text-emerald-600" />} open={showStartAge} onToggle={() => setShowStartAge(!showStartAge)}><div className="space-y-2">{startComparisons.map((comparison) => <div key={comparison.startAge} className="flex items-center justify-between rounded-xl bg-emerald-50 p-3"><div><p className="text-sm font-semibold text-slate-800">{comparison.startAge}歳から開始</p><p className="text-xs text-slate-500">基準との差 {comparison.difference >= 0 ? "+" : ""}{formatCurrency(comparison.difference)}</p></div><p className="font-bold text-emerald-700">{formatCurrency(comparison.finalAssets)}</p></div>)}</div></ComparisonPanel>}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950"><strong>注意：</strong>本結果は入力条件に基づく試算であり、将来の運用成果を保証するものではありません。実際の資産運用では価格変動や元本割れの可能性があります。特定の金融商品や証券会社を推奨するものではありません。</div>
      <Button onClick={onReset} variant="outline" className="h-12 w-full rounded-xl"><RotateCcw className="mr-2 h-4 w-4" />条件を変更する</Button>
    </div>
  );
}

function ComparisonPanel({ title, icon, open, onToggle, children }: { title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <Card className="border-slate-200 shadow-sm"><button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-4 text-left"><span className="flex items-center gap-2 text-sm font-bold text-slate-900">{icon}{title}</span>{open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}</button>{open && <CardContent className="border-t border-slate-100 pt-4">{children}</CardContent>}</Card>;
}
