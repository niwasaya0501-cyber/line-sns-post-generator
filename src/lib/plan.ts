import { z } from "zod";
import type { PlanInput } from "./input";
import type { ScheduleSlot } from "./schedule";

// AIに返させる形（日付は含めない。アプリ側で計算した日付と順番で対応させる）
export const aiPostSchema = z.object({
  theme: z.string().describe("その日の投稿のテーマ（例: スタッフ紹介、季節のおすすめ）"),
  headline: z.string().describe("画像に重ねる見出し。全角14文字以内"),
  caption: z.string().describe("Instagramの投稿文。絵文字を適度に使い、改行で読みやすく。200〜350文字"),
  hashtags: z.array(z.string()).describe("ハッシュタグ。#は付けない。6〜10個"),
  imageScene: z
    .string()
    .describe("写真の撮影指示（英語1段落、60〜120語）。人物の顔のアップ・文字・ロゴ・看板は含めない"),
  checkItems: z.array(z.string()).describe("投稿前にお店の人が確認すべき点（入力に無い事実を補った箇所など）"),
});

export const aiPlanSchema = z.object({
  overview: z.string().describe("この1週間の投稿方針を2〜3文で"),
  posts: z.array(aiPostSchema),
});

export type Post = z.infer<typeof aiPostSchema> &
  ScheduleSlot & {
    riskyWords: string[];
  };

export type Plan = {
  id: string;
  createdAt: string;
  input: PlanInput;
  overview: string;
  posts: Post[];
};

// 各投稿の画像の状態。fallback = 写真の生成に失敗したため業種色の背景で代替、
// missing = カード自体を保存できなかった（画像なしで表示）
export type ImageState = "pending" | "ready" | "fallback" | "missing";

// 作成中にサーバーから順番に送る知らせ（1行に1つのJSON）
export type PlanEvent =
  | { type: "started"; id: string }
  | { type: "plan"; plan: Plan }
  | { type: "image"; index: number; state: Exclude<ImageState, "pending"> }
  | { type: "done" }
  | { type: "failed"; message: string };
