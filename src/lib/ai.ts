import { createGoogleVertex } from "@ai-sdk/google-vertex";

// Vercel本番は GOOGLE_VERTEX_CREDENTIALS（サービスアカウントJSON）を使い、
// ローカル開発は未設定のため google-auth-library が自動でADC
// （`gcloud auth application-default login`）を探しに行く。
const credentialsJson = process.env.GOOGLE_VERTEX_CREDENTIALS;

// Gemini 3系のモデルはリージョン指定では404になり、location=globalでのみ呼べる
const vertex = createGoogleVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: "global",
  ...(credentialsJson ? { googleAuthOptions: { credentials: JSON.parse(credentialsJson) } } : {}),
});

// global の共有枠が混んでいると 429 で断られることがある。
// SDKの自動再試行（待ち時間が長い）に任せず、上から順に別のモデルへすぐ切り替える
// 1つ目の軽量版は7日分を6〜9秒で作れる（3.8 Flashは約20秒、混雑時は応答が止まることがあった）
export const TEXT_MODELS = [
  vertex("gemini-3.1-flash-lite"),
  vertex("gemini-3.8-flash"),
  vertex("gemini-3.1-flash-lite"),
];

// 7枚を並列で作るため、上位版(pro)ではなく速くて安い標準版を使う
// 画像モデルは global でしか呼べず、混雑(429)で断られやすい。
// 待ち時間を延ばしながら、上位版（上限の枠が別。単価は高い）も交えて試す
export const IMAGE_MODELS = [
  vertex.image("gemini-3.1-flash-image"),
  vertex.image("gemini-3.1-flash-image"),
  vertex.image("gemini-3-pro-image"),
  vertex.image("gemini-3.1-flash-image"),
];

// Gemini 3系は thinkingBudget: 0 が効かないため、レベルで「低」を指定する
export const LOW_THINKING = {
  vertex: { thinkingConfig: { thinkingLevel: "low" } },
} as const;
