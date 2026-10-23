import { z } from "zod";
import { PALETTES, PURPOSES, TASTES, type Palette, type Purpose, type Taste } from "./design";

// 業種ごとの表示名。おすすめのデザイン（雰囲気・色）は design.ts の INDUSTRY_DESIGN。
// strict=true の業種（美容・健康系）は、効果をうたう表現のチェックも行う
export const INDUSTRIES = {
  hair: { label: "美容院・ヘアサロン", short: "美容院", emoji: "💇", strict: true },
  food: { label: "飲食店・カフェ", short: "飲食・カフェ", emoji: "🍽️", strict: false },
  seitai: { label: "整体・マッサージ", short: "整体・マッサージ", emoji: "💆", strict: true },
  nail: { label: "ネイル・まつげ", short: "ネイル・まつげ", emoji: "💅", strict: true },
  retail: { label: "物販・雑貨", short: "物販・雑貨", emoji: "🛍️", strict: false },
  other: { label: "その他", short: "その他", emoji: "✨", strict: false },
} as const;

export type Industry = keyof typeof INDUSTRIES;

export const FREQUENCIES = {
  daily: { label: "毎日", days: [0, 1, 2, 3, 4, 5, 6] },
  "5pw": { label: "週5回", days: [0, 1, 2, 3, 4] },
  "3pw": { label: "週3回", days: [0, 2, 4] },
  "2pw": { label: "週2回", days: [0, 3] },
} as const;

export type Frequency = keyof typeof FREQUENCIES;

// 画像の用意のしかた。own（自分の写真）は、写真を端末の中だけで合成し、サーバーには送らない
export const IMAGE_MODES = {
  ai: { label: "AIに作ってもらう", emoji: "✨", note: "表紙の写真をAIが作ります（1分ほど）" },
  own: { label: "自分の写真を使う", emoji: "📷", note: "完成後に写真を選ぶと、文字を重ねます。写真は送信されません" },
} as const;

export type ImageMode = keyof typeof IMAGE_MODES;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max}文字以内で入力してください`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const planInputSchema = z.object({
  industry: z.enum(Object.keys(INDUSTRIES) as [Industry, ...Industry[]]),
  concept: z
    .string()
    .trim()
    .min(1, "お店・事業の一言を入力してください")
    .max(200, "200文字以内で入力してください"),
  shopName: optionalText(30),
  // 「地名＋業種」で探されることが多いため、検索ワードに使う（入力が無ければ地名は使わない）
  area: optionalText(30),
  frequency: z
    .enum(Object.keys(FREQUENCIES) as [Frequency, ...Frequency[]])
    .default("daily"),
  imageMode: z.enum(Object.keys(IMAGE_MODES) as [ImageMode, ...ImageMode[]]).default("ai"),
  // デザインと目的は任意。未選択なら業種のおすすめ・バランス型を使う（design.ts の resolveDesign / assignGoals）
  taste: z.enum(Object.keys(TASTES) as [Taste, ...Taste[]]).optional(),
  palette: z.enum(Object.keys(PALETTES) as [Palette, ...Palette[]]).optional(),
  purpose: z.enum(Object.keys(PURPOSES) as [Purpose, ...Purpose[]]).optional(),
  event: optionalText(300),
  strengths: optionalText(300),
  target: optionalText(200),
});

export type PlanInput = z.infer<typeof planInputSchema>;
