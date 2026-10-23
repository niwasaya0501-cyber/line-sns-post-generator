// カード・スライド画像の寸法と文字の配置。サーバー（表紙の合成）と画面（canvasでの合成）の両方で使う

export const WIDTH = 1080;
export const HEIGHT = 1350;
export const MARGIN = 72;
export const TEXT_WIDTH = WIDTH - MARGIN * 2;

// 日本語は単語の途中でも改行されるため、なるべく1行に収まる大きさにする（長すぎる場合は2行）
// 半角の英数字・記号は全角の約半分の幅として数える
export function headlineFontSize(headline: string, width = TEXT_WIDTH, max = 88, min = 56): number {
  const ems = [...headline].reduce((sum, ch) => sum + (/[\x20-\x7e]/.test(ch) ? 0.55 : 1), 0);
  return Math.max(min, Math.min(max, Math.floor(width / ems)));
}

// 文字の折り返し。画面（canvas）でもテストでも使えるよう、幅の測り方は外から受け取る

// 行の先頭に来ると読みにくい文字（句読点・閉じかっこ・小さい文字・長音）
const NO_LINE_START = new Set([..."、。，．,.！？!?）)」』】〕〉》ー…‥ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ"]);

export function wrapLines(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines = Infinity,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const ch of paragraph) {
      if (line && measure(line + ch) > maxWidth && !NO_LINE_START.has(ch)) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    lines.push(line);
  }

  return truncateLines(lines, maxWidth, measure, maxLines);
}

// 見出し用。行数を変えずに幅を狭めていき、各行の長さをそろえる（CSS の text-wrap: balance と同じ考え方）
export function balancedLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines = wrapLines(text, maxWidth, measure);
  if (lines.length < 2) return lines;
  let best = lines;
  for (let w = maxWidth - 4; w > 0; w -= 4) {
    const next = wrapLines(text, w, measure);
    if (next.length !== lines.length) break;
    best = next;
  }
  return best;
}

// 本文用。段落ごとに折り返し、最後の行に1〜2文字だけ残る段落は行の長さをそろえる
export function wrapBody(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines: number,
): string[] {
  const lines = text.split("\n").flatMap((paragraph) => {
    const wrapped = wrapLines(paragraph, maxWidth, measure);
    const orphan = wrapped.length > 1 && [...wrapped[wrapped.length - 1]].length <= 2;
    return orphan ? balancedLines(paragraph, maxWidth, measure) : wrapped;
  });
  return truncateLines(lines, maxWidth, measure, maxLines);
}

// 行数の上限を超えたら、最後の行を…で終える
function truncateLines(lines: string[], maxWidth: number, measure: (s: string) => number, maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fitEllipsis(kept[maxLines - 1], maxWidth, measure);
  return kept;
}

function fitEllipsis(line: string, maxWidth: number, measure: (s: string) => number): string {
  let last = line;
  while (last && measure(last + "…") > maxWidth) last = [...last].slice(0, -1).join("");
  return last + "…";
}
