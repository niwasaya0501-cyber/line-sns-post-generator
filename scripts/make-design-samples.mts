// 入力画面のデザイン見本に敷く、業種ごとの「文字のない写真」を作り、public/design-samples に置く。
// 見本は小さく表示するだけなので、縮小して軽くする
// 使い方: npx tsx --env-file=.env.local scripts/make-design-samples.mts
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { INDUSTRY_DESIGN } from "../src/lib/design";
import { generatePostImage } from "../src/lib/generate";
import { INDUSTRIES, type Industry } from "../src/lib/input";

const OUT = "public/design-samples";

const SCENES: Record<Industry, string> = {
  hair: "A bright, stylish hair salon interior with a styling chair, a round mirror and dried flowers on a shelf, seen from a slight angle.",
  food: "A seasonal pumpkin scone and a latte on a small ceramic plate on a wooden cafe table, soft window light from the side.",
  seitai: "A calm treatment room with a neatly made massage bed, folded white towels and a small green plant, soft morning light.",
  nail: "A manicure table with neat rows of pastel nail polish bottles, a small vase of flowers and soft fabric, top-down view.",
  retail: "Handmade ceramic cups and small zakka goods arranged on a simple wooden shelf against a plain wall.",
  other: "A tidy, welcoming small shop counter with a notebook, a coffee cup and a small plant, soft natural light.",
};

mkdirSync(OUT, { recursive: true });
for (const industry of Object.keys(INDUSTRIES) as Industry[]) {
  const rec = INDUSTRY_DESIGN[industry];
  let jpeg: Uint8Array | null = null;
  for (let n = 0; n < 4 && !jpeg; n++) {
    try {
      jpeg = await generatePostImage(SCENES[industry], rec, Date.now() + 120_000);
    } catch (e) {
      console.log("画像失敗", industry, n, e instanceof Error ? e.message.slice(0, 100) : e);
    }
  }
  if (!jpeg) continue;
  const small = await sharp(Buffer.from(jpeg)).resize(432, 540, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  writeFileSync(`${OUT}/${industry}.jpg`, small);
  console.log("OK", industry, small.length);
}
