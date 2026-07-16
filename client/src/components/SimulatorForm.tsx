/**
 * SimulatorForm — 資産形成シミュレーター入力フォーム
 * Clarity Dashboard デザイン: ディープスレートブルー × エメラルドグリーン
 * スマホファースト、ステップ式入力UI
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Wallet,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Calculator,
} from "lucide-react";
import { SimulatorInput, DEFAULT_INPUT } from "@/lib/simulator";

interface Props {
  onCalculate: (input: SimulatorInput) => void;
}

const STEPS = [
  { id: 0, label: "基本情報", icon: User },
  { id: 1, label: "収支情報", icon: Wallet },
  { id: 2, label: "運用設定", icon: TrendingUp },
];

function NumberInput({
  label,
  value,
  onChange,
  unit = "円",
  min = 0,
  max,
  step = 10000,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    const num = parseInt(raw, 10);
    if (!isNaN(num)) onChange(Math.max(min, max !== undefined ? Math.min(max, num) : num));
    else if (raw === "") onChange(0);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative flex items-center">
        <Input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : value.toLocaleString()}
          onChange={handleChange}
          className="pr-10 tabular-nums text-right font-medium bg-white border-border focus:border-primary focus:ring-1 focus:ring-primary/30"
          placeholder="0"
        />
        <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">
          {unit}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function SimulatorForm({ onCalculate }: Props) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SimulatorInput>(DEFAULT_INPUT);

  const update = <K extends keyof SimulatorInput>(key: K, value: SimulatorInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onCalculate(input);
  };

  const canProceed = () => {
    if (step === 0) return input.currentAge >= 18 && input.currentAge <= 70;
    if (step === 1) return input.monthlyIncome >= 0;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isDone
                    ? "bg-accent/20 text-accent cursor-pointer hover:bg-accent/30"
                    : "bg-muted text-muted-foreground cursor-default"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                    isDone ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ステップコンテンツ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {step === 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">現在の年齢</Label>
                    <span className="text-2xl font-bold text-primary tabular-nums">
                      {input.currentAge}
                      <span className="text-sm font-normal text-muted-foreground ml-1">歳</span>
                    </span>
                  </div>
                  <Slider
                    value={[input.currentAge]}
                    onValueChange={([v]) => update("currentAge", v)}
                    min={18}
                    max={65}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>18歳</span>
                    <span>65歳</span>
                  </div>
                </div>

                <NumberInput
                  label="現在の金融資産"
                  value={input.currentAssets}
                  onChange={(v) => update("currentAssets", v)}
                  hint="預金・株式・投資信託などの合計"
                />

                <NumberInput
                  label="目標資産額"
                  value={input.targetAssets}
                  onChange={(v) => update("targetAssets", v)}
                  hint="達成したい資産の目標金額"
                />
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  毎月の収支
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <NumberInput
                  label="毎月の手取り収入"
                  value={input.monthlyIncome}
                  onChange={(v) => update("monthlyIncome", v)}
                  hint="税引き後の月収"
                />
                <NumberInput
                  label="毎月の生活費"
                  value={input.monthlyExpenses}
                  onChange={(v) => update("monthlyExpenses", v)}
                  hint="家賃・食費・光熱費などの合計"
                />

                {/* 収支サマリー */}
                <div className="bg-secondary rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">毎月の余剰資金</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        input.monthlyIncome - input.monthlyExpenses >= 0
                          ? "text-accent"
                          : "text-destructive"
                      }`}
                    >
                      {(input.monthlyIncome - input.monthlyExpenses).toLocaleString()}円
                    </span>
                  </div>
                </div>

                <NumberInput
                  label="毎月の投資額"
                  value={input.monthlyInvestment}
                  onChange={(v) => update("monthlyInvestment", v)}
                  hint="NISA・iDeCoなどへの毎月の積立額"
                />
                <NumberInput
                  label="年間ボーナス投資額"
                  value={input.annualBonusInvestment}
                  onChange={(v) => update("annualBonusInvestment", v)}
                  hint="ボーナス時の一括投資額（年間合計）"
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  運用設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">想定利回り（年率）</Label>
                    <span className="text-2xl font-bold text-primary tabular-nums">
                      {input.annualReturnRate}
                      <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                    </span>
                  </div>
                  <Slider
                    value={[input.annualReturnRate]}
                    onValueChange={([v]) => update("annualReturnRate", v)}
                    min={1}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%（低リスク）</span>
                    <span>10%（高リスク）</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "預金", rate: 0.1 },
                      { label: "債券", rate: 2 },
                      { label: "NISA目安", rate: 5 },
                      { label: "株式", rate: 7 },
                      { label: "積極運用", rate: 9 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => update("annualReturnRate", preset.rate)}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 btn-active ${
                          input.annualReturnRate === preset.rate
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {preset.label}
                        <br />
                        <span className="tabular-nums">{preset.rate}%</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 入力サマリー */}
                <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wide">
                    入力内容の確認
                  </p>
                  {[
                    { label: "現在年齢", value: `${input.currentAge}歳` },
                    {
                      label: "現在の資産",
                      value: `${input.currentAssets.toLocaleString()}円`,
                    },
                    {
                      label: "毎月の投資",
                      value: `${input.monthlyInvestment.toLocaleString()}円`,
                    },
                    {
                      label: "ボーナス投資",
                      value: `${input.annualBonusInvestment.toLocaleString()}円/年`,
                    },
                    { label: "想定利回り", value: `${input.annualReturnRate}%` },
                    {
                      label: "目標資産",
                      value: `${input.targetAssets.toLocaleString()}円`,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ナビゲーションボタン */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 btn-active bg-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            戻る
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1 btn-active bg-primary text-primary-foreground hover:bg-primary/90"
          >
            次へ
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="flex-1 btn-active bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            <Calculator className="w-4 h-4 mr-1.5" />
            シミュレーション開始
          </Button>
        )}
      </div>
    </div>
  );
}
