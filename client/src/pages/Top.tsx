import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Top() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
              💰
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">マネキャラ</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                笑いながらお金を学ぶ
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight text-gray-900">
              あなたのお金の性格、
              <br />
              診断します。
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              15個の質問に答えるだけで、あなたのお金の性格タイプが分かります。
              <br />
              <span className="font-semibold text-orange-500">笑いながらお金を学ぶ</span>
            </p>
          </div>

          {/* 特徴 */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 border border-yellow-100 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">✨</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base text-gray-900">完全無料</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    登録不要、すぐに診断できます
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">📸</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                    結果をシェア可能
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    X・Threads・LINEで共有できます
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg sm:text-xl">📊</span>
                <div className="text-left">
                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                    資産シミュレーション
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
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
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-orange-300/50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              3分で診断する
            </Button>
          </motion.div>

          {/* 補足 */}
          <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            所要時間：約3分 | 12タイプから診断
          </p>
        </motion.div>
      </main>

      {/* フッター */}
      <footer className="px-4 py-4 sm:py-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600 bg-gray-50">
        <p>© 2026 マネキャラ - 笑いながらお金を学ぶ</p>
      </footer>
    </div>
  );
}
