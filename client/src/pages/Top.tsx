import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Top() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* ヘッダー */}
      <header className="px-4 py-4 sm:px-6 sm:py-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl">
              💰
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">マネキャラ</h1>
              <p className="text-xs sm:text-sm text-slate-300">
                あなたのお金の性格、診断します。
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md text-center"
        >
          {/* タイトル */}
          <div className="mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl sm:text-6xl mb-4"
            >
              🎯
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
              あなたのお金の性格、
              <br />
              診断します。
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              15個の質問に答えるだけで、あなたのお金の性格タイプが分かります。
              <br />
              診断結果はSNSでシェア可能！
            </p>
          </div>

          {/* 特徴 */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-700/50">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">✨</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base">完全無料</p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    登録不要、すぐに診断できます
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">📸</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base">
                    結果をシェア可能
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    X・Threads・LINEで共有できます
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">📊</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base">
                    資産シミュレーション
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    将来の資産まで計算できます
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA ボタン */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/diagnosis")}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              3分で診断する
            </Button>
          </motion.div>

          {/* 補足 */}
          <p className="text-xs sm:text-sm text-slate-400 mt-4 sm:mt-6">
            所要時間：約3分 | 12タイプから診断
          </p>
        </motion.div>
      </main>

      {/* フッター */}
      <footer className="px-4 py-4 sm:py-6 border-t border-slate-700/50 text-center text-xs sm:text-sm text-slate-400">
        <p>© 2026 マネキャラ - 遊びながらお金を学ぶ</p>
      </footer>
    </div>
  );
}
