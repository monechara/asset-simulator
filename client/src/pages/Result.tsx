import { useParams } from "wouter";
import { getCharacterType } from "@/lib/characters";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Share2, Download, Home, MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">キャラクターが見つかりません</p>
          <Button onClick={() => navigate("/")} className="bg-orange-400 hover:bg-orange-500 text-white">
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
        backgroundColor: "#ffffff",
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

  const handleShareThreads = () => {
    const text = `私のお金の性格は「${character.name}」です！\n"${character.catchphrase}"\n\nあなたのお金の性格は？\n#マネキャラ診断`;
    const url = `https://www.threads.net/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-orange-50 text-gray-900 flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
              💰
            </div>
            <span className="text-sm sm:text-base font-semibold text-gray-900">
              診断結果
            </span>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* 結果カード */}
          <div
            ref={cardRef}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-8"
          >
            {/* キャラクター */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-6"
            >
              <div className="text-6xl mb-4">{character.emoji}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {character.name}
              </h2>
              <p className="text-lg text-orange-500 font-semibold italic">
                "{character.catchphrase}"
              </p>
            </motion.div>

            {/* 全国の診断者 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mb-6 border border-yellow-100"
            >
              <p className="text-sm text-gray-600 mb-2">全国の診断者</p>
              <p className="text-3xl font-bold text-orange-500">
                {character.nationalPercentage}%
              </p>
            </motion.div>

            {/* 指標 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4 mb-6"
            >
              {[
              { icon: "🎯", name: "誘惑耐性", level: character.temptationResistance },
              { icon: "📈", name: "資産成長ポテンシャル", level: character.assetGrowthPotential },
              { icon: "⚠️", name: "浪費危険度", level: character.wasteDangerLevel },
            ].map((trait: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {trait.icon} {trait.name}
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < trait.level ? "bg-orange-400" : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* 相性の良いタイプ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 mb-6 border border-emerald-100"
            >
              <p className="text-sm text-gray-600 mb-2">💚 相性の良いタイプ</p>
              <p className="text-lg font-bold text-gray-900">
                {character.compatibleType}
              </p>
            </motion.div>

            {/* メッセージ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-100"
            >
              <p className="text-sm text-gray-600 mb-2">💬 あなたの財布から一言</p>
              <p className="text-sm text-gray-900 italic">
                "{character.walletMessage}"
              </p>
            </motion.div>
          </div>

          {/* シェアボタン */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <Button
              onClick={handleShareX}
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-full"
            >
              <Share2 className="w-4 h-4 mr-1" />
              X
            </Button>
            <Button
              onClick={handleShareLine}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              LINE
            </Button>
            <Button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-full disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-1" />
              保存
            </Button>
          </motion.div>

          {/* シミュレーターへのCTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-6 border-2 border-yellow-300 mb-6"
          >
            <p className="text-center text-sm text-gray-600 mb-3">
              🎯 {character.name}のあなたへ
            </p>
            <p className="text-center text-lg font-bold text-gray-900 mb-4">
              「このままだと本当に100万円貯まる？」
            </p>
            <Button
              onClick={() => navigate("/simulator")}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 rounded-full"
            >
              💰 資産シミュレーターで試してみる
            </Button>
          </motion.div>

          {/* もう一度診断ボタン */}
          <Button
            onClick={() => navigate("/diagnosis")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-full"
          >
            🔄 もう一度診断する
          </Button>
        </motion.div>
      </main>

      {/* フッター */}
      <footer className="px-4 py-4 sm:py-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600 bg-gray-50">
        <p>© 2026 マネキャラ - 笑いながらお金を学ぶ</p>
      </footer>
    </div>
  );
}
