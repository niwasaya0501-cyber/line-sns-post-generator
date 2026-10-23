import type { FontSpec } from "./design";

// 画像に重ねる文字用の日本語フォントを Google Fonts から取得する。サーバー（表紙の合成）と画面（canvas）の両方で使う。
// text= で使う文字だけに絞ると、数MBの日本語フォントが数十KBで済む。
// サーバーからの取得には ttf が返る（ImageResponse(Satori) は woff2 非対応）。ブラウザには woff2 が返るが、FontFace はそのまま読める
export async function loadFont({ family, weight }: FontSpec, text: string): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((r) => r.text());

  const url = css.match(/src: url\((.+?)\) format\('(?:woff2?|truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`フォントのURLが見つかりません: ${family}`);
  return fetch(url).then((r) => r.arrayBuffer());
}
