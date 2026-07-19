/**
 * Top — マネキャラ トップページ
 * ピンク・クリーム色・ミントグリーンのかわいくてポップな世界観
 * スマホ最優先
 */
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function Top() {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50 to-pink-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-pink-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base">
              💰
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-gray-900">マネキャラ</span>
              <span className="text-xs text-pink-600 font-medium">笑いながらお金を学ぶ</span>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-pink-50 rounded-lg transition-all"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* ヒーローセクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          {/* アイコン */}
          <div className="mb-6 flex justify-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl sm:text-7xl"
            >
              🎯
            </motion.div>
          </div>

          {/* メインコピー */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            あなたのお金の性格、<br className="sm:hidden" />
            診断しよう！
          </h1>

          {/* サブコピー */}
          <p className="text-base sm:text-lg text-gray-700 mb-6">
            笑いながらお金を学ぶキャラクター診断
          </p>

          {/* 特徴 */}
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-6 sm:p-8 mb-8 border border-pink-100">
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold text-gray-900">完全無料</p>
                  <p className="text-sm text-gray-600">登録不要、すぐに診断できます</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="font-semibold text-gray-900">結果をシェア可能</p>
                  <p className="text-sm text-gray-600">X・Threads・LINEで共有できます</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-gray-900">資産シミュレーション</p>
                  <p className="text-sm text-gray-600">将来の資産まで計算できます</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTAボタン */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/diagnosis")}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              🐾 診断をはじめる
            </Button>
          </motion.div>

          <p className="text-xs sm:text-sm text-gray-600 mt-4">
            所要時間：約3分 | 12タイプから診断
          </p>
        </motion.div>

        {/* キャラクター紹介 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            あなたのお金の性格は？
          </h2>

          {/* キャラクター一覧（グリッド） */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {[
              { emoji: "🐵", name: "散財サル", desc: "欲しいものはすぐ買う" },
              { emoji: "🦀", name: "ドケチガニ", desc: "貯金を見ると安心" },
              { emoji: "🦝", name: "ポイ活タヌキ", desc: "ポイントを貯めるのが好き" },
              { emoji: "🐧", name: "積立ペンギン", desc: "コツコツ貯める派" },
              { emoji: "🦉", name: "投資オタクフクロウ", desc: "投資に興味がある" },
              { emoji: "🦊", name: "見栄っ張りキツネ", desc: "見た目にこだわる" },
            ].map((char, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-4 sm:p-6 text-center border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all"
              >
                <div className="text-4xl sm:text-5xl mb-2">{char.emoji}</div>
                <p className="font-bold text-gray-900 text-sm sm:text-base">{char.name}</p>
                <p className="text-xs text-gray-600 mt-1">{char.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-8 text-sm sm:text-base">
            ほか6タイプ、全12タイプから診断！
          </p>
        </motion.div>

        {/* 診断の流れ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            診断の流れ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "1", title: "15問に答える", desc: "あなたのお金の使い方について答えます" },
              { step: "2", title: "性格タイプが判定", desc: "12タイプの中からあなたのタイプが決まります" },
              { step: "3", title: "結果をシェア", desc: "SNSで結果を共有して友達と比較できます" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <p className="font-bold text-gray-900 text-sm sm:text-base mb-2">{item.title}</p>
                <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 最後のCTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-green-50 to-cyan-50 rounded-3xl p-8 sm:p-12 border border-green-200">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              笑いながらお金について学べる
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              今すぐ診断してみよう！
            </h3>
            <Button
              onClick={() => navigate("/diagnosis")}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              🐾 診断をはじめる
            </Button>
          </div>
        </motion.div>
      </main>

      {/* フッター */}
      <footer className="border-t border-pink-100 mt-16 py-8 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
          <p>© 2026 マネキャラ - 笑いながらお金を学ぶ</p>
        </div>
      </footer>
    </div>
  );
}
