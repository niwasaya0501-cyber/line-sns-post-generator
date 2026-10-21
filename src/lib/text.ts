// ハッシュタグは別欄で表示するため、本文の末尾などに混ざったハッシュタグだけの行は取り除く
export function stripHashtagLines(caption: string): string {
  return caption
    .split("\n")
    .filter((line) => !/^\s*([#＃]\S+\s*)+$/.test(line))
    .join("\n")
    .trim();
}
