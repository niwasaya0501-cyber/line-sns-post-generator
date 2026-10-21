import { ImageResponse } from "next/og";
import sharp from "sharp";
import { CARD_FONT, loadCardFont } from "@/lib/font";
import { INDUSTRIES } from "@/lib/input";
import type { Plan } from "@/lib/plan";
import { HEIGHT, headlineFontSize, WIDTH } from "@/lib/slide-layout";




// AIが描いた「文字のない画像」の上に、日付・見出し・店名を正しいフォントで重ねたカード画像(PNG)を作る。
// 画像が無いとき(生成失敗)は業種色のグラデーションを背景にする。
// LINEのカルーセルと結果画面でそのまま使う。PNGだと1枚2MB前後と重いため、JPEGにして返す
export async function renderCard(plan: Plan, index: number, jpeg: Uint8Array | null): Promise<Uint8Array> {
  const post = plan.posts[index];
  const imageSrc = jpeg ? `data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}` : null;
  const [light, dark] = INDUSTRIES[plan.input.industry].colors;
  const shopName = plan.input.shopName ?? "";

  const [bold, medium] = await Promise.all([
    loadCardFont(700, post.headline),
    loadCardFont(500, `${post.label}${shopName}`),
  ]);

  const res = new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          position: "relative",
          fontFamily: CARD_FONT,
          background: `linear-gradient(160deg, ${light}, ${dark})`,
        }}
      >
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 620,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 56,
            padding: "14px 30px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            color: dark,
            fontSize: 38,
            fontWeight: 500,
          }}
        >
          {post.label}
        </div>
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: shopName ? 150 : 96,
            display: "flex",
            color: "#fff",
            fontSize: headlineFontSize(post.headline),
            fontWeight: 700,
            lineHeight: 1.3,
            // 2行になるときに1〜2文字だけ次の行に残らないよう、行の長さをそろえる
            textWrap: "balance",
            textShadow: "0 2px 16px rgba(0,0,0,0.35)",
          }}
        >
          {post.headline}
        </div>
        {shopName && (
          <div
            style={{
              position: "absolute",
              left: 72,
              bottom: 76,
              display: "flex",
              alignItems: "center",
              color: "rgba(255,255,255,0.9)",
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.8)", marginRight: 20 }} />
            {shopName}
          </div>
        )}
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: CARD_FONT, data: bold, weight: 700, style: "normal" },
        { name: CARD_FONT, data: medium, weight: 500, style: "normal" },
      ],
    },
  );
  const jpegCard = await sharp(Buffer.from(await res.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(jpegCard);
}
