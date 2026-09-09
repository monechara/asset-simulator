/**
 * ShareCard — SNS共有用「あなたの診断結果」カード
 * html2canvasでCanvas化 → PNG生成 → X/LINE共有
 * Clarity Dashboard デザイン準拠
 */
import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  Download,
  X as XIcon,
  Loader2,
  TrendingUp,
  Trophy,
  Target,
  Calendar,
} from "lucide-react";
import type { SimulatorResult, SimulatorInput } from "@/lib/simulator";
import { formatCurrency } from "@/lib/simulator";

// LINE アイコン SVG
const LineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

// X (Twitter) アイコン SVG
const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface Props {
  result: SimulatorResult;
  input: SimulatorInput;
}

/** Canvas化するカードのUI（DOM要素として描画） */
function ResultCardDOM({
  result,
  input,
  cardRef,
}: {
  result: SimulatorResult;
  input: SimulatorInput;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const gainRatio =
    result.principalTotal > 0
      ? ((result.investmentGainTotal / result.principalTotal) * 100).toFixed(1)
      : "0";

  const milestones = result.yearlyRecords
    .filter((r) => [30, 40, 50].includes(r.age) && r.age >= input.currentAge)
    .map((r) => ({ age: r.age, value: r.totalAssets }));

  return (
    <div
      ref={cardRef}
      style={{
        width: "600px",
        background: "linear-gradient(135deg, #1a2f4e 0%, #0f2040 50%, #162840 100%)",
        padding: "40px",
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* 背景装飾グリッド */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      {/* 右下グロー */}
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <div>
          <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
            資産形成シミュレーター
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>
            あなたの診断結果
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(16,185,129,0.2)",
            border: "1px solid rgba(16,185,129,0.4)",
            borderRadius: 20,
            padding: "4px 12px",
            color: "#10b981",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {input.currentAge}歳スタート
        </div>
      </div>

      {/* 目標達成バナー */}
      {result.targetAchievedAge ? (
        <div
          style={{
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 22 }}>🏆</div>
          <div>
            <div style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>
              目標達成予定：{result.targetAchievedAge}歳（あと{result.targetAchievedAge - input.currentAge}年）
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3 }}>
              目標 {formatCurrency(input.targetAssets)} を達成できます
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 22 }}>📊</div>
          <div>
            <div style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>
              80歳時点の資産予測
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3 }}>
              投資額・利回りを調整して目標を目指しましょう
            </div>
          </div>
        </div>
      )}

      {/* 主要指標 3列 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "80歳時点の総資産", value: result.finalAssets, color: "#60a5fa" },
          { label: "投資元本合計", value: result.principalTotal, color: "#10b981" },
          { label: `運用益（元本比+${gainRatio}%）`, value: result.investmentGainTotal, color: "#10b981" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "14px 12px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginBottom: 6, lineHeight: 1.3 }}>
              {item.label}
            </div>
            <div style={{ color: item.color, fontSize: 17, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(item.value)}
            </div>
          </div>
        ))}
      </div>

      {/* マイルストーン */}
      {milestones.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            年齢別マイルストーン
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {milestones.map((m) => (
              <div
                key={m.age}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  padding: "12px 10px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 5 }}>
                  {m.age}歳時点
                </div>
                <div style={{ color: "#ffffff", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(m.value!)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 入力条件サマリー */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 24,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
          シミュレーション条件
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
          {[
            { label: "現金資産", value: formatCurrency(input.currentCashAssets) },
            { label: "投資資産", value: formatCurrency(input.currentInvestmentAssets) },
            { label: "毎月の積立", value: `${input.monthlyInvestmentContribution.toLocaleString()}円` },

            { label: "想定利回り", value: `年率 ${input.annualReturnRate}%` },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{item.label}</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* フッター */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
          ※本シミュレーターは参考値です。実際の運用成果を保証するものではありません。
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600 }}>
          数字で未来を、今日から。
        </div>
      </div>
    </div>
  );
}

export default function ShareCard({ result, input }: Props) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      setImageUrl(url);
      return url;
    } catch (e) {
      console.error("画像生成エラー:", e);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    // モーダルが開いた後にDOMが確定してから生成
    setTimeout(async () => {
      await generateImage();
    }, 300);
  }, [generateImage]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `資産診断結果_${input.currentAge}歳_${input.annualReturnRate}%.png`;
    a.click();
  }, [imageUrl, input]);

  const shareText = result.targetAchievedAge
    ? `【資産形成シミュレーター】\n${input.currentAge}歳から毎月${input.monthlyInvestmentContribution.toLocaleString()}円を年率${input.annualReturnRate}%で運用すると、${result.targetAchievedAge}歳で目標達成！\n80歳時点の総資産：${formatCurrency(result.finalAssets)}（うち運用益${formatCurrency(result.investmentGainTotal)}）\n\n#資産形成 #NISA #投資 #複利`
    : `【資産形成シミュレーター】\n${input.currentAge}歳から毎月${input.monthlyInvestmentContribution.toLocaleString()}円を年率${input.annualReturnRate}%で運用すると、80歳時点の総資産は${formatCurrency(result.finalAssets)}に！\n運用益：${formatCurrency(result.investmentGainTotal)}\n\n#資産形成 #NISA #投資 #複利`;

  const handleShareX = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [shareText]);

  const handleShareLine = useCallback(() => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [shareText]);

  return (
    <>
      <Button
        onClick={handleOpen}
        className="w-full btn-active font-semibold gap-2"
        style={{ background: "oklch(0.38 0.12 240)", color: "oklch(0.97 0.005 240)" }}
      >
        <Share2 className="w-4 h-4" />
        診断結果を共有する
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[680px] w-full p-0 overflow-hidden bg-white">
          {/* モバイルでスクロール可能にする */}
          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              診断結果を共有する
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 sm:px-6 pb-6 space-y-4 mt-4 max-h-[80vh] overflow-y-auto">
            {/* カードプレビュー */}
            <div
              className="relative rounded-xl overflow-hidden border border-border shadow-sm"
              style={{ background: "#0f2040" }}
            >
              {/* スケールコンテナ: 600px → 約312px (52%) */}
              <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    transform: "scale(0.52)",
                    transformOrigin: "top left",
                    width: "600px",
                    /* 高さは内容に依存するため自動 */
                  }}
                >
                <ResultCardDOM result={result} input={input} cardRef={cardRef} />
              </div>
              </div>

              {/* 生成中オーバーレイ */}
              <AnimatePresence>
                {generating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm">画像を生成中...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 共有テキストプレビュー */}
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">共有テキスト（X/LINE）</p>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {shareText}
              </p>
            </div>

            {/* アクションボタン */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* X (Twitter) 共有 */}
              <button
                onClick={handleShareX}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 btn-active text-white"
                style={{ background: "#000000" }}
              >
                <XTwitterIcon />
                Xでシェア
              </button>

              {/* LINE 共有 */}
              <button
                onClick={handleShareLine}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 btn-active text-white"
                style={{ background: "#06C755" }}
              >
                <LineIcon />
                LINEで送る
              </button>

              {/* 画像ダウンロード */}
              <button
                onClick={imageUrl ? handleDownload : generateImage}
                disabled={generating}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 btn-active border border-border bg-white text-foreground hover:bg-secondary disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                画像を保存
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ※「画像を保存」してSNSに投稿するか、テキストをそのままシェアできます
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
