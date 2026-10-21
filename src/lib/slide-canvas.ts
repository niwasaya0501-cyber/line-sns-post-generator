// 複数枚投稿のスライドを、ブラウザの canvas で画像にする。
// 「自分の写真」はここで合成するため、写真がサーバーに送られることはない
import type { Slide } from "./plan";
import {
  balancedLines,
  HEIGHT,
  headlineFontSize,
  MARGIN,
  TEXT_WIDTH,
  WIDTH,
  wrapBody,
  wrapLines,
} from "./slide-layout";

export type DeckStyle = {
  colors: readonly [string, string];
  shopName?: string;
};

const PAPER = "#F7F4EF";
const INK = "#2B2B2B";
const MUTED = "#6B6F6C";

let fontFamily: string | null = null;

// 画面と同じフォント（Zen Kaku Gothic New）を、描く文字の分だけ読み込んでから使う
async function prepareFont(text: string): Promise<string> {
  fontFamily ??= getComputedStyle(document.body).fontFamily;
  await Promise.all([
    document.fonts.load(`700 64px ${fontFamily}`, text),
    document.fonts.load(`500 40px ${fontFamily}`, text),
  ]);
  return fontFamily;
}

function newCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を作れませんでした"))), "image/jpeg", 0.88),
  );
}

export async function loadPhoto(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

// 写真を、縦横比を保ったまま枠いっぱいに敷く（はみ出た部分は切る）
function drawCover(ctx: CanvasRenderingContext2D, photo: ImageBitmap) {
  const scale = Math.max(WIDTH / photo.width, HEIGHT / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  ctx.drawImage(photo, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

function drawGradient(ctx: CanvasRenderingContext2D, [light, dark]: readonly [string, string]) {
  const g = ctx.createLinearGradient(0, 0, WIDTH * 0.35, HEIGHT);
  g.addColorStop(0, light);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string, font: string) {
  ctx.font = font;
  const w = ctx.measureText(text).width + 60;
  const h = 70;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 30, y + h / 2 + 2);
  return w;
}

// 表紙。サーバーで作る表紙（card.tsx）と同じ見た目にする
export async function renderCover(
  { headline, label }: { headline: string; label: string },
  photo: ImageBitmap | null,
  style: DeckStyle,
): Promise<Blob> {
  const family = await prepareFont(`${headline}${label}${style.shopName ?? ""}`);
  const { canvas, ctx } = newCanvas();

  if (photo) drawCover(ctx, photo);
  else drawGradient(ctx, style.colors);
  const shade = ctx.createLinearGradient(0, HEIGHT - 620, 0, HEIGHT);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, HEIGHT - 620, WIDTH, 620);

  pill(ctx, label, 56, 56, "rgba(255,255,255,0.92)", style.colors[1], `500 38px ${family}`);

  const size = headlineFontSize(headline);
  ctx.font = `700 ${size}px ${family}`;
  const lines = balancedLines(headline, TEXT_WIDTH, (s) => ctx.measureText(s).width);
  const lineHeight = size * 1.3;
  const bottom = HEIGHT - (style.shopName ? 150 : 96);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 16;
  lines.forEach((line, i) => {
    ctx.fillText(line, MARGIN, bottom - (lines.length - 1 - i) * lineHeight - size * 0.2);
  });
  ctx.shadowBlur = 0;

  if (style.shopName) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(MARGIN, HEIGHT - 76 - 22, 48, 3);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `500 36px ${family}`;
    ctx.fillText(style.shopName, MARGIN + 68, HEIGHT - 76 - 8);
  }
  return toJpeg(canvas);
}

// 2枚目以降。写真が無ければ読みやすい紙の色、写真があれば暗くした写真の上に白い文字
export async function renderSlide(
  slide: Slide,
  page: number,
  total: number,
  photo: ImageBitmap | null,
  style: DeckStyle,
): Promise<Blob> {
  const family = await prepareFont(`${slide.title}${slide.body}${style.shopName ?? ""}0123456789/ スワイプ→`);
  const { canvas, ctx } = newCanvas();
  const [, accent] = style.colors;
  const onPhoto = photo !== null;

  if (photo) {
    drawCover(ctx, photo);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, WIDTH, 16);
  }
  const ink = onPhoto ? "#fff" : INK;
  const sub = onPhoto ? "rgba(255,255,255,0.8)" : MUTED;

  // ページ番号（右上）
  ctx.font = `500 34px ${family}`;
  const pageText = `${page} / ${total}`;
  const pageWidth = ctx.measureText(pageText).width + 60;
  pill(ctx, pageText, WIDTH - 56 - pageWidth, 64, onPhoto ? "rgba(255,255,255,0.18)" : "#fff", sub, `500 34px ${family}`);

  // 見出しと本文を1つのまとまりとして、上下の中央に置く
  ctx.font = `700 68px ${family}`;
  const titleLines = wrapLines(slide.title, TEXT_WIDTH, (s) => ctx.measureText(s).width, 2);
  ctx.font = `500 50px ${family}`;
  const bodyLines = wrapBody(slide.body, TEXT_WIDTH, (s) => ctx.measureText(s).width, 11);
  const titleLineHeight = 68 * 1.35;
  const bodyLineHeight = 50 * 1.7;
  const gap = 110;
  const blockHeight = titleLines.length * titleLineHeight + gap + bodyLines.length * bodyLineHeight;
  let y = Math.max(250, (HEIGHT - blockHeight) / 2 + 40);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = onPhoto ? "#fff" : accent;
  ctx.font = `700 68px ${family}`;
  for (const line of titleLines) {
    ctx.fillText(line, MARGIN, y);
    y += titleLineHeight;
  }
  ctx.fillStyle = onPhoto ? "rgba(255,255,255,0.6)" : accent;
  ctx.fillRect(MARGIN, y - 30, 80, 6);
  y += gap - 20;

  ctx.fillStyle = ink;
  ctx.font = `500 50px ${family}`;
  for (const line of bodyLines) {
    ctx.fillText(line, MARGIN, y);
    y += bodyLineHeight;
  }

  // 下の帯：店名と、続きがあることの合図
  ctx.font = `500 34px ${family}`;
  ctx.fillStyle = sub;
  if (style.shopName) ctx.fillText(style.shopName, MARGIN, HEIGHT - 72);
  if (page < total) {
    const hint = "スワイプ →";
    ctx.fillText(hint, WIDTH - MARGIN - ctx.measureText(hint).width, HEIGHT - 72);
  }
  return toJpeg(canvas);
}
