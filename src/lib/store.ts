import { put } from "@vercel/blob";
import { cardFile, FINAL_FILE, PLAN_FILE } from "./paths";
import type { ImageState, Plan } from "./plan";

// 1つの投稿プランは plans/<id>/ 以下に置く。サーバーは「書くだけ」で、読むのはブラウザとLINE。
//   ・Hobbyプランは書き込み・一覧取得が月2,000回まで（超えると30日使えない）ため、一覧取得は使わない
//   ・サーバーから公開URLを読むと、Vercelのボット対策で403になることがあったため、サーバーでは読まない
//   ・どのファイルも1回だけ書く（上書きしないので、CDNキャッシュで古い内容が見えることもない）
//   plan.json    … 投稿文（できた時点で書く）
//   card-<n>.jpg … n番目の、文字を重ねたカード画像（できた順に書く）
//   final.json   … 全部終わった印と、各画像の結果
async function write(id: string, file: string, body: string | Uint8Array, contentType: string) {
  await put(`plans/${id}/${file}`, Buffer.from(body), {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
}

export async function savePlan(plan: Plan) {
  await write(plan.id, PLAN_FILE, JSON.stringify(plan), "application/json");
}

export async function saveCard(id: string, index: number, jpeg: Uint8Array) {
  await write(id, cardFile(index), jpeg, "image/jpeg");
}

export async function saveFinal(id: string, images: ImageState[]) {
  await write(id, FINAL_FILE, JSON.stringify({ images }), "application/json");
}
