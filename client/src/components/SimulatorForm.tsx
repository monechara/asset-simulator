/**
 * SimulatorForm — 人生全体マネープラン入力フォーム
 * スマホ優先の3ステップ構成。金融商品は推奨しない。
 */
import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
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
  onCalculate: (input: SimulatorInput) => void;
}

const STEPS = ["基本情報", "家計と運用", "ライフイベント"];

function NumberField({
  label,
  value,
  onChange,
  unit = "円",
  min = 0,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-slate-800">{label}</Label>
        <span className="shrink-0 text-xs font-semibold text-sky-700">{unit}</span>
      </div>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          const safe = Number.isFinite(parsed) ? parsed : 0;
          const bounded = max === undefined ? Math.max(min, safe) : Math.min(max, Math.max(min, safe));
          onChange(bounded);
        }}
        className="h-12 rounded-xl border-slate-200 bg-white text-base font-medium"
      />
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SimulatorForm({ onCalculate }: Props) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SimulatorInput>({
    ...DEFAULT_INPUT,
    lifeEvents: [],
  });
  const [hasMarriage, setHasMarriage] = useState(false);
  const [hasChild, setHasChild] = useState(false);
  const [hasHousing, setHasHousing] = useState(false);
  const [hasEducation, setHasEducation] = useState(false);
  const [marriageAge, setMarriageAge] = useState(32);
  const [marriageCost, setMarriageCost] = useState(3_000_000);
  const [childAge, setChildAge] = useState(34);
  const [childCost, setChildCost] = useState(500_000);
  const [housingAge, setHousingAge] = useState(38);
  const [propertyPrice, setPropertyPrice] = useState(40_000_000);
  const [downPayment, setDownPayment] = useState(5_000_000);
  const [interestRate, setInterestRate] = useState(1);
  const [repaymentYears, setRepaymentYears] = useState(35);
  const [educationAge, setEducationAge] = useState(48);
  const [educationCost, setEducationCost] = useState(5_000_000);
  const [isCalculating, setIsCalculating] = useState(false);

  const minimumTargetAge = Math.min(100, input.currentAge + 1);
  const eventSummary = useMemo(() => {
    const summary: string[] = [];
    if (hasMarriage) summary.push(`結婚 ${marriageAge}歳`);
    if (hasChild) summary.push(`子ども ${childAge}歳`);
    if (hasHousing) summary.push(`住宅 ${housingAge}歳`);
    if (hasEducation) summary.push(`教育費 ${educationAge}歳`);
    return summary;
  }, [hasMarriage, hasChild, hasHousing, hasEducation, marriageAge, childAge, housingAge, educationAge]);

  const updateInput = (patch: Partial<SimulatorInput>) => {
    setInput((current) => ({ ...current, ...patch }));
  };

  const buildEvents = () => {
    const events = [];
    if (hasMarriage) {
      events.push(createEvent({ type: "marriage", title: "結婚", age: marriageAge, cost: marriageCost }));
    }
    if (hasChild) {
      events.push(createEvent({ type: "childbirth", title: "子どもの誕生", age: childAge, cost: childCost }));
    }
    if (hasHousing) {
      events.push(
        createHousingEvent({
          age: housingAge,
          propertyPrice,
          downPayment,
          annualInterestRate: interestRate,
          repaymentYears,
        }),
      );
    }
    if (hasEducation) {
      events.push(
        createEvent({
          type: "education",
          title: "教育費",
          age: educationAge,
          cost: educationCost,
          durationYears: 4,
          annualCost: educationCost / 4,
        }),
      );
    }
    return events;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsCalculating(true);
    const finalInput: SimulatorInput = { ...input, lifeEvents: buildEvents() };
    window.setTimeout(() => {
      onCalculate(finalInput);
      setIsCalculating(false);
    }, 180);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600">Step 1</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">いまの状態を教えてください</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">まずは現在の金融資産と、いつまでの未来を見たいかを設定します。</p>
              </div>
              <NumberField label="現在の年齢" value={input.currentAge} onChange={(value) => updateInput({ currentAge: value, targetAge: Math.max(value + 1, input.targetAge), retirementAge: Math.max(value, input.retirementAge) })} unit="歳" min={18} max={80} />
              <NumberField label="現在の現金資産" value={input.currentCashAssets} onChange={(value) => updateInput({ currentCashAssets: value })} unit="円" min={0} hint="預金・普通預金など。投資資産とは分けて入力します。" />
              <NumberField label="現在の投資資産" value={input.currentInvestmentAssets} onChange={(value) => updateInput({ currentInvestmentAssets: value })} unit="円" min={0} hint="投資信託・株式など、運用中の金融資産。" />
              <NumberField label="計画終了年齢" value={input.targetAge} onChange={(value) => updateInput({ targetAge: value })} unit="歳" min={minimumTargetAge} max={100} />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">Step 2</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">毎月のお金の流れを設定</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">積立後に残るお金は現金として蓄積され、積立額は投資資産へ振り替えます。</p>
              </div>
              <NumberField label="手取り月収" value={input.monthlyIncome} onChange={(value) => updateInput({ monthlyIncome: value })} unit="円/月" min={0} />
              <NumberField label="毎月の生活費" value={input.monthlyLivingExpenses} onChange={(value) => updateInput({ monthlyLivingExpenses: value })} unit="円/月" min={0} />
              <NumberField label="毎月の積立投資額" value={input.monthlyInvestmentContribution} onChange={(value) => updateInput({ monthlyInvestmentContribution: value })} unit="円/月" min={0} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-800">想定運用利回り</Label>
                  <span className="text-sm font-bold text-emerald-600">{input.annualReturnRate}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.5" value={input.annualReturnRate} onChange={(event) => updateInput({ annualReturnRate: Number(event.target.value) })} className="w-full accent-emerald-600" />
                <div className="flex justify-between text-xs text-slate-400"><span>0%</span><span>10%</span></div>
              </div>
              <NumberField label="目標金融資産" value={input.targetAssets} onChange={(value) => updateInput({ targetAssets: value })} unit="円" min={0} hint="いつ到達するかを結果画面で確認できます。" />
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 space-y-4">
                <div><p className="text-sm font-bold text-slate-800">老後の前提</p><p className="mt-1 text-xs leading-relaxed text-slate-500">老後は給与収入を止め、入力した年間収入と生活費比率で試算します。</p></div>
                <NumberField label="老後開始年齢" value={input.retirementAge} onChange={(value) => updateInput({ retirementAge: value })} unit="歳" min={input.currentAge} max={input.targetAge} />
                <NumberField label="老後の年間収入（年金等）" value={input.annualRetirementIncome} onChange={(value) => updateInput({ annualRetirementIncome: value })} unit="円/年" min={0} />
                <NumberField label="老後の生活費比率" value={Math.round(input.retirementLivingExpenseRatio * 100)} onChange={(value) => updateInput({ retirementLivingExpenseRatio: value / 100 })} unit="%" min={0} max={200} hint="現役時代の生活費に対する比率。75%なら4分の3です。" />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">利回りは将来の結果を保証しません。投資元本を下回る可能性もあります。</div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">Step 3</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">未来のイベントを重ねる</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">必要なイベントだけ選択してください。あとから条件を変えて比較できます。</p>
              </div>

              <EventToggle icon={<Heart className="h-4 w-4" />} label="結婚" checked={hasMarriage} onChange={setHasMarriage}>
                <div className="grid grid-cols-2 gap-3"><NumberField label="予定年齢" value={marriageAge} onChange={setMarriageAge} unit="歳" min={input.currentAge} max={input.targetAge} /><NumberField label="費用" value={marriageCost} onChange={setMarriageCost} unit="円" min={0} /></div>
              </EventToggle>

              <EventToggle icon={<Baby className="h-4 w-4" />} label="子どもの誕生" checked={hasChild} onChange={setHasChild}>
                <div className="grid grid-cols-2 gap-3"><NumberField label="予定年齢" value={childAge} onChange={setChildAge} unit="歳" min={input.currentAge} max={input.targetAge} /><NumberField label="初期費用" value={childCost} onChange={setChildCost} unit="円" min={0} /></div>
              </EventToggle>

              <EventToggle icon={<Home className="h-4 w-4" />} label="住宅購入" checked={hasHousing} onChange={setHasHousing}>
                <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><NumberField label="購入年齢" value={housingAge} onChange={setHousingAge} unit="歳" min={input.currentAge} max={input.targetAge} /><NumberField label="住宅価格" value={propertyPrice} onChange={setPropertyPrice} unit="円" min={0} /></div><div className="grid grid-cols-2 gap-3"><NumberField label="頭金" value={downPayment} onChange={setDownPayment} unit="円" min={0} max={propertyPrice} /><NumberField label="返済期間" value={repaymentYears} onChange={setRepaymentYears} unit="年" min={1} max={50} /></div><NumberField label="ローン金利" value={interestRate} onChange={setInterestRate} unit="%/年" min={0} max={20} /></div>
              </EventToggle>

              <EventToggle icon={<GraduationCap className="h-4 w-4" />} label="教育費" checked={hasEducation} onChange={setHasEducation}>
                <div className="grid grid-cols-2 gap-3"><NumberField label="開始年齢" value={educationAge} onChange={setEducationAge} unit="歳" min={input.currentAge} max={input.targetAge} /><NumberField label="4年間の総額" value={educationCost} onChange={setEducationCost} unit="円" min={0} /></div>
              </EventToggle>

              {eventSummary.length > 0 && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">選択中: {eventSummary.join(" / ")}</p>}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-12 flex-1 rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" />戻る</Button>}
        {step < STEPS.length - 1 ? <Button type="button" onClick={() => setStep(step + 1)} className="h-12 flex-1 rounded-xl bg-sky-600 hover:bg-sky-700">次へ<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" disabled={isCalculating} className="h-12 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"><Calculator className="mr-2 h-4 w-4" />{isCalculating ? "計算中…" : "人生のお金を計算する"}</Button>}
      </div>
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
