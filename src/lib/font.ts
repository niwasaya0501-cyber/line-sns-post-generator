// 画像に重ねる文字用の日本語フォントを Google Fonts から取得する。
// text= で使う文字だけに絞ると、数MBの日本語フォントが数十KBで済む。
// ImageResponse(Satori) は woff2 非対応のため、woff/ttf の URL を拾う
export const CARD_FONT = "Zen Kaku Gothic New";

export async function loadCardFont(weight: 500 | 700, text: string): Promise<ArrayBuffer> {
  const family = CARD_FONT.replace(/ /g, "+");
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((r) => r.text());

  const url = css.match(/src: url\((.+?)\) format\('(?:woff|truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error("フォントのURLが見つかりません");
  return fetch(url).then((r) => r.arrayBuffer());
}
