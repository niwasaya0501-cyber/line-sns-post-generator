// 複数枚投稿のスライドを、ブラウザの canvas で画像にする。
// 「自分の写真」はここで合成するため、写真がサーバーに送られることはない。
// 表紙はサーバーの CoverArt（components/CoverArt.tsx）と同じ見た目になるように描く
import { PALETTES, TASTES, type Design } from "./design";
import { loadFontFace } from "./font-face";
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
  design: Design;
  shopName?: string;
};

type Fonts = { head: (size: number) => string; body: (size: number) => string };

async function prepareFonts(design: Design, headText: string, bodyText: string): Promise<Fonts> {
  const { head, body } = TASTES[design.taste];
  const [headName, bodyName] = await Promise.all([loadFontFace(head, headText), loadFontFace(body, bodyText)]);
  return {
    head: (size) => `${head.weight} ${size}px "${headName}"`,
    body: (size) => `${body.weight} ${size}px "${bodyName}"`,
  };
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

function fillGradient(ctx: CanvasRenderingContext2D, stops: [number, string][], y0 = 0, y1 = HEIGHT, x1 = 0) {
  const g = ctx.createLinearGradient(0, y0, x1, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, WIDTH, y1 - y0);
}

// 文字の間隔（対応していないブラウザでは何もしない）
function spacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

type PillOptions = { bg: string; fg: string; font: string; radius?: number; padX?: number; height?: number; border?: string };
function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o: PillOptions) {
  const padX = o.padX ?? 30;
  const h = o.height ?? 70;
  ctx.font = o.font;
  const w = ctx.measureText(text).width + padX * 2;
  const r = o.radius ?? h / 2;
  if (o.border) roundRect(ctx, x - 4, y - 4, w + 8, h + 8, r + 4, o.border);
  roundRect(ctx, x, y, w, h, r, o.bg);
  ctx.fillStyle = o.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
  return w;
}

// 行を、下端（最後の行の下）をそろえて描く。center=true なら中央そろえ
function drawLinesUp(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  { x, bottom, size, lineHeight, center }: { x: number; bottom: number; size: number; lineHeight: number; center?: boolean },
) {
  ctx.textAlign = center ? "center" : "left";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, i) => {
    ctx.fillText(line, x, bottom - (lines.length - 1 - i) * lineHeight - size * 0.2);
  });
  ctx.textAlign = "left";
}

// 表紙。サーバーで作る表紙（CoverArt）と同じ見た目にする
export async function renderCover(
  { headline, label }: { headline: string; label: string },
  photo: ImageBitmap | null,
  { design, shopName }: DeckStyle,
): Promise<Blob> {
  const f = await prepareFonts(design, headline, `${label}${shopName ?? ""}`);
  const p = PALETTES[design.palette];
  const { canvas, ctx } = newCanvas();
  const measure = (s: string) => ctx.measureText(s).width;

  if (photo) drawCover(ctx, photo);
  else fillGradient(ctx, [[0, p.soft], [1, p.accent]], 0, HEIGHT, WIDTH * 0.35);

  if (design.taste === "simple") {
    fillGradient(ctx, [[0, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.62)"]], HEIGHT - 620, HEIGHT);
    pill(ctx, label, 56, 56, { bg: "rgba(255,255,255,0.92)", fg: p.accent, font: f.body(38) });
    const size = headlineFontSize(headline);
    ctx.font = f.head(size);
    const lines = balancedLines(headline, TEXT_WIDTH, measure);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 16;
    drawLinesUp(ctx, lines, { x: MARGIN, bottom: HEIGHT - (shopName ? 150 : 96), size, lineHeight: size * 1.3 });
    ctx.shadowBlur = 0;
    if (shopName) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(MARGIN, HEIGHT - 76 - 22, 48, 3);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = f.body(36);
      ctx.fillText(shopName, MARGIN + 68, HEIGHT - 76 - 8);
    }
  }

  if (design.taste === "elegant") {
    fillGradient(ctx, [
      [0, "rgba(0,0,0,0.22)"],
      [0.26, "rgba(0,0,0,0)"],
      [0.45, `${p.dark}00`],
      [1, `${p.dark}B3`],
    ]);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(41, 41, WIDTH - 82, HEIGHT - 82);

    ctx.font = f.body(34);
    spacing(ctx, 6);
    const labelWidth = measure(label);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(label, WIDTH / 2, 92 + 34);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(WIDTH / 2 - labelWidth / 2 - 24 - 56, 92 + 22, 56, 2);
    ctx.fillRect(WIDTH / 2 + labelWidth / 2 + 24, 92 + 22, 56, 2);

    const size = headlineFontSize(headline, WIDTH - 220, 84);
    ctx.font = f.head(size);
    spacing(ctx, 4);
    const lines = balancedLines(headline, WIDTH - 220, measure);
    let bottom = HEIGHT - 128;
    if (shopName) {
      ctx.font = f.body(30);
      spacing(ctx, 8);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.fillText(shopName, WIDTH / 2, bottom - 8);
      bottom -= 30 * 1.4 + 30;
    }
    ctx.font = f.head(size);
    spacing(ctx, 4);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 18;
    drawLinesUp(ctx, lines, { x: WIDTH / 2, bottom, size, lineHeight: size * 1.45, center: true });
    ctx.shadowBlur = 0;
    spacing(ctx, 0);
  }

  if (design.taste === "cute") {
    pill(ctx, label, 56, 56, { bg: p.soft, fg: p.accent, font: f.body(38), padX: 34, border: "#fff" });
    const size = headlineFontSize(headline, WIDTH - 208, 84);
    ctx.font = f.head(size);
    const lines = balancedLines(headline, WIDTH - 208, measure);
    const lineHeight = size * 1.35;
    const shopHeight = shopName ? 20 + 32 * 1.4 : 0;
    const panelHeight = 52 + 14 + 22 + lines.length * lineHeight + shopHeight + 48;
    const top = HEIGHT - 48 - panelHeight;
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    roundRect(ctx, 48, top, WIDTH - 96, panelHeight, 64, p.base);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    [-30, 0, 30].forEach((dx, i) => {
      ctx.fillStyle = i === 1 ? p.accent : p.soft;
      ctx.beginPath();
      ctx.arc(WIDTH / 2 + dx, top + 52 + 7, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = f.head(size);
    ctx.fillStyle = p.accent;
    const headBottom = top + 52 + 14 + 22 + lines.length * lineHeight;
    drawLinesUp(ctx, lines, { x: WIDTH / 2, bottom: headBottom, size, lineHeight, center: true });
    if (shopName) {
      ctx.font = f.body(32);
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.8;
      ctx.textAlign = "center";
      ctx.fillText(shopName, WIDTH / 2, headBottom + 20 + 32);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
  }

  if (design.taste === "cool") {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    spacing(ctx, 2);
    pill(ctx, label, 56, 56, { bg: p.pop, fg: p.dark, font: f.body(36), radius: 0, padX: 26, height: 66 });
    spacing(ctx, 0);
    const size = headlineFontSize(headline, WIDTH - 144, 92);
    ctx.font = f.head(size);
    const lines = balancedLines(headline, WIDTH - 144, measure);
    const lineHeight = size * 1.25;
    const shopHeight = shopName ? 26 + 30 * 1.4 : 0;
    const bandHeight = 56 + 10 + 34 + lines.length * lineHeight + shopHeight + 68;
    const top = HEIGHT - bandHeight;
    ctx.fillStyle = p.dark;
    ctx.fillRect(0, top, WIDTH, bandHeight);
    ctx.fillStyle = p.pop;
    ctx.fillRect(MARGIN, top + 56, 120, 10);
    ctx.font = f.head(size);
    ctx.fillStyle = "#fff";
    const headBottom = top + 56 + 10 + 34 + lines.length * lineHeight;
    drawLinesUp(ctx, lines, { x: MARGIN, bottom: headBottom, size, lineHeight });
    if (shopName) {
      ctx.font = f.body(30);
      spacing(ctx, 4);
      ctx.fillStyle = p.pop;
      ctx.fillText(shopName, MARGIN, headBottom + 26 + 30);
      spacing(ctx, 0);
    }
  }

  return toJpeg(canvas);
}

// 2枚目以降の色と文字の置き方
type SlideTheme = {
  title: string;
  bar: string;
  body: string;
  sub: string;
  center: boolean;
  x: number;
  width: number;
  // ページ番号の上と、店名の下の余白
  top: number;
  bottom: number;
};

// 2枚目以降。写真が無ければデザインごとの背景、写真があれば暗くした写真の上に白い文字
export async function renderSlide(
  slide: Slide,
  page: number,
  total: number,
  photo: ImageBitmap | null,
  { design, shopName }: DeckStyle,
): Promise<Blob> {
  const pageNo = String(page).padStart(2, "0");
  const f = await prepareFonts(
    design,
    `${slide.title}${pageNo}`,
    `${slide.body}${shopName ?? ""}0123456789/ スワイプ→`,
  );
  const p = PALETTES[design.palette];
  const { canvas, ctx } = newCanvas();
  const measure = (s: string) => ctx.measureText(s).width;
  const pageText = `${page} / ${total}`;

  let theme: SlideTheme;
  if (photo) {
    drawCover(ctx, photo);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    theme = { title: "#fff", bar: "rgba(255,255,255,0.6)", body: "#fff", sub: "rgba(255,255,255,0.8)", center: false, x: MARGIN, width: TEXT_WIDTH, top: 250, bottom: 72 };
    ctx.font = f.body(34);
    const w = measure(pageText) + 60;
    pill(ctx, pageText, WIDTH - 56 - w, 64, { bg: "rgba(255,255,255,0.18)", fg: theme.sub, font: f.body(34) });
  } else if (design.taste === "elegant") {
    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = p.soft;
    ctx.lineWidth = 2;
    ctx.strokeRect(41, 41, WIDTH - 82, HEIGHT - 82);
    theme = { title: p.accent, bar: p.accent, body: p.ink, sub: p.accent, center: true, x: 120, width: WIDTH - 240, top: 260, bottom: 96 };
    ctx.font = f.body(32);
    spacing(ctx, 6);
    ctx.fillStyle = p.accent;
    ctx.textAlign = "center";
    ctx.fillText(pageText, WIDTH / 2, 132);
    spacing(ctx, 0);
  } else if (design.taste === "cute") {
    ctx.fillStyle = p.soft;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = p.base;
    for (const [x, y, r] of [[WIDTH - 40, 70, 130], [40, HEIGHT - 60, 110], [WIDTH - 120, HEIGHT - 40, 50]]) {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    roundRect(ctx, 56, 170, WIDTH - 112, HEIGHT - 340, 64, "#fff");
    theme = { title: p.accent, bar: p.soft, body: p.ink, sub: p.accent, center: false, x: 120, width: WIDTH - 240, top: 300, bottom: 92 };
    ctx.font = f.body(34);
    const w = measure(pageText) + 60;
    pill(ctx, pageText, (WIDTH - w) / 2, 66, { bg: p.accent, fg: "#fff", font: f.body(34) });
  } else if (design.taste === "cool") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    theme = { title: "#fff", bar: p.pop, body: "rgba(255,255,255,0.88)", sub: "rgba(255,255,255,0.6)", center: false, x: MARGIN, width: TEXT_WIDTH, top: 360, bottom: 72 };
    ctx.font = f.head(150);
    ctx.fillStyle = p.pop;
    ctx.fillText(pageNo, MARGIN - 6, 250);
    const noWidth = measure(pageNo);
    ctx.font = f.body(36);
    ctx.fillStyle = theme.sub;
    ctx.fillText(`/ ${String(total).padStart(2, "0")}`, MARGIN + noWidth + 16, 250);
  } else {
    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 0, WIDTH, 16);
    theme = { title: p.accent, bar: p.accent, body: p.ink, sub: "#6B6F6C", center: false, x: MARGIN, width: TEXT_WIDTH, top: 250, bottom: 72 };
    ctx.font = f.body(34);
    const w = measure(pageText) + 60;
    pill(ctx, pageText, WIDTH - 56 - w, 64, { bg: "#fff", fg: theme.sub, font: f.body(34) });
  }

  // 見出しと本文を1つのまとまりとして、上下の中央に置く
  const titleSize = 66;
  const bodySize = 48;
  ctx.font = f.head(titleSize);
  const titleLines = theme.center
    ? balancedLines(slide.title, theme.width, measure).slice(0, 2)
    : wrapLines(slide.title, theme.width, measure, 2);
  ctx.font = f.body(bodySize);
  const bodyLines = wrapBody(slide.body, theme.width, measure, 11);
  const titleLineHeight = titleSize * 1.4;
  const bodyLineHeight = bodySize * 1.75;
  const gap = 100;
  const blockHeight = titleLines.length * titleLineHeight + gap + bodyLines.length * bodyLineHeight;
  let y = Math.max(theme.top, (HEIGHT - blockHeight) / 2 + 40);
  const titleX = theme.center ? WIDTH / 2 : theme.x;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.title;
  ctx.font = f.head(titleSize);
  ctx.textAlign = theme.center ? "center" : "left";
  for (const line of titleLines) {
    ctx.fillText(line, titleX, y);
    y += titleLineHeight;
  }
  ctx.textAlign = "left";
  ctx.fillStyle = theme.bar;
  if (theme.center) ctx.fillRect(WIDTH / 2 - 30, y - 30, 60, 2);
  else ctx.fillRect(theme.x, y - 30, 80, design.taste === "cool" && !photo ? 10 : 6);
  y += gap - 20;

  ctx.fillStyle = theme.body;
  ctx.font = f.body(bodySize);
  for (const line of bodyLines) {
    ctx.fillText(line, theme.x, y);
    y += bodyLineHeight;
  }

  // 下の帯：店名と、続きがあることの合図
  ctx.font = f.body(32);
  ctx.fillStyle = design.taste === "cool" && !photo ? p.pop : theme.sub;
  const footY = HEIGHT - theme.bottom;
  if (shopName) {
    ctx.textAlign = theme.center ? "center" : "left";
    ctx.fillText(shopName, theme.center ? WIDTH / 2 : theme.x, footY);
    ctx.textAlign = "left";
  }
  if (page < total) {
    const hint = theme.center ? "→" : "スワイプ →";
    ctx.fillStyle = theme.sub;
    ctx.fillText(hint, WIDTH - theme.x - measure(hint), footY);
  }
  return toJpeg(canvas);
}
