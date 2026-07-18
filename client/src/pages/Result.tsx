import { useParams, useLocation } from "wouter";
import { getCharacterType } from "@/lib/characters";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Share2, Download, Home } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export default function Result() {
  const { characterId } = useParams<{ characterId: string }>();
  const [, navigate] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const character = getCharacterType(characterId || "");

  if (!character) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">キャラクターが見つかりません</p>
          <Button onClick={() => navigate("/")} variant="default">
            トップへ戻る
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `manekara-${character.id}.png`;
      link.click();
      toast.success("画像をダウンロードしました");
    } catch (error) {
      toast.error("画像の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareX = () => {
    const text = `私のお金の性格は「${character.name}」です！\n"${character.catchphrase}"\n\nあなたのお金の性格は？\n#マネキャラ診断`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShareLine = () => {
    const text = `私のお金の性格は「${character.name}」です！\n"${character.catchphrase}"\n\nあなたのお金の性格は？`;
    const url = `https://line.me/R/msg/text/${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* ヘッダー */}
      <header className="px-4 py-4 sm:px-6 sm:py-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
              💰
            </div>
            <span className="text-sm sm:text-base font-semibold">
              診断結果
            </span>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">
          {/* 結果カード */}
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mb-6 sm:mb-8 shadow-2xl"
          >
            {/* キャラクター */}
            <div className="text-center mb-6">
              <div className="text-6xl sm:text-7xl mb-3">{character.emoji}</div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                No.{String(character.no).padStart(3, "0")} {character.name}
              </h1>
              <p className="text-sm sm:text-base text-emerald-400 italic">
                「{character.catchphrase}」
              </p>
            </div>

            {/* 統計情報 */}
            <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600/50">
              <p className="text-xs sm:text-sm text-slate-300 mb-2">
                全国の診断者
              </p>
              <p className="text-lg sm:text-xl font-bold text-emerald-400">
                {character.nationalPercentage}%
              </p>
            </div>

            {/* オリジナル指標 */}
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm">💸 誘惑耐性</span>
                  <span className="text-xs sm:text-sm font-semibold">
                    {"★".repeat(character.temptationResistance)}
                    {"☆".repeat(5 - character.temptationResistance)}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full"
                    style={{
                      width: `${(character.temptationResistance / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm">📈 資産成長ポテンシャル</span>
                  <span className="text-xs sm:text-sm font-semibold">
                    {"★".repeat(character.assetGrowthPotential)}
                    {"☆".repeat(5 - character.assetGrowthPotential)}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full"
                    style={{
                      width: `${(character.assetGrowthPotential / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm">⚠️ 浪費危険度</span>
                  <span className="text-xs sm:text-sm font-semibold">
                    {"★".repeat(character.wasteDangerLevel)}
                    {"☆".repeat(5 - character.wasteDangerLevel)}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-600 h-1.5 rounded-full"
                    style={{
                      width: `${(character.wasteDangerLevel / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 相性 */}
            <div className="bg-slate-700/50 rounded-lg p-3 mb-6 border border-slate-600/50 text-center">
              <p className="text-xs sm:text-sm text-slate-300 mb-1">
                🤝 相性の良いタイプ
              </p>
              <p className="text-sm sm:text-base font-semibold">
                {character.compatibleType}
              </p>
            </div>

            {/* 財布からの一言 */}
            <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-lg p-4 border border-emerald-600/30 text-center">
              <p className="text-xs sm:text-sm text-emerald-300 mb-2">
                💬 あなたの財布から一言
              </p>
              <p className="text-sm sm:text-base italic text-white">
                「{character.walletMessage}」
              </p>
            </div>
          </motion.div>

          {/* シェアボタン */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-3 mb-6"
          >
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleShareX}
                variant="outline"
                className="text-xs sm:text-sm py-2.5 sm:py-3"
              >
                <Share2 className="w-4 h-4 mr-1" />
                X
              </Button>
              <Button
                onClick={handleShareLine}
                variant="outline"
                className="text-xs sm:text-sm py-2.5 sm:py-3"
              >
                <Share2 className="w-4 h-4 mr-1" />
                LINE
              </Button>
            </div>
            <Button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              variant="outline"
              className="w-full text-xs sm:text-sm py-2.5 sm:py-3"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "生成中..." : "画像を保存"}
            </Button>
          </motion.div>

          {/* 次のステップ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-xl p-4 sm:p-6 border border-emerald-600/30 text-center mb-4"
          >
            <div className="text-3xl sm:text-4xl mb-3">{character.emoji}</div>
            <p className="text-sm sm:text-base font-semibold mb-2">
              {character.name}のあなたへ
            </p>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              1年間で100万円貯められる？
            </p>
            <Button
              onClick={() => navigate("/simulator")}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              資産シミュレーターで試してみる
            </Button>
          </motion.div>

          {/* 別の診断 */}
          <Button
            onClick={() => navigate("/diagnosis")}
            variant="outline"
            className="w-full text-xs sm:text-sm py-2.5 sm:py-3"
          >
            もう一度診断する
          </Button>
        </div>
      </main>
    </div>
  );
}
