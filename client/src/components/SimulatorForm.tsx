/**
 * SimulatorForm — 人生全体マネープラン入力フォーム
 * スマホ優先の3ステップ構成。金融商品は推奨しない。
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Baby,
  Heart,
  GraduationCap,
  Calculator,
} from "lucide-react";
import {
  SimulatorInput,
  DEFAULT_INPUT,
  createEvent,
  createHousingEvent,
} from "@/lib/simulator";

interface Props {
  onCalculate: (input: SimulatorInput, isSimple?: boolean) => void;
  initialInput?: SimulatorInput;
}

const STEPS = ["基本情報", "家計と運用", "ライフプラン", "老後とその他"];
const PENSION_OPTIONS = [100_000, 150_000, 200_000, 250_000, 300_000];
const RETIREMENT_LIVING_EXPENSE_OPTIONS = [150_000, 200_000, 250_000, 300_000];
const PENSION_BENCHMARK = 150_000;
const RETIREMENT_LIVING_EXPENSE_BENCHMARK = 250_000;

function formatManValue(amount: number): string {
  const man = amount / 10_000;
  return Number.isInteger(man) ? String(man) : man.toFixed(1);
}

function benchmarkToneClass(value: number, benchmark: number): string {
  const ratio = benchmark > 0 ? value / benchmark : 1;
  if (ratio < 0.9) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (ratio > 1.1) return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function normalizeNumericDraft(raw: string): string {
  if (raw === "") return "";
  // 数値入力の途中で発生する「07457」を「7457」に正規化する。
  const normalized = raw.replace(/^0+(?=\d|$)/, "");
  return normalized || "0";
}

function AgeField({
  label,
  value,
  onChange,
  min = 18,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  // 入力途中の空欄・1桁目を親の数値状態で即時補正しない。
  // 先頭ゼロは入力時に除去し、全選択置換・Backspace・iPhone数字キーボードに対応する。
  const [draft, setDraft] = useState(String(value));
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (value !== lastExternalValue.current && Number(draft) !== value) {
      setDraft(String(value));
    }
    lastExternalValue.current = value;
  }, [value, draft]);

  const commit = (raw: string) => {
    const normalized = normalizeNumericDraft(raw);
    setDraft(normalized);
    if (normalized === "") return;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) onChange(parsed);
  };

  const normalizeOnBlur = () => {
    const parsed = Number(draft);
    const safe = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
    setDraft(String(safe));
    onChange(safe);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-slate-800">{label}</Label>
        <span className="shrink-0 text-xs font-semibold text-sky-700">歳</span>
      </div>
      <Input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onBlur={normalizeOnBlur}
        className="h-12 rounded-xl border-slate-200 bg-white text-base font-medium"
        aria-label={label}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  unit = "円",
  min = 0,
  max,
  hint,
  scale = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  hint?: string;
  scale?: number;
}) {
  const [draft, setDraft] = useState(String(value / scale));
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (value !== lastExternalValue.current && Number(draft) * scale !== value) {
      setDraft(String(value / scale));
    }
    lastExternalValue.current = value;
  }, [value, draft, scale]);

  const commit = (raw: string) => {
    const normalized = normalizeNumericDraft(raw);
    setDraft(normalized);
    if (normalized === "") return;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) onChange(parsed * scale);
  };

  const normalizeOnBlur = () => {
    const parsed = Number(draft);
    const rawValue = parsed * scale;
    const safe = Number.isFinite(rawValue) ? (max === undefined ? Math.max(min, rawValue) : Math.min(max, Math.max(min, rawValue))) : min;
    setDraft(String(safe / scale));
    onChange(safe);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-slate-800">{label}</Label>
        <span className="shrink-0 text-xs font-semibold text-sky-700">{unit}</span>
      </div>
      <Input
        type="number"
        inputMode={scale > 1 ? "decimal" : "numeric"}
        min={min === undefined ? undefined : min / scale}
        max={max === undefined ? undefined : max / scale}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onBlur={normalizeOnBlur}
        className="h-12 rounded-xl border-slate-200 bg-white text-base font-medium"
      />
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SimulatorForm({ onCalculate, initialInput }: Props) {
  const [isSimpleMode, setIsSimpleMode] = useState(!initialInput);
  const [step, setStep] = useState(0);

  // 詳細フォームの表示時とStep変更時は、現在のStepの先頭を固定ヘッダー下へ表示する。
  // setTimeoutでDOM更新後に実行し、モバイルSafariでも切り替え直後の位置を安定させる。
  useEffect(() => {
    if (isSimpleMode) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById("simulator-detailed-step-section");
      if (!el) return;

      const headerOffset = 80;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialInput, isSimpleMode, step]);
  const [familyType, setFamilyType] = useState<"single" | "couple" | "family">("single");

  // かんたんモード用の入力途中文字列state（空欄を完全に許容するため）
  const [simpleAge, setSimpleAge] = useState<string>(String(initialInput?.currentAge ?? 30));
  const [simpleIncome, setSimpleIncome] = useState<string>(String(Math.round((initialInput?.monthlyIncome ?? 300_000) / 10_000)));
  const [simpleCash, setSimpleCash] = useState<string>(String(Math.round((initialInput?.currentCashAssets ?? 1_000_000) / 10_000)));
  const [simpleInvest, setSimpleInvest] = useState<string>(String(Math.round((initialInput?.currentInvestmentAssets ?? 500_000) / 10_000)));
  const [simpleSave, setSimpleSave] = useState<string>(String(Math.round((initialInput?.monthlyInvestmentContribution ?? 30_000) / 10_000)));

  const [input, setInput] = useState<SimulatorInput>(initialInput ?? {
    ...DEFAULT_INPUT,
    monthlyLivingExpenses: 150_000,
    monthlyIncome: 300_000,
    currentCashAssets: 1_000_000,
    currentInvestmentAssets: 500_000,
    monthlyInvestmentContribution: 30_000,
    lifeEvents: [],
  });
  const [lifeEvents, setLifeEvents] = useState<any[]>(initialInput?.lifeEvents && initialInput.lifeEvents.length > 0 ? initialInput.lifeEvents : []);
  const [activeModalType, setActiveModalType] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // フォーム用ローカル状態
  const [modalAge, setModalAge] = useState(35);
  const [modalCost, setModalCost] = useState(3_000_000);
  const [modalTitle, setModalTitle] = useState("");
  const [modalPropertyPrice, setModalPropertyPrice] = useState(40_000_000);
  const [modalDownPayment, setModalDownPayment] = useState(5_000_000);
  const [modalInterestRate, setModalInterestRate] = useState(1);
  const [modalRepaymentYears, setModalRepaymentYears] = useState(35);

  const [isCalculating, setIsCalculating] = useState(false);
  const [pensionSelection, setPensionSelection] = useState<number | "custom">(150_000);
  const [livingExpenseSelection, setLivingExpenseSelection] = useState<number | "custom">(RETIREMENT_LIVING_EXPENSE_BENCHMARK);
  const [retirementEndAgeSelection, setRetirementEndAgeSelection] = useState<number | "custom">(90);

  const minimumTargetAge = Math.min(100, input.currentAge + 1);
  const currentRetirementMonthlyIncome = Math.round(input.annualRetirementIncome / 12);
  const currentRetirementMonthlyLivingExpenses = input.retirementMonthlyLivingExpenses ?? Math.round(input.monthlyLivingExpenses * input.retirementLivingExpenseRatio);
  const monthlyCashRemaining = input.monthlyIncome - input.monthlyLivingExpenses - input.monthlyInvestmentContribution;

  const updateInput = (patch: Partial<SimulatorInput>) => {
    setInput((current) => ({ ...current, ...patch }));
  };

  const openAddModal = (type: string) => {
    setEditingEventId(null);
    setActiveModalType(type);
    setModalAge(Math.max(input.currentAge, type === "housing" ? 38 : type === "education" ? 45 : 32));
    setModalCost(type === "marriage" ? 3_000_000 : type === "childbirth" ? 500_000 : type === "education" ? 5_000_000 : type === "car" ? 2_000_000 : 1_000_000);
    setModalTitle(type === "other" ? "" : type === "car" ? "車購入" : "");
    setModalPropertyPrice(40_000_000);
    setModalDownPayment(5_000_000);
    setModalInterestRate(1);
    setModalRepaymentYears(35);
  };

  const openEditModal = (ev: any) => {
    setEditingEventId(ev.id);
    setActiveModalType(ev.type);
    setModalAge(ev.age);
    setModalCost(ev.cost);
    setModalTitle(ev.title || "");
    if (ev.type === "housing" && ev.housingLoan) {
      setModalPropertyPrice(ev.housingLoan.propertyPrice);
      setModalDownPayment(ev.housingLoan.downPayment);
      setModalInterestRate(ev.housingLoan.annualInterestRate);
      setModalRepaymentYears(ev.housingLoan.repaymentYears);
    }
  };

  const saveModalEvent = () => {
    if (!activeModalType) return;
    let newEv: any = null;
    const id = editingEventId ?? `${activeModalType}-${Date.now()}`;

    if (activeModalType === "marriage") {
      newEv = createEvent({ id, type: "marriage", title: "結婚", age: modalAge, cost: modalCost });
    } else if (activeModalType === "childbirth") {
      newEv = createEvent({ id, type: "childbirth", title: "子どもの誕生", age: modalAge, cost: modalCost });
    } else if (activeModalType === "education") {
      newEv = createEvent({ id, type: "education", title: "教育費", age: modalAge, cost: modalCost, durationYears: 4, annualCost: modalCost / 4 });
    } else if (activeModalType === "car") {
      newEv = createEvent({ id, type: "other", title: "車購入", age: modalAge, cost: modalCost });
    } else if (activeModalType === "other") {
      newEv = createEvent({ id, type: "other", title: modalTitle || "その他の大型支出", age: modalAge, cost: modalCost });
    } else if (activeModalType === "housing") {
      newEv = createHousingEvent({ id, age: modalAge, propertyPrice: modalPropertyPrice, downPayment: modalDownPayment, annualInterestRate: modalInterestRate, repaymentYears: modalRepaymentYears });
    }

    if (newEv) {
      setLifeEvents((current) => {
        if (editingEventId) {
          return current.map((item) => (item.id === editingEventId ? newEv : item));
        }
        return [...current, newEv];
      });
    }
    setActiveModalType(null);
    setEditingEventId(null);
  };

  const removeEvent = (id: string) => {
    setLifeEvents((current) => current.filter((item) => item.id !== id));
  };

  const buildEvents = () => {
    return lifeEvents;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    // かんたんモードの場合、送信直前にsimpleStateをパースしてinputへ同期
    let finalInput: SimulatorInput;
    if (isSimpleMode) {
      const ageNum = parseInt(simpleAge);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 80) {
        toast.error("現在の年齢は18歳〜80歳の範囲で正しく入力してください。");
        return;
      }
      const incomeNum = parseInt(simpleIncome);
      const cashNum = parseInt(simpleCash);
      const investNum = parseInt(simpleInvest);
      const saveNum = parseInt(simpleSave);

      if (isNaN(incomeNum) || isNaN(cashNum) || isNaN(investNum) || isNaN(saveNum)) {
        toast.error("すべての数値を正しく入力してください。");
        return;
      }

      finalInput = {
        ...input,
        currentAge: ageNum,
        monthlyIncome: incomeNum * 10_000,
        currentCashAssets: cashNum * 10_000,
        currentInvestmentAssets: investNum * 10_000,
        monthlyInvestmentContribution: saveNum * 10_000,
        lifeEvents: buildEvents(),
      };
    } else {
      finalInput = { ...input, lifeEvents: buildEvents() };
    }

    setIsCalculating(true);
    window.setTimeout(() => {
      onCalculate(finalInput, isSimpleMode);
      setIsCalculating(false);
    }, 180);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* モード切替ヘッダー */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-sky-900">{isSimpleMode ? "✨ かんたんモード（30秒で診断）" : "⚙️ 詳細設定モード"}</p>
          <p className="text-[11px] text-slate-500">{isSimpleMode ? "主要な6項目だけでまずは将来予測をチェック" : "生活費やライフイベントを個別にカスタマイズ中"}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSimpleMode(!isSimpleMode)}
          className="h-9 rounded-xl text-xs font-semibold bg-white border-sky-200 text-sky-700 hover:bg-sky-50"
        >
          {isSimpleMode ? "詳細設定へ切り替える" : "かんたんモードに戻る"}
        </Button>
      </div>

      {isSimpleMode ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">かんたん資産シミュレーション</h3>
              <p className="text-xs text-slate-500 leading-relaxed">以下の6つの質問に答えるだけで、あなたの将来の資産推移をすぐにシミュレーションできます（生活費や年金は統計目安を自動適用しています）。</p>
            </div>

            {/* 1. 現在の年齢 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">現在の年齢</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={simpleAge}
                  onChange={(e) => setSimpleAge(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(simpleAge);
                    const val = isNaN(parsed) ? 30 : Math.max(18, Math.min(80, parsed));
                    setSimpleAge(String(val));
                    updateInput({ currentAge: val });
                  }}
                  className="h-12 rounded-xl text-base font-bold"
                  min={18}
                  max={80}
                  placeholder="30"
                />
                <span className="text-sm font-medium text-slate-600">歳</span>
              </div>
            </div>

            {/* 2. 家族構成 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">家族構成（参考生活費の自動設定用）</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "single", label: "👤 単身", expense: 150_000 },
                  { id: "couple", label: "👫 夫婦2人", expense: 220_000 },
                  { id: "family", label: "👨‍👩‍👧 子育て世帯", expense: 280_000 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFamilyType(item.id as any);
                      updateInput({ monthlyLivingExpenses: item.expense });
                    }}
                    className={`h-12 rounded-xl border text-xs font-bold transition-all ${
                      familyType === item.id
                        ? "border-sky-500 bg-sky-50 text-sky-900 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2.5">
                💡 統計をもとにした参考生活費（月額 {Math.round(input.monthlyLivingExpenses / 10_000)}万円）を自動設定しています。後から詳細設定で自由に変更できます。
              </p>
            </div>

            {/* 3. 月の手取り収入 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">毎月の手取り収入</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={simpleIncome}
                  onChange={(e) => setSimpleIncome(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(simpleIncome);
                    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    setSimpleIncome(String(val));
                    updateInput({ monthlyIncome: val * 10_000 });
                  }}
                  className="h-12 rounded-xl text-base font-bold"
                  step={1}
                  placeholder="30"
                />
                <span className="text-sm font-medium text-slate-600">万円 / 月</span>
              </div>
            </div>

            {/* 4. 現在の現金資産 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">現在の現金資産（預金・普通預金等）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={simpleCash}
                  onChange={(e) => setSimpleCash(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(simpleCash);
                    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    setSimpleCash(String(val));
                    updateInput({ currentCashAssets: val * 10_000 });
                  }}
                  className="h-12 rounded-xl text-base font-bold"
                  step={1}
                  placeholder="100"
                />
                <span className="text-sm font-medium text-slate-600">万円</span>
              </div>
            </div>

            {/* 5. 現在の投資資産 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">現在の投資資産（NISA・株・投資信託等）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={simpleInvest}
                  onChange={(e) => setSimpleInvest(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(simpleInvest);
                    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    setSimpleInvest(String(val));
                    updateInput({ currentInvestmentAssets: val * 10_000 });
                  }}
                  className="h-12 rounded-xl text-base font-bold"
                  step={1}
                  placeholder="50"
                />
                <span className="text-sm font-medium text-slate-600">万円</span>
              </div>
            </div>

            {/* 6. 毎月の積立額 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">毎月の積立額（投資や貯蓄に回す額）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={simpleSave}
                  onChange={(e) => setSimpleSave(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(simpleSave);
                    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    setSimpleSave(String(val));
                    updateInput({ monthlyInvestmentContribution: val * 10_000 });
                  }}
                  className="h-12 rounded-xl text-base font-bold"
                  step={1}
                  placeholder="3"
                />
                <span className="text-sm font-medium text-slate-600">万円 / 月</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCalculating}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-600 text-base font-bold text-white shadow-md hover:from-sky-700 hover:to-emerald-700"
            >
              {isCalculating ? "計算中..." : "この条件で試す"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div id="simulator-detailed-step-section" className="space-y-5 scroll-mt-24">
          <div className="flex items-center gap-2" aria-label="入力ステップ">
            {STEPS.map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-full px-2 py-2 text-left text-xs font-semibold transition-colors ${
                    step === index ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-[11px] text-slate-700">
                    {index + 1}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
                {index < STEPS.length - 1 && <span className="hidden h-px w-3 bg-slate-200 sm:block" />}
              </div>
            ))}
          </div>

      <Card id="simulator-step1-section" className="rounded-2xl border-slate-200 shadow-sm scroll-mt-24">
          <CardContent className="space-y-5 p-5 sm:p-6">
            {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600">Step 1</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">いまの状態を教えてください</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">まずは現在の金融資産と、いつまでの未来を見たいかを設定します。</p>
              </div>
              <AgeField label="現在の年齢" value={input.currentAge} onChange={(value) => updateInput({ currentAge: value, investmentEndAge: Math.max(value + 1, input.investmentEndAge), retirementEndAge: Math.max(value + 1, input.retirementEndAge), retirementAge: Math.max(value, input.retirementAge) })} min={18} max={80} />
              <NumberField label="現在の現金資産" value={input.currentCashAssets} onChange={(value) => updateInput({ currentCashAssets: value })} unit="万円" scale={10_000} min={0} hint="預金・普通預金など。100万円なら「100」と入力します。投資資産とは分けて入力します。" />
              <NumberField label="現在の投資資産" value={input.currentInvestmentAssets} onChange={(value) => updateInput({ currentInvestmentAssets: value })} unit="万円" scale={10_000} min={0} hint="投資信託・株式など、運用中の金融資産。" />
              <AgeField label="何歳まで積み立てますか？（積立終了年齢）" value={input.investmentEndAge} onChange={(value) => updateInput({ investmentEndAge: value })} min={input.currentAge + 1} max={100} />
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-800">老後資金は何歳まで想定しますか？</Label>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">迷ったら90歳を目安にできます。生活スタイルや健康状態に合わせて変更できます。</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="老後資金の想定終了年齢">
                  {[85, 90, 95, 100].map((age) => {
                    const selected = retirementEndAgeSelection === age;
                    return (
                      <button
                        key={age}
                        type="button"
                        onClick={() => {
                          setRetirementEndAgeSelection(age);
                          updateInput({ retirementEndAge: age, targetAge: age });
                        }}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${selected ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                        aria-pressed={selected}
                      >
                        {age}歳まで
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setRetirementEndAgeSelection("custom");
                    }}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors col-span-2 sm:col-span-4 ${retirementEndAgeSelection === "custom" ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                    aria-pressed={retirementEndAgeSelection === "custom"}
                  >
                    その他（自由入力）
                  </button>
                </div>
                {retirementEndAgeSelection === "custom" && (
                  <AgeField
                    label="老後資金の想定終了年齢"
                    value={input.retirementEndAge}
                    onChange={(value) => updateInput({ retirementEndAge: value, targetAge: value })}
                    min={Math.max(input.currentAge + 1, input.retirementAge)}
                    max={100}
                  />
                )}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">Step 2</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">毎月のお金の流れを設定</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">積立後に残るお金は現金として蓄積され、積立額は投資資産へ振り替えます。</p>
              </div>
              <NumberField label="手取り月収" value={input.monthlyIncome} onChange={(value) => updateInput({ monthlyIncome: value })} unit="万円/月" scale={10_000} min={0} />
              <NumberField label="毎月の支出" value={input.monthlyLivingExpenses} onChange={(value) => updateInput({ monthlyLivingExpenses: value })} unit="万円/月" scale={10_000} min={0} hint="家賃・食費・日用品・娯楽など、普段使うお金を含めて入力してください。" />
              <NumberField label="毎月の積立投資額" value={input.monthlyInvestmentContribution} onChange={(value) => updateInput({ monthlyInvestmentContribution: value })} unit="万円/月" scale={10_000} min={0} />
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" aria-live="polite">
                <p className="text-sm font-bold text-slate-800">毎月のお金の流れ</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">手取り</p>
                    <p className="mt-0.5 font-bold text-slate-900">{formatManValue(input.monthlyIncome)}万円</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">支出</p>
                    <p className="mt-0.5 font-bold text-slate-900">{formatManValue(input.monthlyLivingExpenses)}万円</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">投資</p>
                    <p className="mt-0.5 font-bold text-slate-900">{formatManValue(input.monthlyInvestmentContribution)}万円</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{monthlyCashRemaining >= 0 ? "現金として残る" : "現金の不足"}</p>
                    <p className={`mt-0.5 font-bold ${monthlyCashRemaining >= 0 ? "text-emerald-700" : "text-orange-700"}`}>
                      {formatManValue(Math.abs(monthlyCashRemaining))}万円/月
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-emerald-800">
                  {monthlyCashRemaining >= 0
                    ? "残ったお金は現金資産として貯まる設定です。"
                    : "支出と投資が手取りを上回っているため、現金資産を取り崩す設定です。"}
                </p>
              </div>
              <NumberField label="年間ボーナスから投資する金額" value={input.annualBonusInvestment} onChange={(value) => updateInput({ annualBonusInvestment: value })} unit="万円/年" scale={10_000} min={0} hint="ボーナスから年間合計で投資する金額。20万円なら「20」と入力します。年末に投資資産へ振り替えて試算します。" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-800">想定運用利回り</Label>
                  <span className="text-sm font-bold text-emerald-600">{input.annualReturnRate}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.5" value={input.annualReturnRate} onChange={(event) => updateInput({ annualReturnRate: Number(event.target.value) })} className="w-full accent-emerald-600" />
                <div className="flex justify-between text-xs text-slate-400"><span>0%</span><span>10%</span></div>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-800">資産目標（任意）</Label>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">いつまでにいくら貯めたいか、任意の目標を設定して到達時期を確認できます。</p>
                </div>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="資産目標の有無">
                  <button
                    type="button"
                    onClick={() => updateInput({ targetAssets: 0 })}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${input.targetAssets === 0 ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                    aria-pressed={input.targetAssets === 0}
                  >
                    設定しない
                  </button>
                  <button
                    type="button"
                    onClick={() => updateInput({ targetAssets: input.targetAssets > 0 ? input.targetAssets : 30_000_000 })}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${input.targetAssets > 0 ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}
                    aria-pressed={input.targetAssets > 0}
                  >
                    目標金額を設定する
                  </button>
                </div>
                {input.targetAssets > 0 && (
                  <NumberField
                    label="目標金額"
                    value={input.targetAssets}
                    onChange={(value) => updateInput({ targetAssets: value })}
                    unit="万円"
                    scale={10_000}
                    min={0}
                    hint="3,000万円なら「3000」と入力します。"
                  />
                )}
              </div>
              <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">老後の前提</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">老後は給与収入を止め、年金収入と生活費の差額を金融資産から補います。</p>
                </div>
                <NumberField label="老後開始年齢" value={input.retirementAge} onChange={(value) => updateInput({ retirementAge: value })} unit="歳" min={input.currentAge} max={input.targetAge} />

                {/* ① 世帯人数の選択 */}
                <div className="space-y-2.5 rounded-xl border border-white/80 bg-white/70 p-3">
                  <Label className="text-sm font-medium text-slate-800">老後は何人で生活する予定ですか？</Label>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="老後の世帯人数">
                    <button
                      type="button"
                      onClick={() => {
                        updateInput({
                          householdSize: 1,
                          retirementMonthlyLivingExpenses: 150_000,
                          annualRetirementIncome: 1_200_000,
                        });
                        setLivingExpenseSelection(150_000);
                        setPensionSelection(100_000);
                      }}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${input.householdSize === 1 ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}
                      aria-pressed={input.householdSize === 1}
                    >
                      1人（単身世帯）
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateInput({
                          householdSize: 2,
                          retirementMonthlyLivingExpenses: 270_000,
                          annualRetirementIncome: 2_200_000,
                        });
                        setLivingExpenseSelection(270_000);
                        setPensionSelection(180_000);
                      }}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${input.householdSize === 2 ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}
                      aria-pressed={input.householdSize === 2}
                    >
                      2人（夫婦世帯）
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">※ 選択すると、総務省「家計調査」等の公的統計に基づく世帯人数別の生活費・年金目安が自動で設定されます。</p>
                </div>

                <div className="space-y-3 rounded-xl border border-white/80 bg-white/70 p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-800">老後の毎月の生活費はいくら必要ですか？</Label>
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = input.householdSize === 1 ? 150_000 : 270_000;
                          setLivingExpenseSelection(suggested);
                          updateInput({ retirementMonthlyLivingExpenses: suggested });
                        }}
                        className="text-xs font-bold text-violet-700 hover:underline"
                      >
                        [目安を使う]
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      統計上の目安（{input.householdSize === 1 ? "単身世帯 約15万円/月" : "夫婦高齢者無職世帯 約27万円/月・総務省家計調査"}）。よく分からない方は目安からスタートできます。
                    </p>
                  </div>
                  <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${benchmarkToneClass(currentRetirementMonthlyLivingExpenses, RETIREMENT_LIVING_EXPENSE_BENCHMARK)}`}>
                    あなたの想定：{formatManValue(currentRetirementMonthlyLivingExpenses)}万円/月
                  </div>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="老後の毎月の生活費目安">
                    {RETIREMENT_LIVING_EXPENSE_OPTIONS.map((amount) => {
                      const selected = livingExpenseSelection === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setLivingExpenseSelection(amount);
                            updateInput({ retirementMonthlyLivingExpenses: amount });
                          }}
                          className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}
                          aria-pressed={selected}
                        >
                          月{formatManValue(amount)}万円
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setLivingExpenseSelection("custom")}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${livingExpenseSelection === "custom" ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"}`}
                      aria-pressed={livingExpenseSelection === "custom"}
                    >
                      自分で入力する
                    </button>
                  </div>
                  {livingExpenseSelection === "custom" && (
                    <NumberField
                      label="老後の毎月の生活費"
                      value={currentRetirementMonthlyLivingExpenses}
                      onChange={(value) => updateInput({ retirementMonthlyLivingExpenses: value })}
                      unit="万円/月"
                      scale={10_000}
                      min={0}
                      hint="生活費は人によって異なります。住居費・医療費なども含めて想定してください。"
                    />
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-white/80 bg-white/70 p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-800">老後の毎月の収入（年金）はどのくらいを想定しますか？</Label>
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = input.householdSize === 1 ? 100_000 : 180_000;
                          setPensionSelection(suggested);
                          updateInput({ annualRetirementIncome: suggested * 12 });
                        }}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        [目安を使う]
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      統計上の目安（{input.householdSize === 1 ? "単身 約10万円/月" : "夫婦 約18万円/月"}）。※年金額は加入状況や職歴により大きく異なるため、この平均値があなたの受給額を保証するものではありません。
                    </p>
                  </div>
                  <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${benchmarkToneClass(currentRetirementMonthlyIncome, PENSION_BENCHMARK)}`}>
                    あなたの想定：{formatManValue(currentRetirementMonthlyIncome)}万円/月
                  </div>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="老後の毎月の年金目安">
                    {PENSION_OPTIONS.map((amount) => {
                      const selected = pensionSelection === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setPensionSelection(amount);
                            updateInput({ annualRetirementIncome: amount * 12 });
                          }}
                          className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}
                          aria-pressed={selected}
                        >
                          月{formatManValue(amount)}万円
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPensionSelection("custom")}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${pensionSelection === "custom" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}
                      aria-pressed={pensionSelection === "custom"}
                    >
                      自分で入力する
                    </button>
                  </div>
                  {pensionSelection === "custom" && (
                    <NumberField
                      label="老後の毎月の収入（年金）"
                      value={currentRetirementMonthlyIncome}
                      onChange={(value) => updateInput({ annualRetirementIncome: value * 12 })}
                      unit="万円/月"
                      scale={10_000}
                      min={0}
                      hint="計算では入力した月額を12倍して年間収入として扱います。"
                    />
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">利回りは将来の結果を保証しません。投資元本を下回る可能性もあります。</div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">Step 3</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">未来のイベントを重ねる</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">結婚や住宅購入などのライフイベントを追加して、将来のキャッシュフローをよりリアルにシミュレーションします。</p>
              </div>

              {/* 追加済みイベント一覧 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">登録済みイベント ({lifeEvents.length}件)</h3>
                </div>

                {lifeEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    まだイベントが登録されていません。下のボタンから追加してください。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lifeEvents.map((ev) => {
                      let icon = "🎯";
                      let desc = `${ev.age}歳`;
                      if (ev.type === "marriage") { icon = "💍"; desc += ` / 費用: ${formatManValue(ev.cost)}万円`; }
                      else if (ev.type === "childbirth") { icon = "👶"; desc += ` / 費用: ${formatManValue(ev.cost)}万円`; }
                      else if (ev.type === "education") { icon = "🎓"; desc += ` / 4年間総額: ${formatManValue(ev.cost)}万円`; }
                      else if (ev.type === "housing") { icon = "🏠"; desc += ` / 物件: ${formatManValue(ev.housingLoan?.propertyPrice ?? ev.cost)}万円 (頭金${formatManValue(ev.cost)}万)`; }
                      else if (ev.title === "車購入") { icon = "🚗"; desc += ` / 費用: ${formatManValue(ev.cost)}万円`; }
                      else { icon = "＋"; desc += ` / 費用: ${formatManValue(ev.cost)}万円`; }

                      return (
                        <div key={ev.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg">{icon}</span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{ev.title}</p>
                              <p className="text-xs text-slate-500">{desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => openEditModal(ev)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50">編集</button>
                            <button type="button" onClick={() => removeEvent(ev.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">削除</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 新規追加ボタン群 */}
              <div className="pt-2">
                <p className="mb-2 text-xs font-bold text-slate-600">イベントを追加する</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" onClick={() => openAddModal("marriage")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">💍 結婚</Button>
                  <Button type="button" variant="outline" onClick={() => openAddModal("childbirth")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">👶 子ども</Button>
                  <Button type="button" variant="outline" onClick={() => openAddModal("housing")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">🏠 住宅</Button>
                  <Button type="button" variant="outline" onClick={() => openAddModal("education")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">🎓 教育</Button>
                  <Button type="button" variant="outline" onClick={() => openAddModal("car")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">🚗 車</Button>
                  <Button type="button" variant="outline" onClick={() => openAddModal("other")} className="h-11 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-sky-300">＋ その他</Button>
                </div>
              </div>

              {/* 追加・編集モーダル（インライン表示） */}
              {activeModalType && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      {editingEventId ? "イベントを編集" : "新しいイベントを追加"} ({
                        activeModalType === "marriage" ? "結婚" :
                        activeModalType === "childbirth" ? "子どもの誕生" :
                        activeModalType === "education" ? "教育費" :
                        activeModalType === "car" ? "車購入" :
                        activeModalType === "housing" ? "住宅購入" : "その他の大型支出"
                      })
                    </h4>
                    <button type="button" onClick={() => setActiveModalType(null)} className="text-xs text-slate-500 hover:text-slate-800">✕ 閉じる</button>
                  </div>

                  {activeModalType === "other" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">イベント名</Label>
                      <Input type="text" value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} placeholder="例：海外旅行、リフォーム" className="h-11 rounded-xl bg-white text-sm" />
                    </div>
                  )}

                  <NumberField label="予定年齢" value={modalAge} onChange={setModalAge} unit="歳" min={input.currentAge} max={input.targetAge} />

                  {activeModalType === "housing" ? (
                    <div className="space-y-3">
                      <NumberField label="物件価格" value={modalPropertyPrice} onChange={setModalPropertyPrice} unit="万円" scale={10_000} min={0} />
                      <NumberField label="頭金" value={modalDownPayment} onChange={setModalDownPayment} unit="万円" scale={10_000} min={0} max={modalPropertyPrice} />
                      <div className="grid grid-cols-2 gap-3">
                        <NumberField label="返済期間" value={modalRepaymentYears} onChange={setModalRepaymentYears} unit="年" min={1} max={50} />
                        <NumberField label="ローン金利" value={modalInterestRate} onChange={setModalInterestRate} unit="%/年" min={0} max={20} />
                      </div>
                    </div>
                  ) : (
                    <NumberField label={activeModalType === "education" ? "4年間の総額" : "費用"} value={modalCost} onChange={setModalCost} unit="万円" scale={10_000} min={0} />
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" onClick={saveModalEvent} className="h-11 flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold">{editingEventId ? "変更を保存" : "追加する"}</Button>
                    <Button type="button" variant="outline" onClick={() => setActiveModalType(null)} className="h-11 rounded-xl border-slate-300 bg-white text-xs text-slate-700">キャンセル</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 flex-1 rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" />戻る</Button>}
        {step < STEPS.length - 1 ? <Button type="button" onClick={() => setStep(step + 1)} className="h-12 flex-1 rounded-xl bg-sky-600 hover:bg-sky-700">次へ<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" disabled={isCalculating} className="h-12 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Calculator className="mr-2 h-4 w-4" />{isCalculating ? "計算中…" : "人生のお金を計算する"}</Button>}
      </div>
          </div>
        </>
      )}
    </form>
  );
}

function EventToggle({
  icon,
  label,
  checked,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${checked ? "border-sky-200 bg-sky-50/60" : "border-slate-200 bg-white"}`}>
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-sky-600" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm">{icon}</span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </label>
      {checked && <div className="mt-4 border-t border-sky-100 pt-4">{children}</div>}
    </div>
  );
}
