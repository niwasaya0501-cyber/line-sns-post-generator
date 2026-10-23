import type { CSSProperties } from "react";
import { PALETTES, type Design } from "@/lib/design";
import { HEIGHT, headlineFontSize, WIDTH } from "@/lib/slide-layout";

type Props = {
  headline: string;
  label: string;
  shopName?: string;
  // 文字のない写真（data URL など）。無ければ色のグラデーション
  photoSrc: string | null;
  design: Design;
  // 見出し用・小さい文字用の font-family（サーバーは登録したフォント名、画面は next/font の変数）
  fonts: { head: string; body: string };
  headWeight: number;
  bodyWeight: number;
};

// 表紙（1枚目）のデザイン。1080×1350px の大きさで描く。
// サーバーの ImageResponse(Satori) と画面の見本の両方で使うため、Satori が対応する書き方だけを使う
// （子が2つ以上ある div には display:flex を付ける、position は absolute で重ねる）
export function CoverArt({ headline, label, shopName, photoSrc, design, fonts, headWeight, bodyWeight }: Props) {
  const p = PALETTES[design.palette];
  const root: CSSProperties = {
    width: WIDTH,
    height: HEIGHT,
    display: "flex",
    position: "relative",
    overflow: "hidden",
    fontFamily: fonts.body,
    fontWeight: bodyWeight,
    background: `linear-gradient(160deg, ${p.soft}, ${p.accent})`,
  };
  const head: CSSProperties = { fontFamily: fonts.head, fontWeight: headWeight, textWrap: "balance" };
  const full: CSSProperties = { position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT };
  // 重ねる部品の入れ物。Satori では <></> が位置の基準にならないため、全面の div に入れる
  const layer: CSSProperties = { ...full, display: "flex" };

  return (
    <div style={root}>
      {photoSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoSrc} alt="" width={WIDTH} height={HEIGHT} style={{ ...full, objectFit: "cover" }} />
      )}

      {design.taste === "simple" && (
        <div style={layer}>
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
              color: p.accent,
              fontSize: 38,
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              left: 72,
              right: 72,
              bottom: shopName ? 150 : 96,
              display: "flex",
              color: "#fff",
              fontSize: headlineFontSize(headline),
              lineHeight: 1.3,
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              ...head,
            }}
          >
            {headline}
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
              }}
            >
              <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.8)", marginRight: 20 }} />
              {shopName}
            </div>
          )}
        </div>
      )}

      {/* きれい: 細い白枠＋中央そろえ。明朝体の見出しを下に置く */}
      {design.taste === "elegant" && (
        <div style={layer}>
          <div
            style={{
              ...full,
              // 下の影は、選んだ色の濃い色にする（色を変えると雰囲気も変わる）
              background: `linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 26%, ${p.dark}00 45%, ${p.dark}B3 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              width: WIDTH - 80,
              height: HEIGHT - 80,
              border: "2px solid rgba(255,255,255,0.85)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 92,
              left: 0,
              width: WIDTH,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: 34,
              letterSpacing: 6,
            }}
          >
            <div style={{ width: 56, height: 2, background: "rgba(255,255,255,0.85)", marginRight: 24 }} />
            {label}
            <div style={{ width: 56, height: 2, background: "rgba(255,255,255,0.85)", marginLeft: 24 }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 110,
              right: 110,
              bottom: 128,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
                fontSize: headlineFontSize(headline, WIDTH - 220, 84),
                lineHeight: 1.45,
                letterSpacing: 4,
                textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                ...head,
              }}
            >
              {headline}
            </div>
            {shopName && (
              <div style={{ display: "flex", marginTop: 30, fontSize: 30, letterSpacing: 8, opacity: 0.92 }}>
                {shopName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* かわいい: 角の丸い色つきの札と、下の丸いカードに見出し */}
      {design.taste === "cute" && (
        <div style={layer}>
          <div
            style={{
              position: "absolute",
              top: 56,
              left: 56,
              display: "flex",
              alignItems: "center",
              padding: "14px 34px",
              borderRadius: 999,
              background: p.soft,
              color: p.accent,
              fontSize: 38,
              border: "4px solid #fff",
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              left: 48,
              right: 48,
              bottom: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "52px 56px 48px",
              borderRadius: 64,
              background: p.base,
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", marginBottom: 22 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ width: 14, height: 14, borderRadius: 999, background: i === 1 ? p.accent : p.soft, margin: "0 8px" }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
                color: p.accent,
                fontSize: headlineFontSize(headline, WIDTH - 208, 84),
                lineHeight: 1.35,
                ...head,
              }}
            >
              {headline}
            </div>
            {shopName && (
              <div style={{ display: "flex", marginTop: 20, color: p.ink, fontSize: 32, opacity: 0.8 }}>{shopName}</div>
            )}
          </div>
        </div>
      )}

      {/* かっこいい: 下に濃い色の帯、差し色の四角い札と線。太い見出しを左に大きく */}
      {design.taste === "cool" && (
        <div style={layer}>
          <div style={{ ...full, background: "rgba(0,0,0,0.12)" }} />
          <div
            style={{
              position: "absolute",
              top: 56,
              left: 56,
              display: "flex",
              padding: "12px 26px",
              background: p.pop,
              color: p.dark,
              fontSize: 36,
              letterSpacing: 2,
            }}
          >
            {label}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              padding: "56px 72px 68px",
              background: p.dark,
            }}
          >
            <div style={{ width: 120, height: 10, background: p.pop, marginBottom: 34 }} />
            <div
              style={{
                display: "flex",
                color: "#fff",
                fontSize: headlineFontSize(headline, WIDTH - 144, 92),
                lineHeight: 1.25,
                ...head,
              }}
            >
              {headline}
            </div>
            {shopName && (
              <div style={{ display: "flex", marginTop: 26, color: p.pop, fontSize: 30, letterSpacing: 4 }}>
                {shopName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
