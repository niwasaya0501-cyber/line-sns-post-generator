"use client";

import { useEffect, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { INDUSTRY_DESIGN, PALETTES, TASTES, type Design, type Palette, type Taste } from "@/lib/design";
import { loadFontFace } from "@/lib/font-face";
import type { Industry } from "@/lib/input";
import { HEIGHT, WIDTH } from "@/lib/slide-layout";

const PREVIEW_WIDTH = 150;
const SAMPLE_HEADLINE = "秋のおすすめ3選";
const SAMPLE_LABEL = "10/24(土)";

type Props = {
  industry: Industry | null;
  design: Design;
  onChange: (design: Design) => void;
  shopName: string;
};

// 表紙の雰囲気と色を選ぶ。選ぶとすぐに、実際の表紙と同じ部品（CoverArt）で見本を描き直す
export function DesignPicker({ industry, design, onChange, shopName }: Props) {
  const rec = industry ? INDUSTRY_DESIGN[industry] : null;
  const isRecommended = rec !== null && rec.taste === design.taste && rec.palette === design.palette;

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 bg-brand-soft/60 p-4">
        <CoverPreview design={design} industry={industry ?? "other"} shopName={shopName.trim() || "お店の名前"} />
        <div className="min-w-0 flex-1 self-center">
          <p className="text-sm text-muted">見本（1枚目）</p>
          <p className="font-bold leading-snug">
            {TASTES[design.taste].label}・{PALETTES[design.palette].label}
          </p>
          <p className="mt-1 text-sm leading-snug text-muted">{TASTES[design.taste].note}</p>
          {isRecommended && (
            <p className="mt-2 inline-block rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
              業種のおすすめ
            </p>
          )}
        </div>
      </div>

      {rec && (
        <div className="border-t border-line px-4 py-3 text-sm">
          <p className="font-bold">
            <span aria-hidden>💡 </span>おすすめ：{TASTES[rec.taste].label}×{PALETTES[rec.palette].label}
          </p>
          <p className="mt-0.5 leading-relaxed text-muted">{rec.why}</p>
          {!isRecommended && (
            <button
              type="button"
              onClick={() => onChange({ taste: rec.taste, palette: rec.palette })}
              className="btn-outline mt-2 min-h-10 text-sm"
            >
              おすすめに戻す
            </button>
          )}
        </div>
      )}

      <fieldset className="border-t border-line px-4 py-4">
        <legend className="sr-only">雰囲気</legend>
        <p className="text-sm font-bold">雰囲気</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(TASTES) as Taste[]).map((key) => {
            const selected = design.taste === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => onChange({ ...design, taste: key })}
                aria-pressed={selected}
                className={`flex min-h-14 flex-col justify-center rounded-xl border px-3 py-2 text-left transition ${
                  selected ? "border-brand bg-brand-soft text-brand ring-2 ring-brand" : "border-line bg-surface"
                }`}
              >
                <span className="font-bold">
                  <span aria-hidden>{TASTES[key].emoji} </span>
                  {TASTES[key].label}
                  {selected && <span aria-hidden> ✓</span>}
                </span>
                <span className="text-xs leading-snug text-muted">{TASTES[key].note}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-line px-4 pb-4 pt-3">
        <legend className="sr-only">色</legend>
        <p className="text-sm font-bold">色</p>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {(Object.keys(PALETTES) as Palette[]).map((key) => {
            const selected = design.palette === key;
            const c = PALETTES[key];
            return (
              <button
                type="button"
                key={key}
                onClick={() => onChange({ ...design, palette: key })}
                aria-pressed={selected}
                aria-label={c.label}
                className="flex min-h-14 flex-col items-center gap-1 rounded-xl py-1"
              >
                <span
                  aria-hidden
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                    selected ? "ring-2 ring-brand ring-offset-2" : ""
                  }`}
                  style={{ background: `linear-gradient(135deg, ${c.soft} 0 50%, ${c.accent} 50% 100%)` }}
                >
                  {selected && "✓"}
                </span>
                <span className={`text-xs ${selected ? "font-bold text-brand" : "text-muted"}`}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

// 実寸（1080×1350）で描いて縮小する。写真は業種ごとの見本（scripts/make-design-samples.mts で作成）。フォントは見本の文字だけを読み込む（読み込み中は端末の文字で表示）
function CoverPreview({ design, industry, shopName }: { design: Design; industry: Industry; shopName: string }) {
  const { head, body } = TASTES[design.taste];
  const [fonts, setFonts] = useState<{ head: string; body: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFontFace(head, SAMPLE_HEADLINE), loadFontFace(body, `${SAMPLE_LABEL}${shopName}`)])
      .then(([h, b]) => !cancelled && setFonts({ head: `"${h}"`, body: `"${b}"` }))
      .catch(() => !cancelled && setFonts(null));
    return () => {
      cancelled = true;
    };
  }, [head, body, shopName]);

  const scale = PREVIEW_WIDTH / WIDTH;
  return (
    <div
      aria-hidden
      className="shrink-0 overflow-hidden rounded-lg shadow-md"
      style={{ width: PREVIEW_WIDTH, height: HEIGHT * scale }}
    >
      <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <CoverArt
          headline={SAMPLE_HEADLINE}
          label={SAMPLE_LABEL}
          shopName={shopName}
          photoSrc={`/design-samples/${industry}.jpg`}
          design={design}
          fonts={fonts ?? { head: "sans-serif", body: "sans-serif" }}
          headWeight={head.weight}
          bodyWeight={body.weight}
        />
      </div>
    </div>
  );
}
