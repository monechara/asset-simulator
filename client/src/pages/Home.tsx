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
import { trackFunnelEvent } from "@/lib/funnelAnalytics";
import SiteFooter from "@/components/SiteFooter";

/**
 * デザイン方針: Instagram投稿と揃う淡いクリーム地、青緑を主役に黄色・ピンク・水色を小さく差す。ファーストビューは短く、見出しとCTAを最優先にする。アイコンはstrokeWidth=1.8の丸い線画SVGで統一する。
 */
type LineIconProps = { className?: string };

function BrandMarkIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 8.5h8M8 12h8M8 15.5h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CompareIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 19.5V5.5M4.5 19.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.5 15 3.2-3.4 2.5 2.1 4.2-5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SavingsIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="7"
        width="16"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7M4 11h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 14h4M12 12.5v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GrowthIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 19.5V5.5M4.5 19.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7 15.5 3.2-3.2 2.4 2 4.6-5.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 8.5h2.7v2.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EducationIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3.5 9 8.5-4 8.5 4-8.5 4-8.5-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 11.2v4.1c2.7 2.1 7.3 2.1 10 0v-4.1M20.5 9v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 10.5 8-6 8 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20.5v-6h5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RetirementIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle
        cx="16"
        cy="8.5"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 19c.4-3.5 2-5.3 4.5-5.3s4.1 1.8 4.5 5.3M12.5 19c.3-2.8 1.6-4.4 3.7-4.4 2 0 3.1 1.4 3.3 4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoticeIcon({ className = "" }: LineIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.8 20 19H4l8-15.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4.5M12 16.5v.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type HomeProps = { forceSimpleStart?: boolean };

export default function Home({ forceSimpleStart = false }: HomeProps) {
  const [result, setResult] = useState<ResultType | null>(null);
  const [lastInput, setLastInput] = useState<SimulatorInput | null>(null);
  const [isSimpleResult, setIsSimpleResult] = useState(false);

  // SNSや外部リンクから簡易入力へ直接来た場合だけ、フォーム先頭を初期表示する。
  // 初回のレイアウト計算やフォント読み込みより後に、固定ヘッダー分を差し引いた座標へ移動する。
  // 通常のトップページと既存の「無料でシミュレーションする」導線には影響させない。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDirectSimple =
      forceSimpleStart ||
      params.get("start") === "simple" ||
      window.location.pathname.replace(/\/$/, "") === "/simple";
    if (!isDirectSimple) return;

    let cancelled = false;
    let attempts = 0;
    let hasTrackedStart = false;
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
      const targetTop = Math.max(
        0,
        formEl.getBoundingClientRect().top + window.scrollY - headerOffset
      );
      window.scrollTo({ top: targetTop, behavior: "auto" });
      if (!hasTrackedStart) {
        hasTrackedStart = true;
        trackFunnelEvent("simple_input_start");
      }
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

  const handleCalculate = useCallback(
    (input: SimulatorInput, isSimple?: boolean) => {
      try {
        // FormのdraftやlifeEvents配列をそのまま保持せず、送信時点の入力を
        // 結果表示と計算の両方で共有する不変スナップショットにする。
        // これにより、詳細設定の再計算前に古いsimple結果を参照する経路を作らない。
        const submittedInput: SimulatorInput = {
          ...input,
          lifeEvents: input.lifeEvents.map(event => ({
            ...event,
            housingLoan: event.housingLoan
              ? { ...event.housingLoan }
              : undefined,
          })),
        };
        const calculatedResult = calculateSimulation(submittedInput);
        trackFunnelEvent(
          isSimple ? "simple_result_view" : "detailed_result_view"
        );
        setLastInput(submittedInput);
        setIsSimpleResult(Boolean(isSimple));
        setResult(calculatedResult);
        // スクロール
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "計算エラーが発生しました";
        toast.error(message);
      }
    },
    []
  );

  const handleReset = useCallback(() => {
    setResult(null);
    setLastInput(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
              <BrandMarkIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">
                資産形成シミュレーター
              </h1>
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
      <main className="mx-auto max-w-4xl px-3 py-2 sm:px-6 sm:py-4">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ファーストビュー：家計全体を30秒で確認できる入口 */}
              <section className="relative mb-3 overflow-visible px-2 pb-3 pt-2 sm:px-8 sm:pt-5">
                <div className="relative z-10 max-w-2xl pr-0 sm:pr-48">
                  <div className="inline-flex items-center rounded-full border-2 border-[#b8e3d5] bg-white px-3 py-1 text-xs font-black tracking-wide text-[#078c72] shadow-sm">
                    無料・登録不要｜約30秒
                  </div>
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_9rem] items-center gap-1 sm:block">
                    <h2 className="min-w-0 text-[1.9rem] font-black leading-[1.08] tracking-tight text-[#10243a] sm:max-w-xl sm:text-5xl">
                      あなたの家計、
                      <br />
                      <span className="text-[#078c72]">
                        将来のお金は
                        <br />
                        足りる？
                      </span>
                    </h2>
                    <div className="relative flex h-36 w-36 items-center justify-center sm:absolute sm:right-1 sm:top-20 sm:h-40 sm:w-44">
                      <img
                        src="/manus-storage/3BCF6477-5B38-4B76-8DB8-73822B64BF25(16)_a7f7d9be.png"
                        alt=""
                        className="relative z-10 h-32 w-36 object-contain object-bottom sm:h-36 sm:w-40"
                      />
                      <img
                        src="/manus-storage/07_family_b2662bac.png"
                        alt=""
                        className="pointer-events-none absolute -left-3 top-1 z-0 h-9 w-10 object-contain"
                      />
                      <img
                        src="/manus-storage/08_graph_da2b1368.png"
                        alt=""
                        className="pointer-events-none absolute -right-1 top-7 z-0 h-9 w-9 object-contain"
                      />
                      <img
                        src="/manus-storage/09_house_7a2ef6b7.png"
                        alt=""
                        className="pointer-events-none absolute -right-1 bottom-2 z-0 h-9 w-9 object-contain"
                      />
                      <img
                        src="/manus-storage/10_yen_0ff05e07.png"
                        alt=""
                        className="pointer-events-none absolute -left-1 bottom-1 z-0 h-9 w-9 object-contain"
                      />
                      <img
                        src="/manus-storage/01_yellow_star_4664eedb.png"
                        alt=""
                        className="pointer-events-none absolute left-7 -top-2 z-0 h-7 w-7 object-contain"
                      />
                      <img
                        src="/manus-storage/02_pink_star_f20fd6d8.png"
                        alt=""
                        className="pointer-events-none absolute left-1 top-5 z-0 h-6 w-6 object-contain"
                      />
                      <img
                        src="/manus-storage/03_mint_plus_e2a6cd90.png"
                        alt=""
                        className="pointer-events-none absolute right-2 -top-2 z-0 h-7 w-7 object-contain"
                      />
                      <img
                        src="/manus-storage/04_yellow_dots_dd29dbae.png"
                        alt=""
                        className="pointer-events-none absolute -right-2 bottom-8 z-0 h-7 w-7 object-contain"
                      />
                      <img
                        src="/manus-storage/05_yellow_marks_ed2d81a5.png"
                        alt=""
                        className="pointer-events-none absolute -left-1 bottom-8 z-0 h-7 w-7 object-contain"
                      />
                      <img
                        src="/manus-storage/06_yellow_dot_4e0ded55.png"
                        alt=""
                        className="pointer-events-none absolute right-7 top-3 z-0 h-3 w-3 object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-3 max-w-[20rem] text-[13px] leading-6 text-slate-600 sm:max-w-lg sm:text-base">
                    年収・貯金・家族構成から、
                    <br />
                    将来の資産をかんたんチェック
                  </p>
                  <div className="relative mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <button
                      onClick={() => {
                        trackFunnelEvent("simple_input_start");
                        const formEl = document.getElementById(
                          "simulator-form-container"
                        );
                        formEl?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="w-full whitespace-nowrap rounded-2xl border-b-4 border-[#056a59] bg-[#078c72] px-4 py-3.5 text-[15px] font-black text-white shadow-[0_8px_16px_rgba(7,140,114,0.2)] transition-transform hover:bg-[#06765f] active:translate-y-0.5 active:border-b-2 sm:w-auto sm:min-w-[18rem] sm:px-6 sm:text-base"
                    >
                      30秒でシミュレーションする{" "}
                      <span aria-hidden="true">→</span>
                    </button>
                    <span className="absolute -bottom-11 right-0 rounded-[1.25rem] border-2 border-[#b8e3d5] bg-white px-2.5 py-1 text-center text-[10px] font-black leading-4 text-[#078c72] shadow-sm sm:-bottom-12 sm:right-0">
                      かんたん入力から
                      <br />
                      詳しく設定まで <b className="text-[#e887aa]">2STEP!</b>
                    </span>
                  </div>
                  <div className="mt-3 space-y-0.5 pr-36 text-xs font-semibold leading-5 text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span>
                      まずは少ない項目だけ
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-emerald-600">✓</span>
                      あとから教育・住宅・老後まで詳しく設定できます
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-3 px-2 py-3 sm:px-8 sm:py-5">
                <div className="text-center">
                  <h3 className="whitespace-nowrap text-[17px] font-black leading-7 tracking-tight text-[#10243a] sm:text-xl">
                    <span className="mr-2 text-[#078c72]">＼</span>
                    このシミュレーションでわかること
                    <span className="ml-2 text-[#078c72]">／</span>
                  </h3>
                </div>
                <div className="mx-0 mt-3 grid grid-cols-3 divide-x divide-[#e4eee9] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-[0_4px_16px_rgba(31,97,80,0.06)]">
                  {[
                    [
                      "/manus-storage/education_0880faf1.png",
                      "教育費",
                      "足りる？",
                      "text-[#39a980]",
                      "bg-[#e7f5ee]",
                    ],
                    [
                      "/manus-storage/housing_d87c99a1.png",
                      "住宅",
                      "買っても大丈夫？",
                      "text-[#e6b51e]",
                      "bg-[#fff5cf]",
                    ],
                    [
                      "/manus-storage/retirement_bd8ef11b.png",
                      "老後",
                      "いくら残る？",
                      "text-[#e887aa]",
                      "bg-[#fde9f0]",
                    ],
                  ].map(([icon, title, subtitle, tone, iconBg]) => (
                    <div
                      key={title as string}
                      className="flex min-w-0 flex-col items-center px-1.5 py-3 text-center"
                    >
                      <div
                        className={`mb-1.5 rounded-full p-1.5 ${iconBg as string}`}
                      >
                        <img
                          src={icon as string}
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <p
                        className={`text-[12px] font-black leading-5 ${tone as string}`}
                      >
                        {title}
                      </p>
                      <p className="text-[11px] font-black leading-4 text-[#10243a]">
                        {subtitle}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 既存コンテンツはファーストビューの下で維持 */}
              <div className="grid grid-cols-1 gap-2.5 text-left">
                {[
                  {
                    icon: "/manus-storage/statistics_256b62d1.png",
                    title: "統計上の目安と比較",
                    text: "あなたの老後の生活費や年金を、統計上の目安と比較できます。",
                    tone: "text-blue-700",
                    border: "border-blue-100/80",
                    iconBg: "bg-[#e7f5ee]",
                  },
                  {
                    icon: "/manus-storage/retirement-fund_d4791d18.png",
                    title: "必要な老後資金が分かる",
                    text: "現在の資産や積立額などから、老後に必要な資金をシミュレーションできます。",
                    tone: "text-emerald-700",
                    border: "border-emerald-100/80",
                    iconBg: "bg-[#fff5cf]",
                  },
                  {
                    icon: "/manus-storage/contribution_feb14823.png",
                    title: "今から必要な積立額が分かる",
                    text: "毎月の積立額やボーナス投資から、将来の準備額を確認できます。",
                    tone: "text-amber-700",
                    border: "border-amber-100/80",
                    iconBg: "bg-[#fde9f0]",
                  },
                ].map(feature => (
                  <div
                    key={feature.title}
                    className={`flex items-center gap-3 rounded-2xl border ${feature.border} bg-white px-3 py-2.5 shadow-sm`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${feature.iconBg}`}
                    >
                      <img
                        src={feature.icon}
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`mb-0.5 flex items-center gap-1.5 text-sm font-black ${feature.tone}`}
                      >
                        <span>{feature.title}</span>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        {feature.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 入力フォーム */}
              <div
                id="simulator-form-container"
                className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8 scroll-mt-20"
              >
                <SimulatorForm
                  onCalculate={handleCalculate}
                  initialInput={lastInput ?? undefined}
                />
              </div>

              {/* 注意書き */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <NoticeIcon className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
                  <span>
                    このシミュレーションは、入力した条件に基づいた試算です。実際の運用成果を保証するものではありません。
                  </span>
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
                onUpdateInput={updatedInput => {
                  trackFunnelEvent("detailed_input_start");
                  setLastInput(updatedInput);
                  setResult(null); // 結果を解除して詳細入力フォームを開く
                  toast.success(
                    "詳細設定画面を開きました。必要項目を調整してください！"
                  );
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
