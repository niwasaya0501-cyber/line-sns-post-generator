import { INDUSTRIES, type Industry } from "./input";

// 景品表示法などで問題になりやすい「断定・最上級」の表現（全業種）
const ABSOLUTE_WORDS = [
  "絶対",
  "必ず",
  "100%",
  "１００％",
  "No.1",
  "ナンバーワン",
  "日本一",
  "世界一",
  "地域一番",
  "最安",
  "業界初",
  "完璧",
  // 入力に無い「お店の状況」を作っていないかの確認用
  "ご好評",
  "大好評",
  "多くのご予約",
  "残りわずか",
  "空きがございます",
  // 反応を「お願い」するだけの表現は、Instagramで表示が抑えられることがある。
  // 入力に無いプレゼント企画を作っていないかも確認する
  "いいねして",
  "いいね！して",
  "フォローして",
  "全員に",
];

// 薬機法・医療的な効果をうたうと問題になりやすい表現（美容・健康系の業種のみ）
const EFFECT_WORDS = [
  "治る",
  "治す",
  "治り",
  "完治",
  "治療",
  "改善",
  "効く",
  "効果",
  "血行",
  "代謝",
  "痩せ",
  "やせる",
  "若返",
  "アンチエイジング",
  "シミが消",
  "シワが消",
  "根本から",
  "デトックス",
  "再生",
  "永久",
];

// AIへの指示で避けさせたうえで、すり抜けた表現を人が確認できるよう拾い出す
export function findRiskyExpressions(text: string, industry: Industry): string[] {
  const words = INDUSTRIES[industry].strict ? [...ABSOLUTE_WORDS, ...EFFECT_WORDS] : ABSOLUTE_WORDS;
  return words.filter((w) => text.includes(w));
}

export const RISKY_WORDS_FOR_PROMPT = [...ABSOLUTE_WORDS, ...EFFECT_WORDS].join("、");
