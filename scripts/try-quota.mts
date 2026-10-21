// AI Gateway 経由で画像を作れるか・速さを確認する（認証は VERCEL_OIDC_TOKEN）
import { writeFileSync } from "node:fs";
import { generateText } from "ai";
const out = process.argv[2];
await Promise.all([1, 2, 3].map(async (n) => {
  const t = Date.now();
  try {
    const r = await generateText({
      model: "google/gemini-3.1-flash-image",
      prompt: "Generate a photo: a calm cafe table with soft daylight, fresh bread. No text, no logos.",
      providerOptions: { google: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "1K" } } },
      maxRetries: 0,
    });
    const f = r.files[0];
    if (f) writeFileSync(`${out}/gw${n}.${f.mediaType.split("/")[1]}`, f.uint8Array);
    console.log(n, "ok", (Date.now() - t) / 1000, f?.mediaType, f?.uint8Array.length, r.providerMetadata?.gateway?.cost);
  } catch (e) {
    console.log(n, "err", (Date.now() - t) / 1000, e instanceof Error ? e.message.slice(0, 200) : e);
  }
}));
