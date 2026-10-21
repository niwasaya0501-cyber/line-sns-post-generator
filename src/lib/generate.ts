import { generateImage, generateText, Output } from "ai";
import { assignGoals, normalizeHashtags } from "./buzz";
import { IMAGE_MODELS, LOW_THINKING, TEXT_MODELS } from "./ai";
import { findRiskyExpressions } from "./compliance";
import type { PlanInput } from "./input";
import { aiPlanSchema, type Plan } from "./plan";
import { buildImagePrompt, buildPlanPrompt } from "./prompt";
import { buildSchedule } from "./schedule";
import { stripHashtagLines } from "./text";

// 1回の呼び出しの上限。普段は投稿文10秒・画像10秒ほどなので、これを超えたら混雑とみなして次へ
const TEXT_TIMEOUT_MS = 30_000;
const IMAGE_TIMEOUT_MS = 40_000;

// 候補を順に試し、最初に成功した結果を返す（失敗理由はログに残す）。
// 2回目以降は waitMs × 回数 だけ待ってから試す。deadline を過ぎたら諦める
async function tryInOrder<M, R>(
  label: string,
  models: M[],
  run: (model: M) => Promise<R>,
  { waitMs = 0, deadline = Infinity }: { waitMs?: number; deadline?: number } = {},
): Promise<R> {
  let lastError: unknown;
  for (const [attempt, model] of models.entries()) {
    if (attempt > 0) {
      const wait = waitMs * attempt;
      if (Date.now() + wait > deadline) break;
      await new Promise((r) => setTimeout(r, wait));
    }
    try {
      return await run(model);
    } catch (err) {
      lastError = err;
      console.warn(`[ai] ${label} ${attempt + 1}回目失敗`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  throw lastError ?? new Error(`${label}: 時間切れ`);
}

export async function generatePlanText(id: string, input: PlanInput): Promise<Plan> {
  const slots = buildSchedule(input.frequency);
  const goals = assignGoals(slots.length);
  const prompt = buildPlanPrompt(input, slots, goals);

  const output = await tryInOrder("投稿文", TEXT_MODELS, async (model) => {
    const { output, usage } = await generateText({
      model,
      output: Output.object({ schema: aiPlanSchema }),
      prompt,
      providerOptions: LOW_THINKING,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(TEXT_TIMEOUT_MS),
    });
    console.info(`[ai] 投稿文 ${model.modelId} 入力${usage.inputTokens}・出力${usage.outputTokens}トークン`);
    if (output.posts.length < slots.length) {
      throw new Error(`投稿数が足りません: ${output.posts.length}/${slots.length}`);
    }
    return output;
  });

  return {
    id,
    createdAt: new Date().toISOString(),
    input,
    overview: output.overview,
    posts: slots.map((slot, i) => {
      const post = output.posts[i];
      const caption = stripHashtagLines(post.caption);
      const hashtags = normalizeHashtags(post.hashtags);
      return {
        ...post,
        ...slot,
        goal: goals[i],
        caption,
        hashtags,
        riskyWords: findRiskyExpressions(
          `${post.headline}\n${caption}\n${hashtags.join(" ")}`,
          input.industry,
        ),
      };
    }),
  };
}

export async function generatePostImage(scene: string, deadline: number): Promise<Uint8Array> {
  return tryInOrder("画像", IMAGE_MODELS, async (model) => {
    const { image } = await generateImage({
      model,
      prompt: buildImagePrompt(scene),
      aspectRatio: "4:5",
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
      providerOptions: {
        vertex: {
          imageConfig: {
            imageSize: "1K",
            imageOutputOptions: { mimeType: "image/jpeg", compressionQuality: 85 },
          },
        },
      },
    });
    return image.uint8Array;
  }, { waitMs: 4000, deadline });
}
