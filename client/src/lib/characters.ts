/**
 * マネキャラ - 12タイプのお金の性格診断
 * 各タイプは、図鑑No.、診断結果、特徴、強み、弱み、改善ポイント、おすすめ習慣、投資スタイルを定義
 */

export interface CharacterType {
  id: string;
  no: number; // 図鑑番号
  name: string; // キャラクター名
  emoji: string; // 絵文字
  catchphrase: string; // ユーモアのある一言
  walletMessage: string; // 「あなたの財布から一言」
  description: string; // 特徴
  strengths: string[]; // 強み
  weaknesses: string[]; // 弱み
  improvements: string; // 改善ポイント
  habits: string[]; // おすすめのお金の習慣
  investmentStyle: string; // おすすめ投資スタイル
  color: string; // ブランドカラー
  compatibleType: string; // 相性の良いタイプ名
  nationalPercentage: number; // 全国の診断者の割合（%）
  temptationResistance: number; // 誘惑耐性（1-5）
  assetGrowthPotential: number; // 資産成長ポテンシャル（1-5）
  wasteDangerLevel: number; // 浪費危険度（1-5）
}

export const CHARACTER_TYPES: CharacterType[] = [
  {
    id: "spender",
    no: 1,
    name: "散財サル",
    emoji: "🐵",
    catchphrase: "給料日は社長、25日には仙人。",
    walletMessage: "今日はコンビニをスルーしてくれ…。俺も休みたい。",
    description:
      "欲しいものはすぐに買ってしまう。セールに弱く、衝動買いが多い。でも人付き合いは良く、友達と遊ぶのが大好き。",
    strengths: [
      "人間関係が豊か",
      "人生を楽しむ姿勢",
      "決断が早い",
      "経験を大切にする",
    ],
    weaknesses: [
      "衝動買いが多い",
      "貯金ができない",
      "家計管理が苦手",
      "将来への不安を先延ばしにする",
    ],
    improvements:
      "毎月の『使える額』を決めて、その範囲内で楽しむ。クレジットカードより現金管理がおすすめ。",
    habits: [
      "毎月の予算を決める",
      "1週間の『欲しい』リストを作る",
      "給料の10%は貯金に回す",
    ],
    investmentStyle:
      "長期の自動積立。感情的な売却を避けるため、月1回の定額投資がおすすめ。",
    color: "#FF6B6B",
    compatibleType: "積立ペンギン",
    nationalPercentage: 18,
    temptationResistance: 2,
    assetGrowthPotential: 2,
    wasteDangerLevel: 5,
  },
  {
    id: "miser",
    no: 2,
    name: "ドケチガニ",
    emoji: "🦀",
    catchphrase: "1円の価値は1円。無駄は人生の敵。",
    walletMessage: "そのお金、本当に必要？俺に相談してくれ。",
    description:
      "とにかくお金を使うことが怖い。貯金通帳を見ると安心する。でも、その貯金を何に使うかは決まっていない。",
    strengths: [
      "貯金が得意",
      "家計管理が徹底的",
      "無駄を見つけるのが上手",
      "長期的な視点を持つ",
    ],
    weaknesses: [
      "人生を楽しむ余裕がない",
      "人間関係にお金をかけられない",
      "貯金が目的になっている",
      "投資に踏み出せない",
    ],
    improvements:
      "貯金の20%は『人生を豊かにするお金』として使う。完璧を目指さず、『ほどよい貯金』を心がけよう。",
    habits: [
      "月1回、好きなものに1000円使う",
      "貯金の目的を明確にする",
      "年1回、貯金で何かを買う計画を立てる",
    ],
    investmentStyle:
      "低リスク商品から始める。投資信託の定額積立で、徐々に資産を増やす。",
    color: "#4ECDC4",
    compatibleType: "散財サル",
    nationalPercentage: 12,
    temptationResistance: 5,
    assetGrowthPotential: 4,
    wasteDangerLevel: 1,
  },
  {
    id: "pointCollector",
    no: 3,
    name: "ポイ活タヌキ",
    emoji: "🦝",
    catchphrase: "ポイントは第二の給料。1ポイントも無駄にしない。",
    walletMessage: "そのポイント、失効する前に使ってくれ…。",
    description:
      "ポイント、クーポン、セールに敏感。お得情報を見つけるのが得意。でも、本当に必要なものかは考えていない。",
    strengths: [
      "お得情報に敏感",
      "家計管理の工夫が上手",
      "節約スキルが高い",
      "比較検討が得意",
    ],
    weaknesses: [
      "ポイント目当てで買ってしまう",
      "手間をかけすぎる",
      "本質的な貯金ができていない",
      "ポイント失効のリスク",
    ],
    improvements:
      "ポイント活動は『おまけ』。本当に必要なものを買うことを優先しよう。",
    habits: [
      "月1回、ポイント残高を確認する",
      "ポイント失効日をカレンダーに記入",
      "ポイントは貯金に回す",
    ],
    investmentStyle:
      "ポイント投資。楽天ポイント投資やdポイント投資から始めるのがおすすめ。",
    color: "#FFD93D",
    compatibleType: "ポイ活タヌキ",
    nationalPercentage: 15,
    temptationResistance: 3,
    assetGrowthPotential: 3,
    wasteDangerLevel: 3,
  },
  {
    id: "saver",
    no: 4,
    name: "積立ペンギン",
    emoji: "🐧",
    catchphrase: "毎月の積立が、10年後の自信になる。",
    walletMessage: "今月も積立完了。俺たちの未来は明るい。",
    description:
      "毎月、決まった額を貯金・投資している。計画的で、将来への不安が少ない。でも、時々『本当にこれでいいのか』と迷う。",
    strengths: [
      "計画性がある",
      "継続力がある",
      "将来への不安が少ない",
      "資産が着実に増える",
    ],
    weaknesses: [
      "柔軟性に欠ける",
      "人生を楽しむ余裕がない",
      "投資の知識が浅い",
      "計画の見直しをしない",
    ],
    improvements:
      "年1回、貯金・投資の計画を見直そう。人生の変化に合わせて、柔軟に調整することが大切。",
    habits: [
      "毎月、自動積立を設定する",
      "年1回、家計診断を受ける",
      "貯金目標を『金額』から『時間軸』に変える",
    ],
    investmentStyle:
      "インデックス投資。毎月の定額積立で、着実に資産を増やす。",
    color: "#95E1D3",
    compatibleType: "投資オタクフクロウ",
    nationalPercentage: 14,
    temptationResistance: 4,
    assetGrowthPotential: 5,
    wasteDangerLevel: 1,
  },
  {
    id: "investor",
    no: 5,
    name: "投資オタクフクロウ",
    emoji: "🦉",
    catchphrase: "複利は人類最高の発明。72の法則は人生の羅針盤。",
    walletMessage: "今月のポートフォリオ、見てくれ。完璧だ。",
    description:
      "投資の知識が豊富。株、投信、仮想通貨など、いろいろ試している。でも、時々『本当に大丈夫か』と不安になる。",
    strengths: [
      "投資知識が豊富",
      "リスク管理が上手",
      "長期的な視点を持つ",
      "資産が増えている",
    ],
    weaknesses: [
      "情報に振り回される",
      "ポートフォリオが複雑",
      "短期的な値動きに一喜一憂する",
      "周囲に理解されない",
    ],
    improvements:
      "投資の基本に立ち返ろう。複雑さより、シンプルで長期的な戦略を優先しよう。",
    habits: [
      "月1回、ポートフォリオを見直す",
      "投資の勉強を続ける",
      "感情的な売却をしない",
    ],
    investmentStyle:
      "分散投資。国内外の株式、債券、不動産など、複数の資産クラスに投資する。",
    color: "#AA96DA",
    compatibleType: "積立ペンギン",
    nationalPercentage: 8,
    temptationResistance: 4,
    assetGrowthPotential: 5,
    wasteDangerLevel: 2,
  },
  {
    id: "vain",
    no: 6,
    name: "見栄っ張りキツネ",
    emoji: "🦊",
    catchphrase: "人生は見た目。でも、通帳の中身は見られない。",
    walletMessage: "このブランド品、本当に似合ってるよね？",
    description:
      "ブランド品、高級レストラン、最新ガジェット。人に見える『豊かさ』を大切にする。でも、実は貯金がない。",
    strengths: [
      "人付き合いが上手",
      "トレンドに敏感",
      "人生を楽しむ姿勢",
      "自己投資ができる",
    ],
    weaknesses: [
      "見栄で無駄な支出が多い",
      "貯金がない",
      "ローンに頼りやすい",
      "人間関係の出費が多い",
    ],
    improvements:
      "『本当に好きなもの』と『見栄のためのもの』を分ける。質の高い選択肢を、計画的に買おう。",
    habits: [
      "1週間、欲しいものを寝かせてから買う",
      "月1回、『本当に必要か』を問い直す",
      "貯金と見栄のバランスを50:50にする",
    ],
    investmentStyle:
      "自分の成長に投資。セミナーや本、スキルアップに投資することで、本当の豊かさを手に入れる。",
    color: "#F38181",
    compatibleType: "太っ腹ライオン",
    nationalPercentage: 11,
    temptationResistance: 2,
    assetGrowthPotential: 2,
    wasteDangerLevel: 4,
  },
  {
    id: "procrastinator",
    no: 7,
    name: "先延ばしナマケモノ",
    emoji: "🦥",
    catchphrase: "明日でいいや。でも、明日も同じことを言っている。",
    walletMessage: "貯金の話？また明日でいいや…。",
    description:
      "家計簿もつけていないし、貯金もしていない。『いつかやろう』と思いながら、ずっと先延ばしにしている。",
    strengths: [
      "ストレスが少ない",
      "柔軟な思考を持つ",
      "人生を気楽に楽しむ",
      "完璧を目指さない",
    ],
    weaknesses: [
      "貯金がない",
      "家計管理ができていない",
      "将来への不安が大きい",
      "行動に移せない",
    ],
    improvements:
      "『完璧』を目指さず、『今日からできることを1つ』から始めよう。小さな行動が、大きな変化を生む。",
    habits: [
      "今日から、家計簿アプリを入れる",
      "月1回、貯金目標を見直す",
      "友達と『貯金の話』をする",
    ],
    investmentStyle:
      "ロボアドバイザー。自動で投資してくれるので、手間がかからない。",
    color: "#C7CEEA",
    compatibleType: "積立ペンギン",
    nationalPercentage: 10,
    temptationResistance: 2,
    assetGrowthPotential: 3,
    wasteDangerLevel: 4,
  },
  {
    id: "gambler",
    no: 8,
    name: "一発逆転ドラゴン",
    emoji: "🐉",
    catchphrase: "人生は一発逆転。宝くじより、株で大儲けを狙う。",
    walletMessage: "今月は大勝利。来月も狙ってる。",
    description:
      "堅実な貯金より、大きなリターンを狙う。ハイリスク・ハイリターンの投資に惹かれる。でも、失敗も多い。",
    strengths: [
      "チャレンジ精神がある",
      "大きな夢を持つ",
      "行動力がある",
      "失敗から学ぶ",
    ],
    weaknesses: [
      "リスク管理が甘い",
      "感情的な判断をしやすい",
      "損失を取り戻そうとして、さらに損する",
      "貯金がない",
    ],
    improvements:
      "『余剰資金の10%だけ』をハイリスク投資に回す。90%は堅実に貯金・投資しよう。",
    habits: [
      "投資ルールを決めて、守る",
      "月1回、投資成績を見直す",
      "損切りのルールを決める",
    ],
    investmentStyle:
      "分散投資＋成長株。基本は堅実に、その上で成長性の高い企業に少額投資。",
    color: "#FF6B9D",
    compatibleType: "投資オタクフクロウ",
    nationalPercentage: 7,
    temptationResistance: 1,
    assetGrowthPotential: 4,
    wasteDangerLevel: 5,
  },
  {
    id: "frog",
    no: 9,
    name: "割り勘カエル",
    emoji: "🐸",
    catchphrase: "友情は割り勘で成り立つ。1円の誤差も許さない。",
    walletMessage: "ちょっと待ってくれ。計算機を出す。",
    description:
      "友達との食事は必ず割り勘。細かいお金の計算が好き。でも、時々『もっと気楽に付き合えたら』と思う。",
    strengths: [
      "公平性を大切にする",
      "細かい計算が得意",
      "ズルをしない",
      "信頼できる友人",
    ],
    weaknesses: [
      "人間関係が窮屈になる",
      "臨機応変に対応できない",
      "友人に嫌がられることもある",
      "人生を楽しむ余裕がない",
    ],
    improvements:
      "時には『奢る』『奢られる』を気楽に受け入れよう。人間関係は割り勘だけじゃ成り立たない。",
    habits: [
      "月1回は『奢る側』になる",
      "友人の誕生日には奮発する",
      "割り勘以外の付き合い方を試す",
    ],
    investmentStyle:
      "バランス型投資。リスクとリターンのバランスを大切にした投資。",
    color: "#7FDB92",
    compatibleType: "太っ腹ライオン",
    nationalPercentage: 9,
    temptationResistance: 3,
    assetGrowthPotential: 3,
    wasteDangerLevel: 2,
  },
  {
    id: "lion",
    no: 10,
    name: "太っ腹ライオン",
    emoji: "🦁",
    catchphrase: "お金は使ってナンボ。友人のためなら惜しみなく。",
    walletMessage: "今日は俺が奢るよ。遠慮するなよ。",
    description:
      "友人や家族のためなら、お金を惜しまない。人間関係を大切にする。でも、自分の貯金はほぼゼロ。",
    strengths: [
      "人間関係が豊か",
      "人望がある",
      "人生を楽しむ",
      "周囲を幸せにする",
    ],
    weaknesses: [
      "自分の貯金がない",
      "人に頼られすぎる",
      "返してもらえないことも多い",
      "将来への不安が大きい",
    ],
    improvements:
      "『奢る』ことは素晴らしいが、自分の貯金も大切。バランスを取ることが重要。",
    habits: [
      "月の貯金目標を決める",
      "『奢る額』を決めておく",
      "友人にも『貯金の話』をする",
    ],
    investmentStyle:
      "社会貢献投資。ESG投資など、社会に良い影響を与える投資。",
    color: "#FFB347",
    compatibleType: "割り勘カエル",
    nationalPercentage: 8,
    temptationResistance: 2,
    assetGrowthPotential: 2,
    wasteDangerLevel: 4,
  },
  {
    id: "swan",
    no: 11,
    name: "ご褒美ハクチョウ",
    emoji: "🦢",
    catchphrase: "頑張った自分へのご褒美。月1回の贅沢は人生の潤い。",
    walletMessage: "今月も頑張ったね。ご褒美を買おう。",
    description:
      "普段は節約しているが、月1回は自分へのご褒美を買う。メリハリのある家計管理を心がけている。",
    strengths: [
      "メリハリのある家計管理",
      "自分を大切にする",
      "モチベーションが高い",
      "人生を楽しみながら貯金できる",
    ],
    weaknesses: [
      "『ご褒美』の基準が曖昧",
      "つい『ご褒美』が増える",
      "衝動買いの言い訳になる",
      "計画性に欠ける",
    ],
    improvements:
      "『ご褒美』の予算を決めて、その範囲内で楽しもう。メリハリは大切だが、計画性も同じくらい大切。",
    habits: [
      "月の『ご褒美予算』を決める",
      "『ご褒美』の内容を事前に決める",
      "ご褒美以外は節約する",
    ],
    investmentStyle:
      "バランス型投資＋ご褒美投資。基本はバランス型、その上で好きな企業に少額投資。",
    color: "#E0BBE4",
    compatibleType: "ご褒美ハクチョウ",
    nationalPercentage: 13,
    temptationResistance: 3,
    assetGrowthPotential: 3,
    wasteDangerLevel: 2,
  },
  {
    id: "rabbit",
    no: 12,
    name: "SALEウサギ",
    emoji: "🐰",
    catchphrase: "セールは戦場。30%オフは買わない理由にならない。",
    walletMessage: "あ、セール始まった。行かなきゃ。",
    description:
      "セールやキャンペーン情報に敏感。『安い』という理由で買ってしまう。でも、本当に必要なのか疑問。",
    strengths: [
      "セール情報に敏感",
      "お得な買い物ができる",
      "比較検討が得意",
      "流行に乗れる",
    ],
    weaknesses: [
      "『安さ』に惑わされる",
      "本当に必要かを考えない",
      "不要な買い物が増える",
      "貯金ができない",
    ],
    improvements:
      "セールは『安い』だけじゃなく、『本当に必要か』を問い直そう。セール=買う理由ではない。",
    habits: [
      "セール前に『欲しいもの』を決める",
      "1週間寝かせてから買う",
      "セール情報は見ない週を作る",
    ],
    investmentStyle:
      "つみたてNISA。セールに惑わされず、毎月の定額投資で着実に資産を増やす。",
    color: "#FFE5B4",
    compatibleType: "ポイ活タヌキ",
    nationalPercentage: 15,
    temptationResistance: 2,
    assetGrowthPotential: 2,
    wasteDangerLevel: 4,
  },
];

export function getCharacterType(id: string): CharacterType | undefined {
  return CHARACTER_TYPES.find((char) => char.id === id);
}

export function getCharacterTypeByNo(no: number): CharacterType | undefined {
  return CHARACTER_TYPES.find((char) => char.no === no);
}

export function getAllCharacters(): CharacterType[] {
  return CHARACTER_TYPES;
}
