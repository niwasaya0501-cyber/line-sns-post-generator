import { describe, expect, it } from "vitest";
import { assignGoals, findKeywordsInText, MAX_HASHTAGS, normalizeHashtags } from "./buzz";
import { findRiskyExpressions } from "./compliance";

describe("assignGoals", () => {
  it("毎日なら7件で、保存・送る・コメント・来店がすべて入り、保存がいちばん多い", () => {
    const goals = assignGoals(7);
    expect(goals).toHaveLength(7);
    expect(new Set(goals)).toEqual(new Set(["save", "share", "comment", "visit"]));
    const count = (g: string) => goals.filter((x) => x === g).length;
    expect(count("save")).toBeGreaterThanOrEqual(Math.max(count("share"), count("comment"), count("visit")));
  });

  it("週2回でも、保存と来店の両方が入る", () => {
    expect(new Set(assignGoals(2))).toEqual(new Set(["save", "visit"]));
  });

  it("来店の案内は多くても2回まで", () => {
    for (const n of [2, 3, 5, 7]) {
      expect(assignGoals(n).filter((g) => g === "visit").length).toBeLessThanOrEqual(2);
    }
  });
});

describe("normalizeHashtags", () => {
  it("#を外し、重複を除き、5個までにする（Instagramの上限）", () => {
    expect(
      normalizeHashtags(["#カフェ", "＃カフェ", " スコーン ", "", "自家焙煎", "焼き菓子", "秋限定", "カフェ巡り"]),
    ).toEqual(["カフェ", "スコーン", "自家焙煎", "焼き菓子", "秋限定"]);
    expect(MAX_HASHTAGS).toBe(5);
  });

  it("タグの中の空白は取り除く（空白があるとタグが途中で切れるため）", () => {
    expect(normalizeHashtags(["カフェ 巡り"])).toEqual(["カフェ巡り"]);
  });
});

describe("findRiskyExpressions（いいね・フォローのお願い）", () => {
  it("反応をお願いするだけの表現は、表示が抑えられることがあるので拾う", () => {
    expect(findRiskyExpressions("いいねしてね！フォローした人全員にプレゼント", "food")).toEqual([
      "いいねして",
      "全員に",
    ]);
  });
});

describe("findKeywordsInText", () => {
  const keywords = ["吉祥寺 カフェ", "自家焙煎コーヒー", "スコーン テイクアウト"];

  it("空白で区切った検索ワードは、すべての語が本文にあれば含まれているとみなす", () => {
    expect(findKeywordsInText("吉祥寺駅から5分のカフェです。自家焙煎コーヒーをどうぞ", keywords)).toEqual([
      "吉祥寺 カフェ",
      "自家焙煎コーヒー",
    ]);
  });

  it("一部の語しか無ければ含めない", () => {
    expect(findKeywordsInText("スコーンが焼けました", keywords)).toEqual([]);
  });

  it("全角の空白や、英字の大文字・小文字の違いも同じとみなす", () => {
    expect(findKeywordsInText("Cafe で ランチ", ["cafe　ランチ"])).toEqual(["cafe　ランチ"]);
  });
});
