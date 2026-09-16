const loan = 30_000_000;
const years = 35;
const months = years * 12;
const rates = [
  { label: "固定（フラット35・2026年9月最頻金利）", rate: 3.46 },
  { label: "変動・比較仮定", rate: 1.0 },
  { label: "変動・上昇ケース", rate: 1.5 },
  { label: "変動・上昇ケース", rate: 2.0 },
  { label: "変動・上昇ケース", rate: 3.0 },
];

for (const item of rates) {
  const monthlyRate = item.rate / 100 / 12;
  const monthly =
    monthlyRate === 0
      ? loan / months
      : (loan * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);
  const total = monthly * months;
  console.log(
    JSON.stringify({
      ...item,
      monthly: Math.round(monthly),
      annual: Math.round(monthly * 12),
      total: Math.round(total),
    })
  );
}
