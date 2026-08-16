/**
 * Home — 資産形成シミュレーター
 * SNSから来たユーザーが30秒でシミュレーションできるMVP
 * スマホ最優先
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SimulatorForm from "@/components/SimulatorForm";
import SimulatorResultView from "@/components/SimulatorResult";
import type { SimulatorResult as ResultType } from "@/lib/simulator";
import { SimulatorInput, calculateSimulation } from "@/lib/simulator";
import { ChevronLeft } from "lucide-react";

/**
 * アイコン方針: 絵文字ではなく、strokeWidth=1.8・round linecap・24px viewBoxの
 * オリジナル線画SVGで統一。白基調の画面に、青・ミント・アンバーを小さなアクセントとして使う。
 */
type LineIconProps = { className?: string };

function BrandMarkIcon({ className = "" }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 8.5h8M8 12h8M8 15.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CompareIcon({ className = "" }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4.5 19.5V5.5M4.5 19.5h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.5 15 3.2-3.4 2.5 2.1 4.2-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SavingsIcon({ className = "" }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7M4 11h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 14h4M12 12.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GrowthIcon({ className = "" }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4.5 19.5V5.5M4.5 19.5h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7 15.5 3.2-3.2 2.4 2 4.6-5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 8.5h2.7v2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NoticeIcon({ className = "" }: LineIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3.8 20 19H4l8-15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4.5M12 16.5v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [result, setResult] = useState<ResultType | null>(null);
  const [lastInput, setLastInput] = useState<SimulatorInput | null>(null);
  const [isSimpleResult, setIsSimpleResult] = useState(false);

  // SNSや外部リンクから簡易入力へ直接来た場合だけ、フォーム先頭を初期表示する。
  // 初回のレイアウト計算やフォント読み込みより後に、固定ヘッダー分を差し引いた座標へ移動する。
  // 通常のトップページと既存の「無料でシミュレーションする」導線には影響させない。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDirectSimple = params.get("start") === "simple" || window.location.pathname === "/simple";
    if (!isDirectSimple) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const scrollToSimpleForm = () => {
      if (cancelled) return;
      const formEl = document.getElementById("simulator-form-container");
      if (!formEl) {
        if (attempts < 20) {
          attempts += 1;
          window.requestAnimationFrame(scrollToSimpleForm);
        }
        return;
      }

      const headerOffset = 80;
      const targetTop = Math.max(0, formEl.getBoundingClientRect().top + window.scrollY - headerOffset);
      window.scrollTo({ top: targetTop, behavior: "auto" });
    };

    const scheduleScroll = () => {
      timer = window.setTimeout(() => {
        scrollToSimpleForm();
        // AnimatePresenceやフォント反映後のレイアウト変化にも追従する。
        window.requestAnimationFrame(scrollToSimpleForm);
      }, 0);
    };

    if (document.readyState === "complete") {
      scheduleScroll();
    } else {
      window.addEventListener("load", scheduleScroll, { once: true });
      scheduleScroll();
    }

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("load", scheduleScroll);
    };
  }, []);

  const handleCalculate = useCallback((input: SimulatorInput, isSimple?: boolean) => {
    try {
      // FormのdraftやlifeEvents配列をそのまま保持せず、送信時点の入力を
      // 結果表示と計算の両方で共有する不変スナップショットにする。
      // これにより、詳細設定の再計算前に古いsimple結果を参照する経路を作らない。
      const submittedInput: SimulatorInput = {
        ...input,
        lifeEvents: input.lifeEvents.map((event) => ({
          ...event,
          housingLoan: event.housingLoan ? { ...event.housingLoan } : undefined,
        })),
      };
      const calculatedResult = calculateSimulation(submittedInput);
      setLastInput(submittedInput);
      setIsSimpleResult(Boolean(isSimple));
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
              <BrandMarkIcon className="w-5 h-5" />
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
              {/* スタート画面 / 導入部 */}
              <div className="mb-8 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide">
                  <CompareIcon className="w-4 h-4" />
                  <span>統計データと比較できる</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  あなたの老後、いくら必要？
                </h2>
                <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
                  統計上の目安と比べながら、あなたに必要な老後資金をシミュレーション
                </p>

                {/* 3つの特徴 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6 text-left">
                  <div className="bg-white/90 backdrop-blur border border-blue-100/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                        <CompareIcon className="w-5 h-5" />
                        <span>統計上の目安と比較</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        あなたの老後の生活費や年金を、統計上の目安と比較できます。
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur border border-emerald-100/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                        <SavingsIcon className="w-5 h-5" />
                        <span>必要な老後資金が分かる</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        現在の資産や積立額などから、老後に必要な資金をシミュレーションできます。
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur border border-amber-100/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                        <GrowthIcon className="w-5 h-5" />
                        <span>今から必要な積立額が分かる</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        毎月の積立額やボーナス投資をもとに、将来どのくらい資産を準備できるか確認できます。
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTAボタン */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const formEl = document.getElementById("simulator-form-container");
                      formEl?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold text-base rounded-2xl shadow-md hover:from-blue-700 hover:to-emerald-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>無料でシミュレーションする</span>
                    <span className="text-lg">↓</span>
                  </button>
                  <p className="mt-2 text-xs text-gray-500">会員登録不要・30秒で簡単にお試しいただけます</p>
                </div>
              </div>

              {/* 入力フォーム */}
              <div id="simulator-form-container" className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 scroll-mt-20">
                <SimulatorForm onCalculate={handleCalculate} initialInput={lastInput ?? undefined} />
              </div>

              {/* 注意書き */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <NoticeIcon className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
                  <span>このシミュレーションは、入力した条件に基づいた試算です。実際の運用成果を保証するものではありません。</span>
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
              <SimulatorResultView
                result={result}
                input={lastInput!}
                onReset={handleReset}
                isSimpleResult={isSimpleResult}
                onUpdateInput={(updatedInput) => {
                  setLastInput(updatedInput);
                  setResult(null); // 結果を解除して詳細入力フォームを開く
                  toast.success("詳細設定画面を開きました。必要項目を調整してください！");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
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
