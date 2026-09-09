import type { ImprovementProposal } from "./simulator";

export type PrimaryImprovementMetric = "shortfall" | "life" | null;

export interface ImprovementDisplayMetrics {
  beforeLifeAge: number;
  afterLifeAge: number;
  beforeLifeLabel: string;
  afterLifeLabel: string;
  lifeExtensionYears: number;
  beforeTargetAgeAssets: number;
  afterTargetAgeAssets: number;
  targetAgeAssetIncrease: number;
  shortfallImprovement: number;
  showLifeExtension: boolean;
  showShortfallImprovement: boolean;
  primaryMetric: PrimaryImprovementMetric;
}

/**
 * 改善提案カード専用の表示用差分計算。
 * シミュレーション結果そのものは変更せず、変化がある指標だけを返す。
 */
export function getImprovementDisplayMetrics(
  proposal: ImprovementProposal | null,
  retirementEndAge: number,
): ImprovementDisplayMetrics | null {
  if (!proposal) return null;

  const beforeLifeAge = proposal.beforeDepletedAge ?? retirementEndAge;
  const afterLifeAge = proposal.afterDepletedAge ?? retirementEndAge;
  const lifeExtensionYears = Math.max(0, afterLifeAge - beforeLifeAge);
  const beforeTargetAgeAssets = proposal.beforeTargetAgeAssets;
  const afterTargetAgeAssets = proposal.updatedResult.targetAgeAssets;
  const targetAgeAssetIncrease = afterTargetAgeAssets - beforeTargetAgeAssets;
  const shortfallImprovement = Math.max(0, proposal.beforeShortfall - proposal.afterShortfall);
  const showLifeExtension = lifeExtensionYears > 0;
  const showShortfallImprovement = shortfallImprovement > 0;

  return {
    beforeLifeAge,
    afterLifeAge,
    beforeLifeLabel: proposal.beforeDepletedAge === null ? `${retirementEndAge}歳以上` : `${beforeLifeAge}歳`,
    afterLifeLabel: proposal.afterDepletedAge === null ? `${retirementEndAge}歳以上` : `${afterLifeAge}歳`,
    lifeExtensionYears,
    beforeTargetAgeAssets,
    afterTargetAgeAssets,
    targetAgeAssetIncrease,
    shortfallImprovement,
    showLifeExtension,
    showShortfallImprovement,
    // 金額の改善は初心者が最も判断しやすい主指標。金額がない場合は寿命延長を主指標にする。
    primaryMetric: showShortfallImprovement ? "shortfall" : showLifeExtension ? "life" : null,
  };
}
