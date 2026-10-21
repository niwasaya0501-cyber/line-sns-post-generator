// /sample（作成例ページ）用のデータを作り、public/sample に置く。
// 交流会で通信やAIが不調でも見せられるよう、Blobではなくアプリ本体に同梱する
// 使い方: npx tsx --env-file=.env.local scripts/make-sample.mts
import { mkdirSync, writeFileSync } from "node:fs";
import { renderCard } from "../src/lib/card";
import { generatePlanText, generatePostImage } from "../src/lib/generate";
import { planInputSchema } from "../src/lib/input";
import { cardFile, FINAL_FILE, PLAN_FILE } from "../src/lib/paths";

const OUT = "public/sample";

// 架空のお店（実在の店名・個人情報は使わない）
const input = planInputSchema.parse({
  industry: "food",
  shopName: "こもれびカフェ",
  concept: "駅から歩いて5分、自家焙煎コーヒーと焼き菓子の小さなカフェ",
  frequency: "daily",
  event: "10月31日まで、かぼちゃのスコーン（税込380円）を期間限定で販売",
  strengths: "スコーンは毎朝お店で焼いています。コーヒー豆は店内で焙煎",
  target: "近くで働く方、ひと息つきたい方",
});

const plan = await generatePlanText("sample", input);
console.log(plan.overview);
for (const p of plan.posts) console.log(p.label, p.headline, p.riskyWords);

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/${PLAN_FILE}`, JSON.stringify(plan, null, 2));

// 作成例は全部写真付きにしたいので、1枚ずつ、成功するまで最大4回試す
const images: string[] = [];
for (const [i, post] of plan.posts.entries()) {
  let jpeg: Uint8Array | null = null;
  for (let n = 0; n < 4 && !jpeg; n++) {
    try {
      jpeg = await generatePostImage(post.imageScene, Date.now() + 120_000);
    } catch (e) {
      console.log("画像失敗", i, n, e instanceof Error ? e.message.slice(0, 100) : e);
    }
  }
  writeFileSync(`${OUT}/${cardFile(i)}`, await renderCard(plan, i, jpeg));
  images.push(jpeg ? "ready" : "fallback");
  console.log("カード", i, images[i]);
}
writeFileSync(`${OUT}/${FINAL_FILE}`, JSON.stringify({ images }));
