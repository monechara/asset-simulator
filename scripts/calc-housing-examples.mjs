const cases = [
  {
    income: 4_000_000,
    price: 30_000_000,
    down: 3_000_000,
    loan: 27_000_000,
    annualRate: 0.01,
    years: 35,
  },
  {
    income: 6_000_000,
    price: 45_000_000,
    down: 5_000_000,
    loan: 40_000_000,
    annualRate: 0.012,
    years: 35,
  },
  {
    income: 8_000_000,
    price: 60_000_000,
    down: 8_000_000,
    loan: 52_000_000,
    annualRate: 0.015,
    years: 35,
  },
];

for (const item of cases) {
  const months = item.years * 12;
  const monthlyRate = item.annualRate / 12;
  const monthlyPayment =
    (item.loan * monthlyRate * (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1);
  const annualPayment = monthlyPayment * 12;
  const ratio = (annualPayment / item.income) * 100;
  console.log(
    JSON.stringify({
      ...item,
      monthlyPayment: Math.round(monthlyPayment / 100) * 100,
      annualPayment: Math.round(annualPayment / 100) * 100,
      ratio: Number(ratio.toFixed(1)),
    })
  );
}
