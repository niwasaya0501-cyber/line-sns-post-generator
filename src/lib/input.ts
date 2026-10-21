import { z } from "zod";

// 業種ごとの表示名・画像の雰囲気・代替背景の色。
// strict=true の業種（美容・健康系）は、効果をうたう表現のチェックも行う
export const INDUSTRIES = {
  hair: { label: "美容院・ヘアサロン", short: "美容院", emoji: "💇", strict: true, colors: ["#C8A98B", "#6E5644"] },
  food: { label: "飲食店・カフェ", short: "飲食・カフェ", emoji: "🍽️", strict: false, colors: ["#E9B872", "#9C5B2E"] },
  seitai: { label: "整体・マッサージ", short: "整体・マッサージ", emoji: "💆", strict: true, colors: ["#A8C3A0", "#4F6B4A"] },
  nail: { label: "ネイル・まつげ", short: "ネイル・まつげ", emoji: "💅", strict: true, colors: ["#E8B4C0", "#9A5466"] },
  retail: { label: "物販・雑貨", short: "物販・雑貨", emoji: "🛍️", strict: false, colors: ["#A9BFD8", "#45607E"] },
  other: { label: "その他", short: "その他", emoji: "✨", strict: false, colors: ["#C9C3B8", "#5E584F"] },
} as const;

export type Industry = keyof typeof INDUSTRIES;

export const FREQUENCIES = {
  daily: { label: "毎日", days: [0, 1, 2, 3, 4, 5, 6] },
  "5pw": { label: "週5回", days: [0, 1, 2, 3, 4] },
  "3pw": { label: "週3回", days: [0, 2, 4] },
  "2pw": { label: "週2回", days: [0, 3] },
} as const;

export type Frequency = keyof typeof FREQUENCIES;

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
  frequency: z
    .enum(Object.keys(FREQUENCIES) as [Frequency, ...Frequency[]])
    .default("daily"),
  event: optionalText(300),
  strengths: optionalText(300),
  target: optionalText(200),
});

export type PlanInput = z.infer<typeof planInputSchema>;
