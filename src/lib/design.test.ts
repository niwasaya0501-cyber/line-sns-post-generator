import { describe, expect, it } from "vitest";
import { assignGoals, GOALS } from "./buzz";
import { INDUSTRY_DESIGN, PALETTES, PURPOSE_GOALS, PURPOSES, resolveDesign, TASTES, type Purpose } from "./design";
import { INDUSTRIES, planInputSchema, type Industry } from "./input";
import { buildImagePrompt, buildPlanPrompt } from "./prompt";
import { buildSchedule } from "./schedule";

const purposes = Object.keys(PURPOSES) as Purpose[];

describe("目的ごとの狙いの組み合わせ", () => {
  it("どの目的・投稿数でも、決まった数の狙いを返し、どれも定義済みの狙い", () => {
    for (const purpose of purposes) {
      for (const n of [2, 3, 5, 7]) {
        const goals = assignGoals(n, purpose);
        expect(goals).toHaveLength(n);
        for (const g of goals) expect(GOALS[g]).toBeDefined();
      }
    }
  });

  it("「売る」は買いたくなる投稿、「来店」は来店の投稿が、知ってもらう場合より多い", () => {
    const count = (purpose: Purpose, goal: string) => assignGoals(7, purpose).filter((g) => g === goal).length;
    expect(count("sales", "buy")).toBeGreaterThan(count("awareness", "buy"));
    expect(count("visit", "visit")).toBeGreaterThan(count("awareness", "visit"));
    expect(count("fans", "comment")).toBeGreaterThan(count("awareness", "comment"));
  });

  it("行動を促す投稿（来店・購入）ばかりにならず、保存か共感の投稿も入る", () => {
    for (const purpose of purposes) {
      for (const pattern of Object.values(PURPOSE_GOALS[purpose])) {
        expect(pattern.some((g) => g === "save" || g === "share" || g === "comment")).toBe(true);
      }
    }
  });
});

describe("resolveDesign", () => {
  it("未選択なら業種のおすすめ、選んだらその組み合わせ", () => {
    for (const industry of Object.keys(INDUSTRIES) as Industry[]) {
      const rec = INDUSTRY_DESIGN[industry];
      expect(resolveDesign({ industry })).toEqual({ taste: rec.taste, palette: rec.palette });
    }
    expect(resolveDesign({ industry: "food", taste: "cool", palette: "black" })).toEqual({ taste: "cool", palette: "black" });
  });

  it("おすすめは、定義済みの雰囲気と色だけを使う", () => {
    for (const rec of Object.values(INDUSTRY_DESIGN)) {
      expect(TASTES[rec.taste]).toBeDefined();
      expect(PALETTES[rec.palette]).toBeDefined();
    }
  });
});

describe("入力とAIへの指示", () => {
  it("デザインと目的は任意。知らない値は受け付けない", () => {
    expect(planInputSchema.safeParse({ industry: "food", concept: "カフェ" }).success).toBe(true);
    expect(planInputSchema.safeParse({ industry: "food", concept: "カフェ", taste: "cute", palette: "pink", purpose: "sales" }).success).toBe(true);
    expect(planInputSchema.safeParse({ industry: "food", concept: "カフェ", taste: "gorgeous" }).success).toBe(false);
  });

  it("目的と文章の雰囲気が指示に入る", () => {
    const input = planInputSchema.parse({ industry: "nail", concept: "上品なネイル", purpose: "sales", taste: "elegant" });
    const slots = buildSchedule(input.frequency);
    const prompt = buildPlanPrompt(input, slots, assignGoals(slots.length, input.purpose));
    expect(prompt).toContain(PURPOSES.sales.label);
    expect(prompt).toContain(TASTES.elegant.tone);
  });

  it("写真の指示に、雰囲気と色が入る", () => {
    const prompt = buildImagePrompt("A cup of coffee.", { taste: "cool", palette: "black" });
    expect(prompt).toContain(TASTES.cool.imageMood);
    expect(prompt).toContain(PALETTES.black.imageColor);
  });
});
