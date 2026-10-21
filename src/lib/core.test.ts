import { describe, expect, it } from "vitest";
import { planInputSchema } from "./input";
import { buildSchedule } from "./schedule";
import { findRiskyExpressions } from "./compliance";
import { stripHashtagLines } from "./text";
import { headlineFontSize } from "./card";

describe("headlineFontSize", () => {
  it("短い見出しは大きく、長い見出しは小さくなる（下限56）", () => {
    expect(headlineFontSize("秋の新メニュー")).toBe(88);
    expect(headlineFontSize("11月の初回体験キャンペーン")).toBe(71);
    expect(headlineFontSize("あ".repeat(30))).toBe(56);
  });
});

describe("stripHashtagLines", () => {
  it("ハッシュタグだけの行を取り除き、本文中の#は残す", () => {
    expect(stripHashtagLines("こんにちは\n#1位の秘密 を紹介\n\n#整体 #肩こりケア\n＃休息")).toBe(
      "こんにちは\n#1位の秘密 を紹介",
    );
  });
});

describe("planInputSchema", () => {
  it("業種と一言だけで通り、頻度は毎日になる", () => {
    const r = planInputSchema.parse({ industry: "hair", concept: "30代向けの落ち着いたヘアサロン" });
    expect(r.frequency).toBe("daily");
  });

  it("一言が空だと通らない", () => {
    expect(planInputSchema.safeParse({ industry: "hair", concept: "  " }).success).toBe(false);
  });

  it("知らない業種は通らない", () => {
    expect(planInputSchema.safeParse({ industry: "casino", concept: "x" }).success).toBe(false);
  });

  it("長すぎる入力は通らない", () => {
    expect(
      planInputSchema.safeParse({ industry: "food", concept: "あ".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("buildSchedule", () => {
  // 2026-10-21(水) 13:00 JST
  const now = new Date("2026-10-21T04:00:00Z");

  it("毎日なら翌日から7日分", () => {
    const s = buildSchedule("daily", now);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ date: "2026-10-22", label: "10/22(木)" });
    expect(s[6].date).toBe("2026-10-28");
  });

  it("週3回なら1日おきに3日", () => {
    expect(buildSchedule("3pw", now).map((d) => d.label)).toEqual([
      "10/22(木)",
      "10/24(土)",
      "10/26(月)",
    ]);
  });

  it("日本時間の深夜でも翌日から始まる", () => {
    // 2026-10-21 23:30 JST = 14:30 UTC
    expect(buildSchedule("2pw", new Date("2026-10-21T14:30:00Z"))[0].date).toBe("2026-10-22");
  });

  it("月をまたいでも正しい", () => {
    const s = buildSchedule("daily", new Date("2026-10-30T04:00:00Z"));
    expect(s[1]).toEqual({ date: "2026-11-01", label: "11/1(日)" });
  });
});

describe("findRiskyExpressions", () => {
  it("どの業種でも断定表現を拾う", () => {
    expect(findRiskyExpressions("地域No.1の絶対おいしいパン", "food")).toEqual(["絶対", "No.1"]);
  });

  it("美容・整体では効果の表現も拾う", () => {
    expect(findRiskyExpressions("肩こりが治る！姿勢も改善", "seitai")).toEqual(["治る", "改善"]);
  });

  it("飲食では効果の表現は拾わない", () => {
    expect(findRiskyExpressions("疲れが改善するスープ", "food")).toEqual([]);
  });

  it("入力に無いお店の状況（人気・空き状況）を拾う", () => {
    expect(findRiskyExpressions("ご好評につき、今週末は残りわずかです", "food")).toEqual([
      "ご好評",
      "残りわずか",
    ]);
  });

  it("問題がなければ空", () => {
    expect(findRiskyExpressions("落ち着いた空間でお待ちしています", "hair")).toEqual([]);
  });
});
