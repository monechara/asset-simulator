import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { DIAGNOSIS_QUESTIONS, calculateDiagnosis } from "@/lib/diagnosis";

export default function Diagnosis() {
  const [, navigate] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const question = DIAGNOSIS_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / DIAGNOSIS_QUESTIONS.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex.toString();
    setAnswers(newAnswers);

    // 最後の質問の場合は結果画面へ
    if (currentQuestion === DIAGNOSIS_QUESTIONS.length - 1) {
      const result = calculateDiagnosis(newAnswers);
      navigate(`/result/${result.characterId}`);
    } else {
      // 次の質問へ
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-orange-50 text-gray-900 flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                💰
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                マネキャラ診断
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-600">
              {currentQuestion + 1}/{DIAGNOSIS_QUESTIONS.length}
            </span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* 質問 */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center leading-tight">
              {question.text}
            </h2>

            {/* 選択肢 */}
            <div className="space-y-3 mb-8">
              {question.answers.map((answer, idx: number) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(idx)}
                  className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 font-semibold text-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-orange-400" />
                    </div>
                    <span className="text-sm sm:text-base">{answer.text}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                戻る
              </Button>
              <div className="flex-1 text-center text-xs sm:text-sm text-gray-600 py-3">
                {currentQuestion + 1}/{DIAGNOSIS_QUESTIONS.length}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* フッター */}
      <footer className="px-4 py-4 sm:py-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600 bg-gray-50">
        <p>© 2026 マネキャラ - 笑いながらお金を学ぶ</p>
      </footer>
    </div>
  );
}
