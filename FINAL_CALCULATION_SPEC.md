# 人生全体マネープランシミュレーター 最終計算仕様書（確定版）

著者: **Manus AI**  
更新日: 2026年8月11日  

> 本仕様はMVPの会計モデルを定義する。表示対象は原則として**金融資産残高**であり、不動産価値を含む純資産ではない。将来の純資産対応に必要なフィールドは予約する。

## 1. 用語と資産の分離

MVPでは資産を次の2つに分けて管理する。

| 項目 | 意味 | 運用益 | 主な増減 |
| --- | --- | --- | --- |
| `cashAssets` | 普通預金・現金等の残高 | なし | 収支余剰、生活費、イベント費、積立振替、ローン返済 |
| `investmentAssets` | 積立投資等の運用残高 | あり | 積立振替、運用益、赤字補填の取り崩し |
| `totalFinancialAssets` | `cashAssets + investmentAssets` | — | 結果画面で「金融資産残高」として表示 |

**投資積立は支出ではなく、現金資産から投資資産への振替である。** したがって、積立額を現金から減らし、同額を投資資産へ加える。総金融資産への純増は0であり、積立額を別途もう一度総資産へ加算してはならない。

## 2. 収入・生活費・積立の確定ルール

入力値は月額で受け取り、年次モデルでは12倍して扱う。

```text
annualIncome = monthlyIncome × 12
annualLivingExpenses = monthlyExpenses × 12
annualInvestmentContribution = monthlyInvestment × 12
annualFreeCashFlow = annualIncome - annualLivingExpenses - annualInvestmentContribution
```

`annualFreeCashFlow` は、積立投資を実行した後に残る現金の増減である。

```text
cashBeforeEvents = cashStart + annualFreeCashFlow
investmentBeforeEvents = investmentStart + annualInvestmentContribution + investmentGain
```

したがって、例として手取り月収30万円、生活費20万円、積立5万円の場合は、1年で次のようになる。

| 項目 | 金額 | 会計上の扱い |
| --- | ---: | --- |
| 年間収入 | 360万円 | 現金に加算 |
| 年間生活費 | 240万円 | 現金から減算 |
| 年間投資積立 | 60万円 | 現金から投資資産へ振替 |
| 現金として残る余剰 | 60万円 | 現金資産に加算 |
| 投資資産への移動 | 60万円 | 投資資産に加算 |
| 総金融資産の増加 | 120万円 | 現金60万円＋投資60万円 |

初期の金融資産100万円をすべて現金として扱う場合、利回り0%の1年後は、現金160万円、投資資産60万円、総金融資産220万円となる。ここで年間収入360万円を総金融資産へ直接加算することはしない。収入は生活費・積立・現金余剰へ配分済みだからである。

### 赤字時の補填順序

`annualFreeCashFlow` がマイナス、またはイベント費・ローン返済により現金が不足する場合は、まず現金資産を使う。現金で不足する部分だけを投資資産から取り崩す。投資資産の取り崩し額は、運用益を含む投資残高を超えない。

```text
cashAfterCashFlows = cashStart + annualIncome - annualLivingExpenses - annualInvestmentContribution - eventCashOutflow - loanRepayment
cashShortfall = max(0, -cashAfterCashFlows)
cashEnd = max(0, cashAfterCashFlows)
investmentEndBeforeWithdrawal = investmentStart + annualInvestmentContribution + investmentGain
investmentWithdrawal = min(cashShortfall, investmentEndBeforeWithdrawal)
investmentEnd = investmentEndBeforeWithdrawal - investmentWithdrawal
totalFinancialAssetsEnd = cashEnd + investmentEnd
```

投資積立は「投資資産を増やす処理」、赤字補填は「投資資産を減らす処理」として別々に記録するが、同じ金額を総金融資産へ二重加算しない。

## 3. 運用益と年間処理順序

月次複利計算を活用し、投資資産だけに運用利回りを適用する。MVPの年次処理では、年初投資残高に対して月次積立を行う順序を固定する。

```text
investmentBalance = investmentStart
for month in 1..12:
  investmentBalance = investmentBalance × (1 + annualReturnRate / 100 / 12)
  investmentBalance += monthlyInvestment
investmentGain = investmentBalance - investmentStart - annualInvestmentContribution
```

ライフイベントと年間収支は、年末の現金残高に反映する。1年間の確定処理順序は次の通りとする。

1. 前年末の `cashAssets` と `investmentAssets` を取得する。
2. 投資資産について、毎月「利回り適用 → 積立振替」を12回行う。
3. 年間収入を現金資産へ加算する。
4. 年間生活費を現金資産から減算する。
5. 年間投資積立分を現金資産から減算する。投資資産側には既に同額を加算済みであるため、ここで総資産へ追加加算しない。
6. その年のライフイベント費用を現金資産から減算する。
7. 住宅ローンの年間返済額を現金資産から減算する。
8. 現金不足があれば、投資資産から不足額を取り崩す。
9. `cashEnd + investmentEnd` を年末の `totalFinancialAssets` として確定する。
10. 年末の総金融資産が0未満になった場合はMVPの資産枯渇年とする。実装上は補填可能額を使い切った状態を0として保持し、`isDepleted` と `depletedAge` を別途記録する。

## 4. データ構造

```typescript
export type LifeEventType =
  | "marriage"
  | "housing"
  | "childbirth"
  | "education"
  | "retirement"
  | "other";

export interface HousingLoan {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  annualInterestRate: number;
  repaymentYears: number;
  annualRepayment: number;
  loanStartAge: number;
  loanEndAge: number;
}

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  title: string;
  age: number;
  cost: number;
  durationYears?: number;
  annualCost?: number;
  housingLoan?: HousingLoan;
}

export interface PlannerInput {
  currentAge: number;
  targetAge: number;
  currentCashAssets: number;
  currentInvestmentAssets: number;
  monthlyIncome: number;
  monthlyLivingExpenses: number;
  monthlyInvestmentContribution: number;
  annualReturnRate: number;
  retirementAge: number;
  annualRetirementIncome: number;
  retirementLivingExpenseRatio: number;
  lifeEvents: LifeEvent[];
}

export interface YearlyCashFlow {
  age: number;
  year: number;
  cashStart: number;
  investmentStart: number;
  annualIncome: number;
  annualLivingExpenses: number;
  annualInvestmentContribution: number;
  investmentGain: number;
  eventCost: number;
  loanRepayment: number;
  cashFlowBeforeWithdrawal: number;
  investmentWithdrawal: number;
  cashEnd: number;
  investmentEnd: number;
  totalFinancialAssets: number;
  netWorth?: number;
  activeEvents: string[];
  isDepleted: boolean;
  depletionMonth?: number;
}

export interface PlannerResult {
  yearlyRecords: YearlyCashFlow[];
  finalFinancialAssets: number;
  peakFinancialAssets: number;
  peakAge: number;
  isDepleted: boolean;
  depletedAge: number | null;
  depletedMonth: number | null;
  totalPrincipalContributed: number;
  totalInvestmentGain: number;
}
```

`netWorth` はMVPでは未使用とし、将来 `propertyValue - mortgageBalance + totalFinancialAssets` を実装するために予約する。住宅価格や借入額を金融資産残高へ加算してはならない。

## 5. 住宅ローン簡略モデル

MVPでは住宅購入を「金融資産から頭金を一括支出し、購入年の翌年から年間固定返済を支出する」モデルとする。住宅そのものの価値、税金、保険、修繕費、団信、繰上返済は金融資産残高に含めない。

```text
loanAmount = propertyPrice - downPayment
loanEndAge = purchaseAge + repaymentYears
```

年間返済額が入力されていればそれを優先する。入力されていない場合のみ、金利と返済期間から元利均等返済の月額を求めて12倍する。金利0%の場合は `loanAmount / repaymentYears` とする。

```text
monthlyRate = annualInterestRate / 100 / 12
months = repaymentYears × 12
monthlyPayment = loanAmount × monthlyRate × (1 + monthlyRate)^months / ((1 + monthlyRate)^months - 1)
annualRepayment = monthlyPayment × 12
```

購入年は頭金のみをイベント費として支出し、ローン返済は購入年の翌年から `repaymentYears` 年間適用する。したがって、4,000万円・頭金500万円・借入3,500万円の場合、購入年に金融資産が500万円減り、翌年から年間返済額が減る。借入3,500万円は金融資産への加算ではない。

## 6. 老後の取り崩し

`retirementAge` 以降は、労働収入を0円とし、`annualRetirementIncome` を任意の年金等収入として現金に加算する。生活費は `monthlyLivingExpenses × 12 × retirementLivingExpenseRatio` とする。積立投資は原則0円とし、資産運用は投資資産に対して継続する。

```text
annualIncome = retirementAge以降はannualRetirementIncome
annualLivingExpenses = monthlyLivingExpenses × 12 × retirementLivingExpenseRatio
annualInvestmentContribution = 0
```

したがって、老後も現金と投資資産を分けたまま、収入・生活費・イベント費・ローン返済・運用益・不足分取り崩しを同じ年間処理順序で計算する。資産が増えるか減るかは、年金等収入＋運用益と生活費・イベント費・返済額の差で決まる。

## 7. 資産枯渇判定

MVPでは年次判定を正式な基準とする。年末に現金資産と投資資産をすべて使っても年間支出を補えず、`totalFinancialAssets` が0未満になる年を枯渇年とする。表示上の残高は0円に丸め、`isDepleted: true` と `depletedAge` を保持する。

将来拡張として、枯渇年に限り月次キャッシュフローを追加計算し、`depletionMonth` に1〜12を保持する。MVPでは月次枯渇月を画面の必須表示にしない。

## 8. 指定テストケース

### ケースA：変化なし

条件は、現在金融資産100万円、収入0円、生活費0円、積立0円、利回り0%とする。期待結果は、現金資産または投資資産の初期配分を維持し、1年後の総金融資産が100万円のままとなることである。

### ケースB：収入・生活費・積立・現金余剰

条件は、初期現金資産100万円、手取り月収30万円、生活費20万円、積立5万円、利回り0%とする。

```text
年間収入 = 360万円
年間生活費 = 240万円
年間投資積立 = 60万円
現金余剰 = 360 - 240 - 60 = 60万円
投資資産への振替 = 60万円
```

期待結果は、1年後に現金資産160万円、投資資産60万円、総金融資産220万円となることである。収入360万円を総金融資産に別途加算してはならない。

### ケースC：年間モデルの資産枯渇

条件は、初期現金資産100万円、収入0円、生活費10万円/月、積立0円、利回り0%とする。年間支出は120万円であるため、年末の必要資金を満たせず、MVPでは `isDepleted: true`、`depletedAge: 対象年齢` となる。月次の約10ヶ月目という表示は将来拡張であり、MVPの合否判定には使わない。

### ケースD：住宅購入と返済

条件は、住宅価格4,000万円、頭金500万円、ローン3,500万円とする。期待結果は、購入年の頭金500万円だけが金融資産残高から減り、購入年に借入額3,500万円が金融資産へ加算されないこと、翌年から年間返済額が支出されることである。住宅価値とローン残高を含む純資産はMVP対象外である。

### 追加ケースE：積立増額比較

基準条件から月間積立額を1万円増やした場合、目標年齢時点の金融資産が基準ケースより減少してはならない。利回りが正で投資期間が正なら、増加額は追加積立元本以上になる可能性があるが、結果画面では試算であることを明記する。

### 追加ケースF：ライフイベント

任意の年齢にイベント費用を追加した場合、該当年の `eventCost` がその金額となり、イベントがない同一条件のケースより同年末の金融資産が減少することを確認する。

### 追加ケースG：枯渇

生活費またはイベント費が金融資産を上回る場合、`isDepleted` が真になり、`depletedAge` が最初の枯渇年に固定される。以降の年はマイナス残高を表示せず0円で保持する。

## 9. 受け入れ基準

実装は、ケースA〜D、積立増額比較、ライフイベント追加、資産枯渇のすべてで期待結果を満たし、TypeScriptの型チェックとビルドを通過することを条件とする。結果画面は「金融資産残高」と表記し、住宅価値を含まないこと、想定利回りが将来の成果を保証しないことを明記する。

## 10. MVPで扱わないもの

インフレ率、税金、社会保障制度の詳細、年齢別の昇給、厳密な住宅ローン諸費用、不動産評価、金融商品・証券会社の推奨、会員登録、課金、広告はMVPの計算対象外とする。
