import { z } from "zod";
import type { Goal } from "./buzz";
import type { PlanInput } from "./input";
import type { ScheduleSlot } from "./schedule";

// AIに返させる形（日付は含めない。アプリ側で計算した日付と順番で対応させる）
export const aiPostSchema = z.object({
  theme: z.string().describe("その日の投稿のテーマ（例: スタッフ紹介、季節のおすすめ）"),
  headline: z.string().describe("画像に重ねる見出し。全角14文字以内"),
  caption: z
    .string()
    .describe("Instagramの投稿文。1行目は全角20文字以内のフック。絵文字を適度に使い、改行で読みやすく。200〜350文字"),
  hashtags: z.array(z.string()).describe("ハッシュタグ。#は付けない。3〜5個"),
  altText: z
    .string()
    .describe("画像の代替テキスト（目の不自由な方の読み上げや検索に使われる）。写真に写っているものを日本語1文で"),
  reelIdea: z.string().describe("同じテーマをリール（15秒ほどの縦長動画）にする場合の撮り方。1〜2文"),
  imageScene: z
    .string()
    .describe("写真の撮影指示（英語1段落、60〜120語）。人物の顔のアップ・文字・ロゴ・看板は含めない"),
  checkItems: z.array(z.string()).describe("投稿前にお店の人が確認すべき点（入力に無い事実を補った箇所など）"),
});

export const aiPlanSchema = z.object({
  overview: z.string().describe("この1週間の投稿方針を2〜3文で"),
  searchKeywords: z
    .array(z.string())
    .describe("お客様がInstagramやGoogleでこのお店を探すときに入力しそうな言葉。5〜8個。複数語は半角空白で区切る"),
  profileName: z.string().describe("Instagramの名前欄の例。店名と、検索されやすい言葉を組み合わせて全角30文字以内"),
  posts: z.array(aiPostSchema),
});

// reelIdea・altText・goal・keywords は、機能を足す前に作った投稿案には無い
export type Post = Omit<z.infer<typeof aiPostSchema>, "reelIdea" | "altText"> & {
  reelIdea?: string;
  altText?: string;
} &
  ScheduleSlot & {
    goal?: Goal;
    // 本文に含まれている検索ワード
    keywords?: string[];
    riskyWords: string[];
  };

export type Plan = {
  id: string;
  createdAt: string;
  input: PlanInput;
  overview: string;
  searchKeywords?: string[];
  profileName?: string;
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
