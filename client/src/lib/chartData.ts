/**
 * Chart data transformation — LINE sticker-like result cards use the same
 * soft blue/mint visual language, while keeping the numerical path explicit:
 * yearlyRecords -> cash/investment/total series -> Recharts.
 */
import type { YearlyRecord } from "./simulator";

export interface AssetChartPoint {
  age: number;
  現金資産: number;
  投資資産: number;
  総金融資産: number;
  イベント費: number;
  イベント名: string;
  プランA_金融資産?: number;
  プランA_現金?: number;
  プランA_投資?: number;
  プランB_金融資産?: number;
  プランB_現金?: number;
  プランB_投資?: number;
}

export function buildAssetChartData(records: YearlyRecord[]): AssetChartPoint[] {
  return records
    .map((record) => ({
      age: record.age,
      現金資産: Math.round(record.cashEnd / 10_000),
      投資資産: Math.round(record.investmentEnd / 10_000),
      総金融資産: Math.round(record.totalFinancialAssets / 10_000),
      イベント費: Math.round(record.eventCost / 10_000),
      イベント名: record.activeEvents.join("・"),
      プランA_金融資産: Math.round(record.totalFinancialAssets / 10_000),
      プランA_現金: Math.round(record.cashEnd / 10_000),
      プランA_投資: Math.round(record.investmentEnd / 10_000),
    }))
    .sort((a, b) => a.age - b.age);
}

export function mergePlanBChartData(
  planA: AssetChartPoint[],
  planBRecords: YearlyRecord[],
): AssetChartPoint[] {
  const byAge = new Map(planA.map((point) => [point.age, { ...point }]));

  for (const record of planBRecords) {
    const point = byAge.get(record.age) ?? {
      age: record.age,
      現金資産: 0,
      投資資産: 0,
      総金融資産: 0,
      イベント費: 0,
      イベント名: "",
    };
    point.プランB_金融資産 = Math.round(record.totalFinancialAssets / 10_000);
    point.プランB_現金 = Math.round(record.cashEnd / 10_000);
    point.プランB_投資 = Math.round(record.investmentEnd / 10_000);
    byAge.set(record.age, point);
  }

  return Array.from(byAge.values()).sort((a, b) => a.age - b.age);
}
