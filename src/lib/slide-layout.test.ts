import { describe, expect, it } from "vitest";
import { balancedLines, wrapBody, wrapLines } from "./slide-layout";

// 1文字=10px として測る、テスト用の物差し
const measure = (s: string) => [...s].length * 10;

describe("wrapLines", () => {
  it("幅に収まるように折り返す", () => {
    expect(wrapLines("あいうえおかきくけこ", 50, measure)).toEqual(["あいうえお", "かきくけこ"]);
  });

  it("改行はそのまま行を分ける", () => {
    expect(wrapLines("あい\nうえ", 100, measure)).toEqual(["あい", "うえ"]);
  });

  it("句読点や閉じかっこを行の先頭に置かない（前の行に残す）", () => {
    expect(wrapLines("あいうえお。かき", 50, measure)).toEqual(["あいうえお。", "かき"]);
  });

  it("行数の上限を超えたら、最後の行を…で終える", () => {
    expect(wrapLines("あいうえおかきくけこさしすせそ", 50, measure, 2)).toEqual(["あいうえお", "かきくけ…"]);
  });
});

describe("balancedLines", () => {
  it("2行になるときは、行の長さをそろえる（1文字だけ次の行に残さない）", () => {
    expect(balancedLines("あいうえおかきくけこさ", 100, measure)).toEqual(["あいうえおか", "きくけこさ"]);
  });

  it("1行に収まるならそのまま", () => {
    expect(balancedLines("あいう", 100, measure)).toEqual(["あいう"]);
  });
});

describe("wrapBody", () => {
  it("段落の最後の行が1〜2文字だけになるときは、その段落の行の長さをそろえる", () => {
    expect(wrapBody("あいうえおかきくけこさ\nたち", 100, measure, 10)).toEqual(["あいうえおか", "きくけこさ", "たち"]);
  });

  it("行数の上限を超えたら…で終える", () => {
    expect(wrapBody("あいうえお\nかきくけこ\nさしすせそ", 50, measure, 2)).toEqual(["あいうえお", "かきくけ…"]);
  });
});
