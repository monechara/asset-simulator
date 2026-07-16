/**
 * Home — 資産形成シミュレーター メインページ
 * Clarity Dashboard デザイン
 * スマホファースト、デスクトップ2カラムレイアウト
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SimulatorForm from "@/components/SimulatorForm";
import SimulatorResultView from "@/components/SimulatorResult";
import type { SimulatorResult as ResultType } from "@/lib/simulator";
import { SimulatorInput, calculateSimulation } from "@/lib/simulator";
import {
  TrendingUp,
  Shield,
  ChevronRight,
  BarChart3,
  Home as HomeIcon,
  Baby,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const FUTURE_FEATURES = [
  { icon: Heart, label: "結婚シミュレーター", desc: "結婚費用・共働き効果を試算" },
  { icon: Baby, label: "子育て費用", desc: "教育費・養育費の影響を確認" },
  { icon: HomeIcon, label: "住宅購入", desc: "ローン返済と資産形成を両立" },
  { icon: Sparkles, label: "AIアドバイス", desc: "AIが最適な資産配分を提案" },
];

// デフォルト入力値でのサンプルチャートデータ（右パネルプレビュー用）
const SAMPLE_CHART_DATA = [
  { age: 30, 投資元本: 100, 運用益: 0 },
  { age: 35, 投資元本: 280, 運用益: 45 },
  { age: 40, 投資元本: 460, 運用益: 140 },
  { age: 45, 投資元本: 640, 運用益: 310 },
  { age: 50, 投資元本: 820, 運用益: 580 },
  { age: 55, 投資元本: 1000, 運用益: 980 },
  { age: 60, 投資元本: 1180, 運用益: 1560 },
  { age: 65, 投資元本: 1360, 運用益: 2380 },
];

function DashboardPreview() {
  return (
    <div className="h-full flex flex-col p-5 gap-4">
      {/* ミニ指標カード */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "30歳時点", value: "—", sub: "入力後に表示" },
          { label: "40歳時点", value: "—", sub: "入力後に表示" },
          { label: "50歳時点", value: "—", sub: "入力後に表示" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-secondary/60 rounded-lg p-2.5 text-center border border-border/60"
          >
            <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
            <p className="text-base font-bold text-muted-foreground/40 tabular-nums">{item.value}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* サンプルチャート */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide mb-2">
          資産推移イメージ（サンプル）
        </p>
        <div className="opacity-40">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={SAMPLE_CHART_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="samplePrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.38 0.12 240)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="oklch(0.38 0.12 240)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="sampleGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="oklch(0.55 0.16 160)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.015 240)" />
              <XAxis
                dataKey="age"
                tickFormatter={(v) => `${v}歳`}
                tick={{ fontSize: 9, fill: "oklch(0.65 0.04 240)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="投資元本"
                stackId="1"
                stroke="oklch(0.38 0.12 240)"
                strokeWidth={1.5}
                fill="url(#samplePrincipal)"
              />
              <Area
                type="monotone"
                dataKey="運用益"
                stackId="1"
                stroke="oklch(0.55 0.16 160)"
                strokeWidth={1.5}
                fill="url(#sampleGain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">左のフォームを入力</span>して
          あなたの将来資産を計算しましょう
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [result, setResult] = useState<ResultType | null>(null);
  const [lastInput, setLastInput] = useState<SimulatorInput | null>(null);

  const handleCalculate = useCallback((input: SimulatorInput) => {
    const res = calculateSimulation(input);
    setLastInput(input);
    setResult(res);
    // スクロールトップ（モバイル）
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("シミュレーション完了！", {
      description: "結果をご確認ください",
    });
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setLastInput(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <img
                src="/manus-storage/logo-icon_cfd3bf72.png"
                alt="logo"
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <TrendingUp className="w-4 h-4 text-primary-foreground hidden" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">資産形成シミュレーター</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">数字で未来を、今日から。</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">無料・登録不要</span>
          </div>
        </div>
      </header>

      {/* ヒーローセクション（結果表示時は非表示） */}
      <AnimatePresence>
        {!result && (
          <motion.section
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, oklch(0.22 0.08 240) 0%, oklch(0.30 0.10 240) 50%, oklch(0.25 0.09 220) 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(/manus-storage/hero-bg_fb7f6636.png)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                  <BarChart3 className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs text-white font-medium">NISA・iDeCo対応</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                  将来の資産、<br className="sm:hidden" />
                  <span className="text-emerald-300">今日から計画</span>しよう
                </h1>
                <p className="text-sm text-white/80 max-w-md leading-relaxed">
                  毎月の積立と複利運用で、あなたの資産がどう育つかをシミュレーション。
                  30歳・40歳・50歳時点の資産額と目標達成年齢を即座に計算します。
                </p>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8 lg:items-start">
          {/* 左カラム: 入力フォーム */}
          <div className="lg:sticky lg:top-20">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SimulatorForm onCalculate={handleCalculate} />
                </motion.div>
              ) : (
                <motion.div
                  key="form-mini"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block"
                >
                  {/* デスクトップ: 入力サマリーカード */}
                  <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">入力条件</p>
                      <button
                        onClick={handleReset}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        変更する <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {lastInput && (
                      <div className="space-y-2 text-xs">
                        {[
                          { label: "現在年齢", value: `${lastInput.currentAge}歳` },
                          { label: "現在の資産", value: `${lastInput.currentAssets.toLocaleString()}円` },
                          { label: "毎月の投資", value: `${lastInput.monthlyInvestment.toLocaleString()}円` },
                          { label: "ボーナス投資", value: `${lastInput.annualBonusInvestment.toLocaleString()}円/年` },
                          { label: "想定利回り", value: `${lastInput.annualReturnRate}%` },
                          { label: "目標資産", value: `${lastInput.targetAssets.toLocaleString()}円` },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium tabular-nums">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 将来機能プレビュー */}
                  <div className="mt-4 bg-white rounded-xl border border-border shadow-sm p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      近日公開予定
                    </p>
                    <div className="space-y-2">
                      {FUTURE_FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                          <button
                            key={f.label}
                            onClick={() => toast.info(`${f.label}は近日公開予定です`)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-left group"
                          >
                            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{f.label}</p>
                              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 右カラム: 結果 or プレースホルダー */}
          <div className={result ? "mt-0 lg:mt-0" : "hidden lg:block"}>
            <AnimatePresence mode="wait">
              {result && lastInput ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  <SimulatorResultView result={result} input={lastInput} onReset={handleReset} />
                </motion.div>
              ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex flex-col bg-white rounded-xl border border-border shadow-sm min-h-[400px]"
              >
                <DashboardPreview />
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* モバイル: 将来機能 */}
        {!result && (
          <div className="mt-8 lg:hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              近日公開予定の機能
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {FUTURE_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.label}
                    onClick={() => toast.info(`${f.label}は近日公開予定です`)}
                    className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-border shadow-sm hover:border-primary/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{f.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-12 border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">資産形成シミュレーター</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              ※本シミュレーターは参考値です。実際の運用成果を保証するものではありません。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
