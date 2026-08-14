/**
 * Home — 資産形成シミュレーター
 * SNSから来たユーザーが30秒でシミュレーションできるMVP
 * スマホ最優先
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SimulatorForm from "@/components/SimulatorForm";
import SimulatorResultView from "@/components/SimulatorResult";
import type { SimulatorResult as ResultType } from "@/lib/simulator";
import { SimulatorInput, calculateSimulation } from "@/lib/simulator";
import { ChevronLeft } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState<ResultType | null>(null);
  const [lastInput, setLastInput] = useState<SimulatorInput | null>(null);

  const handleCalculate = useCallback((input: SimulatorInput) => {
    try {
      setLastInput(input);
      const calculatedResult = calculateSimulation(input);
      setResult(calculatedResult);
      // スクロール
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "計算エラーが発生しました";
      toast.error(message);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setLastInput(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              💰
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">資産形成シミュレーター</h1>
              <p className="text-xs text-gray-500">将来の資産を計画しよう</p>
            </div>
          </div>
          {result && (
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* トップメッセージ */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  あなたは何歳で1,000万円？
                </h2>
                <p className="text-sm text-gray-600">
                  30秒で将来の資産をシミュレーション
                </p>
              </div>

              {/* 入力フォーム */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8">
                <SimulatorForm onCalculate={handleCalculate} />
              </div>

              {/* 注意書き */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  ⚠️ このシミュレーションは、入力した条件に基づいた試算です。
                  実際の運用成果を保証するものではありません。
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SimulatorResultView result={result} input={lastInput!} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* フッター */}
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>© 2026 資産形成シミュレーター</p>
      </footer>
    </div>
  );
}
