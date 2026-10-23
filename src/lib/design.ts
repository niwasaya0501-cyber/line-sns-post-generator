// 投稿画像のデザイン（雰囲気・色）と、お店の目的の決まりごと。
// サーバー（表紙の合成）・画面（canvasでの合成・見本）・AIへの指示の全部から使う
import type { Goal } from "./buzz";
import type { Industry } from "./input";

export type FontSpec = { family: string; weight: 400 | 500 | 700 | 900 };

// 雰囲気。フォント・文字の置き方・写真の雰囲気・文章の口調をまとめて変える。
// フォントは Google Fonts の日本語フォント（使う文字だけを読み込む）
export const TASTES = {
  simple: {
    label: "シンプル",
    emoji: "◻️",
    note: "写真が主役。すっきり読みやすい",
    head: { family: "Zen Kaku Gothic New", weight: 700 },
    body: { family: "Zen Kaku Gothic New", weight: 500 },
    imageMood: "clean, airy and natural, bright soft daylight, uncluttered composition",
    tone: "飾りすぎない、分かりやすい言葉で。絵文字は1投稿に2〜3個まで",
  },
  elegant: {
    label: "きれい・上品",
    emoji: "🕊️",
    note: "明朝体と細い線で、大人っぽく",
    head: { family: "Shippori Mincho", weight: 700 },
    body: { family: "Shippori Mincho", weight: 500 },
    imageMood: "refined and elegant, muted tones, gentle diffused light, lots of negative space, editorial magazine style",
    tone: "落ち着いた丁寧な言葉で。絵文字は控えめ（1投稿に1〜2個）。体言止めも使って、余韻のある文章に",
  },
  cute: {
    label: "かわいい",
    emoji: "🎀",
    note: "丸い文字とやわらかい色で、親しみやすく",
    head: { family: "Zen Maru Gothic", weight: 700 },
    body: { family: "Zen Maru Gothic", weight: 500 },
    imageMood: "cute and cheerful, soft pastel colors, bright and warm light, playful but tidy styling",
    tone: "やわらかく親しみやすい話し言葉で。絵文字は1投稿に3〜5個",
  },
  cool: {
    label: "かっこいい",
    emoji: "🖤",
    note: "太い文字と濃い色で、印象に残る",
    head: { family: "Dela Gothic One", weight: 400 },
    body: { family: "Zen Kaku Gothic New", weight: 700 },
    imageMood: "bold and stylish, moody high-contrast lighting, deep shadows, strong graphic composition",
    tone: "短く言い切る、自信のある言葉で。絵文字は使っても1〜2個",
  },
} as const satisfies Record<string, { head: FontSpec; body: FontSpec } & Record<string, unknown>>;

export type Taste = keyof typeof TASTES;

// 色。base=2枚目以降の背景、soft=飾り、accent=見出し・線、ink=本文、dark=濃い背景、pop=濃い背景の上の差し色
export const PALETTES = {
  beige: { label: "ベージュ", base: "#F4EEE6", soft: "#E4D5C1", accent: "#8C6A4C", ink: "#3A3029", dark: "#2B231D", pop: "#D9B68C", imageColor: "warm beige, cream and light wood tones" },
  pink: { label: "ピンク", base: "#FBF0F2", soft: "#F4CFD7", accent: "#B95570", ink: "#45292F", dark: "#33191F", pop: "#FF9CB4", imageColor: "soft dusty pink and white tones" },
  orange: { label: "オレンジ", base: "#FFF4E8", soft: "#FFD7AE", accent: "#C4601A", ink: "#3D2717", dark: "#2B1B10", pop: "#FF9A3D", imageColor: "warm orange, amber and golden tones" },
  green: { label: "グリーン", base: "#EFF4EE", soft: "#CCDDC8", accent: "#47714E", ink: "#25352A", dark: "#18251C", pop: "#9BD3A0", imageColor: "fresh green and natural earthy tones" },
  blue: { label: "ブルー", base: "#EEF3F8", soft: "#CADAEA", accent: "#3A6591", ink: "#21303D", dark: "#141F2A", pop: "#8EC3F2", imageColor: "calm blue, white and light gray tones" },
  black: { label: "ブラック", base: "#F2F1EE", soft: "#D8D6D0", accent: "#1E1E1E", ink: "#1E1E1E", dark: "#0F0F0F", pop: "#E2C275", imageColor: "monochrome black, charcoal and white tones with a hint of gold" },
} as const;

export type Palette = keyof typeof PALETTES;
export type PaletteColors = (typeof PALETTES)[Palette];

// 業種ごとのおすすめ。色の印象は「飲食は暖色が料理をおいしく見せる」「健康系は緑・青が落ち着きと安心感」
// 「女性向けの美容は淡い色・くすみ色が好まれやすい」といった、よく言われる傾向をもとにしている
export const INDUSTRY_DESIGN: Record<Industry, { taste: Taste; palette: Palette; why: string }> = {
  hair: { taste: "elegant", palette: "beige", why: "美容院は、くすみ系の淡い色と明朝体で「おしゃれで落ち着いたお店」に見せる投稿が多く見られます" },
  food: { taste: "simple", palette: "orange", why: "飲食店は、オレンジなどの暖色が料理をおいしそうに見せるといわれます。写真が主役のシンプルな形が合います" },
  seitai: { taste: "simple", palette: "green", why: "整体・健康系は、緑や青が落ち着きと安心感を伝えるといわれます。情報を読みやすく見せる形が合います" },
  nail: { taste: "cute", palette: "pink", why: "ネイル・まつげは、淡いピンクと丸い文字の「かわいい」投稿が、女性のお客様に好まれやすいジャンルです" },
  retail: { taste: "elegant", palette: "black", why: "物販・雑貨は、モノトーンと明朝体で商品を引き立てる、雑誌のような見せ方が人気です" },
  other: { taste: "simple", palette: "blue", why: "青は誠実さ・信頼感を伝えるといわれ、どの業種にも使いやすい色です" },
};

// お店のいちばんの目的。1週間の「狙い」の組み合わせと、文章で強めることを変える
export const PURPOSES = {
  awareness: {
    label: "新しいお客様に知ってもらう",
    emoji: "👀",
    note: "保存・シェアされる投稿を多めに",
    prompt: "まだお店を知らない人に見つけてもらい、覚えてもらうこと。役に立つ情報や共感で保存・シェアを集め、お店の名前と特徴が自然に伝わるようにする",
  },
  visit: {
    label: "来店・予約を増やす",
    emoji: "📅",
    note: "来店のきっかけになる投稿を多めに",
    prompt: "来店・予約につなげること。「行ってみたい」と思える場面・体験を具体的に描き、予約や来店の方法を分かりやすく案内する（入力に無い方法は【要確認】）",
  },
  sales: {
    label: "商品・メニューを売る",
    emoji: "🛒",
    note: "商品の魅力と買い方を伝える投稿を多めに",
    prompt: "商品・メニューを買ってもらうこと。選ばれる理由・使う場面・こだわりを具体的に伝え、買い方・注文方法を案内する（価格・在庫・販売方法で入力に無いものは【要確認】）",
  },
  fans: {
    label: "常連さん・ファンを増やす",
    emoji: "🤝",
    note: "会話が生まれる投稿を多めに",
    prompt: "今のお客様にもっと好きになってもらうこと。お店の想い・裏側・スタッフの人柄を伝え、コメントで会話が生まれるようにする",
  },
} as const;

export type Purpose = keyof typeof PURPOSES;

// 目的ごとの「狙い」の組み合わせ（投稿数ごと）。来店・購入の案内ばかりにならないよう、保存や共感の投稿も混ぜる
export const PURPOSE_GOALS: Record<Purpose, Record<number, Goal[]>> = {
  awareness: {
    2: ["save", "visit"],
    3: ["save", "share", "visit"],
    5: ["save", "share", "comment", "save", "visit"],
    7: ["save", "share", "comment", "save", "visit", "share", "save"],
  },
  visit: {
    2: ["save", "visit"],
    3: ["save", "visit", "visit"],
    5: ["save", "visit", "share", "comment", "visit"],
    7: ["save", "visit", "share", "save", "visit", "comment", "visit"],
  },
  sales: {
    2: ["save", "buy"],
    3: ["save", "buy", "buy"],
    5: ["save", "buy", "share", "comment", "buy"],
    7: ["save", "buy", "share", "save", "buy", "comment", "buy"],
  },
  fans: {
    2: ["comment", "save"],
    3: ["comment", "share", "save"],
    5: ["comment", "save", "share", "comment", "visit"],
    7: ["comment", "share", "save", "comment", "share", "visit", "comment"],
  },
};

export type Design = { taste: Taste; palette: Palette };

// 未選択や、この機能を足す前に作った投稿案では、業種のおすすめを使う
export function resolveDesign(input: { industry: Industry; taste?: Taste; palette?: Palette }): Design {
  const rec = INDUSTRY_DESIGN[input.industry];
  return { taste: input.taste ?? rec.taste, palette: input.palette ?? rec.palette };
}

// 写真が無いとき（生成失敗）に表紙の背景にするグラデーション
export function fallbackGradient(palette: Palette): readonly [string, string] {
  const p = PALETTES[palette];
  return [p.soft, p.accent];
}
