/**
 * Simulator — 資産形成シミュレーター メインページ
 * マネキャラブランド統一版
 * スマホファースト、デスクトップ2カラムレイアウト
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import SimulatorForm from "@/components/SimulatorForm";
import SimulatorResultView from "@/components/SimulatorResult";
import type { SimulatorResult as ResultType } from "@/lib/simulator";
import { SimulatorInput, calculateSimulation } from "@/lib/simulator";
import {
  TrendingUp,
  ChevronLeft,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
            className="bg-pink-50 rounded-2xl p-2.5 text-center border border-pink-100"
          >
            <p className="text-[10px] text-gray-600 mb-1">{item.label}</p>
            <p className="text-base font-bold text-gray-400 tabular-nums">{item.value}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* サンプルチャート */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-2">
          資産推移イメージ（サンプル）
        </p>
        <div className="opacity-40">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={SAMPLE_CHART_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="samplePrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="sampleGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A8E6CF" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#A8E6CF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="age"
                tickFormatter={(v) => `${v}歳`}
                tick={{ fontSize: 9, fill: "#999" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="投資元本"
                stackId="1"
                stroke="#FFD700"
                fill="url(#samplePrincipal)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="運用益"
                stackId="1"
                stroke="#A8E6CF"
                fill="url(#sampleGain)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* マイルストーン */}
      <div className="space-y-2 text-[11px]">
        {[
          { age: 30, label: "30歳" },
          { age: 40, label: "40歳" },
          { age: 50, label: "50歳" },
        ].map((m) => (
          <div key={m.age} className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-900">{m.label}</span>
            <span className="text-gray-500">—</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Simulator() {
  const [, navigate] = useLocation();
  const [input, setInput] = useState<SimulatorInput>({
    currentAge: 30,
    currentAssets: 500000,
    monthlyIncome: 300000,
    monthlyExpenses: 200000,
    monthlyInvestment: 50000,
    annualBonusInvestment: 300000,
    annualReturnRate: 5,
    targetAssets: 10000000,
  });

  const [result, setResult] = useState<ResultType | null>(null);

  const handleCalculate = useCallback(() => {
    try {
      const calculated = calculateSimulation(input);
      setResult(calculated);
      toast.success("シミュレーション完了！");
    } catch (error) {
      toast.error("計算に失敗しました");
    }
  }, [input]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-pink-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-pink-100 shadow-sm px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/result/spender")}
                className="p-1 hover:bg-gray-100 rounded-full transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                💰
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                資産形成シミュレーター
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左パネル：入力フォーム */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-3xl shadow-lg border border-pink-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-500" />
                シミュレーション条件
              </h2>
              <SimulatorForm
                onCalculate={(newInput) => {
                  setInput(newInput);
                  const calculated = calculateSimulation(newInput);
                  setResult(calculated);
                }}
              />
            </div>
          </motion.div>

          {/* 右パネル：結果プレビュー */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl shadow-lg border border-pink-100 overflow-hidden h-full">
              {result ? (
                <SimulatorResultView result={result} input={input} onReset={() => setResult(null)} />
              ) : (
                <DashboardPreview />
              )}
            </div>
          </motion.div>
        </div>

        {/* 将来機能 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            将来追加予定の機能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: "💍", label: "結婚シミュレーター", desc: "結婚費用・共働き効果を試算" },
              { emoji: "👶", label: "子育て費用", desc: "教育費・養育費の影響を確認" },
              { emoji: "🏠", label: "住宅購入", desc: "ローン返済と資産形成を両立" },
              { emoji: "🤖", label: "AIアドバイス", desc: "AIが最適な資産配分を提案" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-4 border border-pink-100 hover:border-pink-300 transition-all cursor-not-allowed opacity-60"
              >
                <div className="text-3xl mb-2">{feature.emoji}</div>
                <p className="font-semibold text-gray-900 text-sm">{feature.label}</p>
                <p className="text-xs text-gray-600 mt-1">{feature.desc}</p>
                <p className="text-xs text-pink-600 font-semibold mt-2">近日公開</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* フッター */}
      <footer className="border-t border-pink-100 mt-16 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
          <p>© 2026 マネキャラ - 笑いながらお金を学ぶ</p>
        </div>
      </footer>
    </div>
  );
}
