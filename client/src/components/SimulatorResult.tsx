/**
 * SimulatorResult — 人生全体マネープランの結果画面
 * 表示対象は「金融資産残高」。住宅価値を含む純資産ではない。
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, ChevronDown, ChevronUp, RotateCcw, ShieldAlert, TrendingUp } from "lucide-react";
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
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm ring-1 ring-sky-100 sm:p-7">
        <p className="text-center text-sm font-medium text-slate-600">{input.targetAge}歳時点の予想金融資産</p>
        <p className="mt-2 text-center text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{formatCurrency(result.targetAgeAssets)}</p>
        <p className="mt-2 text-center text-xs text-slate-500">現金資産＋投資資産。住宅価値は含みません。</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <SummaryMetric label="現金資産" value={formatCurrency(result.yearlyRecords.at(-1)?.cashEnd ?? 0)} accent="sky" />
          <SummaryMetric label="投資資産" value={formatCurrency(result.yearlyRecords.at(-1)?.investmentEnd ?? 0)} accent="emerald" />
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3">
        <SummaryMetric label="投資元本" value={formatCurrency(result.totalPrincipalContributed)} detail="積立の累計" />
        <SummaryMetric label="運用益" value={formatCurrency(result.totalInvestmentGain)} accent="emerald" detail="想定利回りによる試算" />
        <SummaryMetric label="資産ピーク" value={formatCurrency(result.peakFinancialAssets)} detail={`${result.peakAge}歳時点`} />
        <SummaryMetric label="目標達成年齢" value={result.targetAchievedAge ? `${result.targetAchievedAge}歳` : "未到達"} accent={result.targetAchievedAge ? "emerald" : "amber"} detail={input.targetAssets > 0 ? `目標 ${formatCurrency(input.targetAssets)}` : "目標未設定"} />
      </div>

      {result.isDepleted && (
        <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-bold">金融資産が枯渇する可能性があります</p><p className="mt-1 text-sm leading-relaxed">{result.depletedAge}歳の年末に資産が不足する試算です。支出・積立・イベント条件を変えて比較してください。</p></div>
        </div>
      )}

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
