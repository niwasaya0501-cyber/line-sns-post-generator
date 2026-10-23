import { ImageResponse } from "next/og";
import sharp from "sharp";
import { CoverArt } from "@/components/CoverArt";
import { resolveDesign, TASTES } from "@/lib/design";
import { loadFont } from "@/lib/font";
import type { Plan } from "@/lib/plan";
import { HEIGHT, WIDTH } from "@/lib/slide-layout";

// AIが描いた「文字のない画像」の上に、日付・見出し・店名を、選んだデザインのフォントで重ねたカード画像を作る。
// 画像が無いとき(生成失敗)は選んだ色のグラデーションを背景にする。
// LINEのカルーセルと結果画面でそのまま使う。PNGだと1枚2MB前後と重いため、JPEGにして返す
export async function renderCard(plan: Plan, index: number, jpeg: Uint8Array | null): Promise<Uint8Array> {
  const post = plan.posts[index];
  const imageSrc = jpeg ? `data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}` : null;
  const design = resolveDesign(plan.input);
  const { head, body } = TASTES[design.taste];
  const shopName = plan.input.shopName ?? "";

  // 見出しと小さい文字が同じフォント（太さ違い）でも、別々に読み込んで太さごとに登録する
  const [headData, bodyData] = await Promise.all([
    loadFont(head, post.headline),
    loadFont(body, `${post.label}${shopName}`),
  ]);

  const res = new ImageResponse(
    (
      <CoverArt
        headline={post.headline}
        label={post.label}
        shopName={shopName || undefined}
        photoSrc={imageSrc}
        design={design}
        fonts={{ head: head.family, body: body.family }}
        headWeight={head.weight}
        bodyWeight={body.weight}
      />
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: head.family, data: headData, weight: head.weight, style: "normal" },
        { name: body.family, data: bodyData, weight: body.weight, style: "normal" },
      ],
    },
  );
  const jpegCard = await sharp(Buffer.from(await res.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(jpegCard);
}
