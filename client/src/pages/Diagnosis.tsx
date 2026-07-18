import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* ヘッダー */}
      <header className="px-4 py-4 sm:px-6 sm:py-6 border-b border-slate-700/50 sticky top-0 z-10 bg-slate-900/80 backdrop-blur">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
                💰
              </div>
              <span className="text-sm sm:text-base font-semibold">
                マネキャラ診断
              </span>
            </div>
            <span className="text-xs sm:text-sm text-slate-400">
              {currentQuestion + 1} / {DIAGNOSIS_QUESTIONS.length}
            </span>
          </div>
          {/* プログレスバー */}
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* 質問 */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sm:p-6 border border-slate-700/50">
                <h2 className="text-lg sm:text-xl font-bold leading-relaxed">
                  Q{currentQuestion + 1}. {question.text}
                </h2>
              </div>

              {/* 回答選択肢 */}
              <div className="space-y-2 sm:space-y-3">
                {question.answers.map((answer, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    onClick={() => handleAnswer(index)}
                    className="w-full text-left p-3 sm:p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100" />
                      </div>
                      <span className="text-sm sm:text-base leading-relaxed">
                        {answer.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ナビゲーションボタン */}
          <div className="mt-6 sm:mt-8 flex gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="flex-1 py-2.5 sm:py-3"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">戻る</span>
            </Button>
            <div className="flex-1 flex items-center justify-center text-xs sm:text-sm text-slate-400">
              {currentQuestion + 1} / {DIAGNOSIS_QUESTIONS.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
