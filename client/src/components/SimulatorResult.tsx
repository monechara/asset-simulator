/**
 * SimulatorResult — 資産形成シミュレーター結果画面
 * Clarity Dashboard デザイン: グラフ・マイルストーン・年齢別テーブル
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import type { SimulatorResult, SimulatorInput } from "@/lib/simulator";
import { formatCurrency } from "@/lib/simulator";
import { useCountUp } from "@/hooks/useCountUp";
import ShareCard from "@/components/ShareCard";

interface Props {
  result: SimulatorResult;
  input: SimulatorInput;
  onReset: () => void;
}

function StatCard({
  label,
  value,
  sub,
  color = "primary",
  delay = 0,
}: {
  label: string;
  value: number;
  sub?: string;
  color?: "primary" | "accent" | "warning";
  delay?: number;
}) {
  const animated = useCountUp(value, 1000);
  const colorMap = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-amber-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="border-border shadow-sm h-full">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-xl font-bold tabular-nums ${colorMap[color]}`}>
            {formatCurrency(animated)}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MilestoneCard({
  age,
  assets,
  delay,
}: {
  age: number;
  assets: number | null;
  delay: number;
}) {
  const animated = useCountUp(assets ?? 0, 1000);
  if (assets === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-xl border border-border p-3 text-center shadow-sm"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
        <Calendar className="w-4 h-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{age}歳時点</p>
      <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
        {formatCurrency(animated)}
      </p>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}歳</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="text-xs">
            {entry.name}
          </span>
          <span className="font-medium tabular-nums text-xs">
            {formatCurrency(entry.value * 10000)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SimulatorResultView({ result, input, onReset }: Props) {
  const { yearlyRecords, principalTotal, investmentGainTotal, finalAssets, targetAchievedAge } =
    result;

  // グラフ用データ（5年ごとにサンプリング）
  const chartData = useMemo(() => {
    return yearlyRecords
      .filter((r) => r.age % 5 === 0 || r.age === input.currentAge || r.age === 80)
      .map((r) => ({
        age: r.age,
        投資元本: Math.round(r.principal / 10000),
        運用益: Math.round(r.investmentGain / 10000),
        総資産: Math.round(r.totalAssets / 10000),
      }));
  }, [yearlyRecords, input.currentAge]);

  // テーブル用データ（5年ごと）
  const tableData = useMemo(() => {
    return yearlyRecords.filter(
      (r) => r.age % 5 === 0 || r.age === input.currentAge
    );
  }, [yearlyRecords, input.currentAge]);

  const gainRatio =
    principalTotal > 0 ? ((investmentGainTotal / principalTotal) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      {/* 目標達成バナー */}
      {targetAchievedAge && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3"
        >
          <Trophy className="w-6 h-6 text-accent flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              目標達成予定：<span className="text-accent tabular-nums">{targetAchievedAge}歳</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              あと{targetAchievedAge - input.currentAge}年で{formatCurrency(input.targetAssets)}を達成できます
            </p>
          </div>
        </motion.div>
      )}
      {!targetAchievedAge && input.targetAssets > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
        >
          <Target className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              目標未達成（80歳時点）
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              投資額や利回りを増やすと目標に近づきます
            </p>
          </div>
        </motion.div>
      )}

      {/* 主要指標 */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          80歳時点の資産内訳
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="総資産" value={finalAssets} color="primary" delay={0.05} />
          <StatCard label="投資元本" value={principalTotal} color="accent" delay={0.1} />
          <StatCard
            label="運用益"
            value={investmentGainTotal}
            sub={`元本比 +${gainRatio}%`}
            color="accent"
            delay={0.15}
          />
        </div>
      </div>

      {/* マイルストーン */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          年齢別マイルストーン
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <MilestoneCard age={30} assets={result.assetAt30} delay={0.1} />
          <MilestoneCard age={40} assets={result.assetAt40} delay={0.15} />
          <MilestoneCard age={50} assets={result.assetAt50} delay={0.2} />
        </div>
      </div>

      {/* 資産推移グラフ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              資産推移グラフ
              <Badge variant="secondary" className="text-xs ml-auto">
                万円単位
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.38 0.12 240)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.38 0.12 240)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.015 240)" />
                <XAxis
                  dataKey="age"
                  tickFormatter={(v) => `${v}歳`}
                  tick={{ fontSize: 10, fill: "oklch(0.52 0.04 240)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v.toLocaleString()}万`}
                  tick={{ fontSize: 10, fill: "oklch(0.52 0.04 240)" }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="投資元本"
                  stackId="1"
                  stroke="oklch(0.38 0.12 240)"
                  strokeWidth={2}
                  fill="url(#gradPrincipal)"
                />
                <Area
                  type="monotone"
                  dataKey="運用益"
                  stackId="1"
                  stroke="oklch(0.55 0.16 160)"
                  strokeWidth={2}
                  fill="url(#gradGain)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* 年齢別資産テーブル */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              年齢別資産一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left py-2.5 px-4 font-semibold text-muted-foreground">
                      年齢
                    </th>
                    <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">
                      総資産
                    </th>
                    <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground">
                      元本
                    </th>
                    <th className="text-right py-2.5 px-4 font-semibold text-muted-foreground">
                      運用益
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => {
                    const isTarget =
                      targetAchievedAge !== null && row.age === targetAchievedAge;
                    const isMilestone = [30, 40, 50].includes(row.age);
                    return (
                      <tr
                        key={row.age}
                        className={`border-b border-border/50 transition-colors ${
                          isTarget
                            ? "bg-accent/10"
                            : isMilestone
                            ? "bg-primary/5"
                            : i % 2 === 0
                            ? "bg-white"
                            : "bg-secondary/30"
                        }`}
                      >
                        <td className="py-2.5 px-4 font-medium">
                          <span className="tabular-nums">{row.age}歳</span>
                          {isTarget && (
                            <CheckCircle2 className="w-3 h-3 text-accent inline ml-1.5" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-primary">
                          {formatCurrency(row.totalAssets)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-accent">
                          {formatCurrency(row.investmentGain)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* リセットボタン */}
      <Button
        variant="outline"
        onClick={onReset}
        className="w-full btn-active bg-white"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        もう一度シミュレーションする
      </Button>

      {/* SNS共有ボタン */}
      <ShareCard result={result} input={input} />
    </div>
  );
}
