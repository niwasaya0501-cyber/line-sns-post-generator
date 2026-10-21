import { generatePlanText, generatePostImage } from "./generate";
import type { PlanInput } from "./input";
import { pushMessage } from "./line";
import { buildFailureMessage, buildPlanCarousel } from "./messages";
import type { ImageState, PlanEvent } from "./plan";
import { renderCard } from "./card";
import { saveCard, saveFinal, savePlan } from "./store";

// 画像モデルは同時に頼みすぎると429になるため、同時実行数を絞る
const IMAGE_CONCURRENCY = 2;
// 画像づくり全体の目安。過ぎたら残りは色の背景のカードで仕上げ、待たせすぎない
const IMAGE_DEADLINE_MS = 90_000;

export const FAILURE_MESSAGE = "投稿案の作成に失敗しました。時間をおいて、もう一度お試しください。";

// 投稿文 → 画像（並列）→ LINEへ通知 の順に進め、途中経過を emit で画面へ知らせる。
// lineUserId は通知のためだけに受け取り、保存はしない
export async function runPlan(
  id: string,
  input: PlanInput,
  lineUserId: string | null,
  emit: (event: PlanEvent) => void,
) {
  const started = Date.now();
  const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;

  let plan;
  try {
    plan = await generatePlanText(id, input);
    await savePlan(plan);
    console.info("[plan] 投稿文", id, elapsed());
    emit({ type: "plan", plan });
  } catch (err) {
    console.error("[plan] 投稿文の生成に失敗", id, err instanceof Error ? err.message : err);
    emit({ type: "failed", message: FAILURE_MESSAGE });
    if (lineUserId) await notify(lineUserId, [buildFailureMessage()]);
    return;
  }

  // 自分の写真を使う場合は、画像を作らない（写真は結果画面で、端末の中だけで合成する）
  if (input.imageMode === "own") {
    const images: ImageState[] = plan.posts.map(() => "missing");
    await saveFinal(id, images).catch((err) =>
      console.error("[plan] 完了の保存に失敗", id, err instanceof Error ? err.message : err),
    );
    console.info("[plan] 完了（自分の写真）", id, elapsed());
    emit({ type: "done" });
    if (lineUserId) await notify(lineUserId, buildPlanCarousel(plan, images));
    return;
  }

  const images: ImageState[] = plan.posts.map(() => "pending");
  const deadline = Date.now() + IMAGE_DEADLINE_MS;
  await mapWithConcurrency(plan.posts, IMAGE_CONCURRENCY, async (post, i) => {
    let jpeg: Uint8Array | null = null;
    try {
      jpeg = await generatePostImage(post.imageScene, deadline);
    } catch (err) {
      // 画像は失敗しても、業種色の背景＋見出しのカードで代替できるので全体は止めない
      console.error("[plan] 画像の生成に失敗", id, i, err instanceof Error ? err.message : err);
    }
    try {
      await saveCard(id, i, await renderCard(plan, i, jpeg));
      images[i] = jpeg ? "ready" : "fallback";
    } catch (err) {
      console.error("[plan] カードの保存に失敗", id, i, err instanceof Error ? err.message : err);
      images[i] = "missing";
    }
    emit({ type: "image", index: i, state: images[i] as Exclude<ImageState, "pending"> });
  });

  try {
    await saveFinal(id, images);
  } catch (err) {
    console.error("[plan] 完了の保存に失敗", id, err instanceof Error ? err.message : err);
  }
  console.info("[plan] 完了", id, elapsed(), images.join(","));
  emit({ type: "done" });

  if (lineUserId) await notify(lineUserId, buildPlanCarousel(plan, images));
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function notify(to: string, messages: Parameters<typeof pushMessage>[1]) {
  try {
    await pushMessage(to, messages);
  } catch (err) {
    // 通知に失敗しても、結果画面では見られるため処理は続ける
    console.error("[plan] LINEへの通知に失敗", err instanceof Error ? err.message : err);
  }
}
