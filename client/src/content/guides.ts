export type GuideBodyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type GuideArticle = {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  thumbnail: string;
  heroImage: string;
  summary: string;
  tags: string[];
  body: GuideBodyBlock[];
  assumptions: string[];
  cautions: string[];
  sources: string[];
  isDraft: boolean;
};

export const guides: GuideArticle[] = [
  {
    slug: "house-price-by-household-income",
    title: "世帯年収別に見る、無理なく買える家の価格とは？",
    category: "住宅",
    publishedAt: "2026.01.15",
    thumbnail: "/manus-storage/housing_d87c99a1.png",
    heroImage: "/manus-storage/09_house_7a2ef6b7.png",
    summary:
      "世帯年収と住まいにかけられる費用の考え方を、仮のケースでわかりやすく整理します。",
    tags: ["住宅", "家計", "ライフプラン"],
    body: [
      { type: "heading", text: "家の価格は年収だけで決めない" },
      {
        type: "paragraph",
        text: "家の価格を考えるときは、世帯年収だけでなく、毎月の生活費、頭金、将来の教育費、金利、購入後の維持費をまとめて確認することが大切です。ここでは考え方を説明するための仮ケースを使用しています。",
      },
      { type: "heading", text: "まず確認したい項目" },
      {
        type: "list",
        items: [
          "毎月無理なく返せる金額",
          "購入後も残しておきたい生活防衛資金",
          "教育・車・引っ越しなど今後の大きな支出",
          "金利や税金など、返済額以外の費用",
        ],
      },
      {
        type: "paragraph",
        text: "実際の購入判断では、この記事の仮データだけで結論を出さず、ご自身の条件をシミュレーターに入力して確認してください。",
      },
    ],
    assumptions: [
      "世帯年収別の具体的な価格目安は仮設定です。",
      "金利、税金、保険、修繕費は正式公開前に確認します。",
    ],
    cautions: [
      "住宅購入や住宅ローンの判断を推奨するものではありません。",
      "実際の借入可能額・返済可能額は金融機関や家計状況によって異なります。",
    ],
    sources: ["出典・参考資料は公開前に確認して確定します。"],
    isDraft: true,
  },
  {
    slug: "fixed-or-variable-mortgage",
    title: "住宅ローンは固定と変動どっち？メリット・デメリットを徹底比較",
    category: "住宅ローン",
    publishedAt: "2026.01.10",
    thumbnail: "/manus-storage/09_house_7a2ef6b7.png",
    heroImage: "/manus-storage/housing_d87c99a1.png",
    summary:
      "固定金利と変動金利の違いを、比較するときの視点とともに仮データで整理します。",
    tags: ["住宅ローン", "住宅", "金利"],
    body: [
      { type: "heading", text: "固定金利と変動金利の違い" },
      {
        type: "paragraph",
        text: "固定金利は返済額の見通しを立てやすく、変動金利は金利情勢によって返済額が変わる可能性があります。どちらが合うかは、将来の収入や支出、金利上昇への備えによって変わります。",
      },
      { type: "heading", text: "比較するときのチェックポイント" },
      {
        type: "list",
        items: [
          "毎月の返済額が家計に占める割合",
          "金利が上がった場合の余裕",
          "繰り上げ返済や借り換えの方針",
          "教育費や老後資金と住宅費のバランス",
        ],
      },
      {
        type: "paragraph",
        text: "金利タイプを選ぶ前に、住宅費だけでなく人生全体の資産推移を確認することをおすすめします。",
      },
    ],
    assumptions: [
      "金利水準・返済額の比較数値は仮設定です。",
      "返済期間や借入額はケーススタディ用の仮値です。",
    ],
    cautions: [
      "金利の将来推移を予測・保証するものではありません。",
      "具体的な契約条件は金融機関の最新情報をご確認ください。",
    ],
    sources: ["出典・参考資料は公開前に確認して確定します。"],
    isDraft: true,
  },
  {
    slug: "child-cost-by-age",
    title: "子ども1人にかかるお金はいくら？年齢別の費用をわかりやすく解説",
    category: "教育費",
    publishedAt: "2026.01.05",
    thumbnail: "/manus-storage/education_0880faf1.png",
    heroImage: "/manus-storage/education_0880faf1.png",
    summary:
      "子どもの年齢ごとに変わる支出を、教育費と日常費に分けて考えるための入門記事です。",
    tags: ["教育費", "子育て", "家計"],
    body: [
      { type: "heading", text: "年齢によって支出の種類が変わる" },
      {
        type: "paragraph",
        text: "子どもにかかるお金は、保育・学校関連費、習い事、食費、衣類、通学費などに分けて考えると整理しやすくなります。進学先や地域、家庭の方針によって金額は大きく変わります。",
      },
      { type: "heading", text: "家計に組み込むときの考え方" },
      {
        type: "list",
        items: [
          "年齢ごとの支出のピークを確認する",
          "教育費と生活費を分けて積み立てる",
          "住宅費・老後資金との優先順位を整理する",
          "公的支援や制度は最新情報を確認する",
        ],
      },
      {
        type: "paragraph",
        text: "この記事の仮データをそのまま利用せず、ご家庭の予定を入力して将来資産への影響をシミュレーションしてください。",
      },
    ],
    assumptions: [
      "年齢別の費用は説明用の仮データです。",
      "公立・私立、地域、進路による差は正式公開前に確認します。",
    ],
    cautions: [
      "教育費は家庭や進路によって大きく異なります。",
      "制度や助成金は変更される可能性があります。",
    ],
    sources: ["出典・参考資料は公開前に確認して確定します。"],
    isDraft: true,
  },
];

export function getGuideBySlug(slug: string) {
  return guides.find(article => article.slug === slug);
}

export function getRelatedGuides(article: GuideArticle, limit = 3) {
  return guides
    .filter(candidate => candidate.slug !== article.slug)
    .map(candidate => ({
      article: candidate,
      score:
        candidate.category === article.category
          ? 2
          : candidate.tags.some(tag => article.tags.includes(tag))
            ? 1
            : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article: candidate }) => candidate);
}
