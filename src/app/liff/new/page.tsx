"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FREQUENCIES, INDUSTRIES, type Frequency, type Industry } from "@/lib/input";
import { Spinner } from "@/components/Spinner";
import { LivePlan } from "./LivePlan";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;

// 業種ごとの「一言」の記入例（何を書けばいいか迷わないように）
const CONCEPT_EXAMPLES: Record<Industry, string> = {
  hair: "例: 30代向けの、落ち着いたヘアサロン",
  food: "例: 駅前の、手作りパンが自慢の小さなカフェ",
  seitai: "例: デスクワークの方が通う、完全予約制の整体院",
  nail: "例: オフィスでも浮かない、上品なネイルが得意なサロン",
  retail: "例: 北欧の器と雑貨を扱うセレクトショップ",
  other: "例: 子ども向けのプログラミング教室",
};

export default function NewPlanPage() {
  const [idToken, setIdToken] = useState<string | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);

  const [industry, setIndustry] = useState<Industry | null>(null);
  const [concept, setConcept] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [shopName, setShopName] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [event, setEvent] = useState("");
  const [strengths, setStrengths] = useState("");
  const [target, setTarget] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Response | null>(null);

  // LIFF初期化（LIFF ID未設定のローカル確認時は、ブラウザでそのまま使えるようにする）
  useEffect(() => {
    if (!LIFF_ID) return;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        setIdToken(liff.getIDToken());
      } catch {
        setLiffError("LINEとの接続に失敗しました。画面を閉じて、もう一度開いてください。");
      }
    })();
  }, []);

  const canSubmit = industry !== null && concept.trim().length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          input: { industry, concept, shopName, frequency, event, strengths, target },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "作成を始められませんでした");
      }
      setLive(res);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "通信できませんでした。電波の良い場所で、もう一度お試しください。",
      );
      setSubmitting(false);
    }
  }

  if (live) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
        <h1 className="mt-1 text-2xl font-bold">1週間分の投稿案</h1>
        <LivePlan response={live} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-6">
      <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
      <h1 className="mt-1 text-2xl font-bold leading-snug">1週間分の投稿案をつくる</h1>
      <p className="mt-2 text-muted">業種とお店の一言だけでOK。約1分で、投稿文・ハッシュタグ・画像ができます。</p>

      {liffError && <Alert>{liffError}</Alert>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-7">
        <fieldset>
          <legend className="font-bold">
            業種 <Required />
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(INDUSTRIES) as Industry[]).map((key) => {
              const selected = industry === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setIndustry(key)}
                  aria-pressed={selected}
                  className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left text-base tracking-tight transition ${
                    selected
                      ? "border-brand bg-brand-soft font-bold text-brand ring-2 ring-brand"
                      : "border-line bg-surface"
                  }`}
                >
                  <span aria-hidden>{INDUSTRIES[key].emoji}</span>
                  <span className="flex-1 leading-snug">{INDUSTRIES[key].short}</span>
                  {selected && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="font-bold">
            お店・事業の一言 <Required />
          </span>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={CONCEPT_EXAMPLES[industry ?? "hair"]}
            className="field mt-2 resize-none"
          />
        </label>

        <div className="card">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="flex min-h-14 w-full items-center justify-between px-4 text-left font-bold"
          >
            <span>
              もっと詳しく書く <span className="text-sm font-normal text-muted">（任意・精度が上がります）</span>
            </span>
            <span aria-hidden className={`transition ${showDetails ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {showDetails && (
            <div className="space-y-5 border-t border-line px-4 pb-5 pt-4">
              <label className="block">
                <span className="font-bold">店名</span>
                <span className="block text-sm text-muted">画像に入れます</span>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  maxLength={30}
                  placeholder="例: HAIR SALON NIWA"
                  className="field mt-2"
                />
              </label>

              <fieldset>
                <legend className="font-bold">投稿の頻度</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(FREQUENCIES) as Frequency[]).map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setFrequency(key)}
                      aria-pressed={frequency === key}
                      className={`min-h-11 rounded-full border px-4 text-base ${
                        frequency === key
                          ? "border-brand bg-brand font-bold text-white"
                          : "border-line bg-surface"
                      }`}
                    >
                      {frequency === key && "✓ "}
                      {FREQUENCIES[key].label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="font-bold">今月のイベント・キャンペーン</span>
                <span className="block text-sm text-muted">日付・料金は、ここに書いた内容だけを使います</span>
                <textarea
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="例: 10/25〜10/31 ハロウィン限定デザイン 10%OFF"
                  className="field mt-2 resize-none"
                />
              </label>

              <label className="block">
                <span className="font-bold">強み・こだわり</span>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="例: 全席個室、オーガニックのカラー剤を使用"
                  className="field mt-2 resize-none"
                />
              </label>

              <label className="block">
                <span className="font-bold">来てほしいお客様</span>
                <textarea
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="例: 仕事帰りに立ち寄りたい会社員の方"
                  className="field mt-2 resize-none"
                />
              </label>
            </div>
          )}
        </div>

        <p className="text-sm text-muted">
          ※ お客様のお名前・電話番号などの個人情報は入力しないでください。作成した内容は7日後に自動で削除されます。
        </p>

        {error && <Alert>{error}</Alert>}

        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-background/95 px-4 py-3 backdrop-blur">
          <button type="submit" disabled={!canSubmit} className="btn-primary mx-auto flex w-full max-w-xl">
            {submitting ? (
              <>
                <Spinner /> 作成を始めています…
              </>
            ) : (
              "投稿案をつくる"
            )}
          </button>
          {!submitting && (industry === null || !concept.trim()) && (
            <p className="mt-1 text-center text-sm text-muted">業種と一言を入力すると押せます</p>
          )}
        </div>
      </form>
    </main>
  );
}

function Required() {
  return <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-xs font-bold text-white">必須</span>;
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">
      <span aria-hidden>⚠️ </span>
      {children}
    </p>
  );
}
