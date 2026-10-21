"use client";

import { useEffect, useState } from "react";
import { GOALS, type Goal } from "@/lib/buzz";
import { INDUSTRIES, type ImageMode } from "@/lib/input";
import { cardFile } from "@/lib/paths";
import type { ImageState, Plan, Post } from "@/lib/plan";
import { NEEDS_CHECK } from "@/lib/prompt";
import { SlideDeck } from "./SlideDeck";

type Props = {
  plan: Plan;
  images: ImageState[];
  // 文字を重ねたカード画像の置き場所（planBaseUrl）。n枚目は `${cardBase}/card-<n>.jpg`
  cardBase: string;
};

export function PlanView({ plan, images, cardBase }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const industry = INDUSTRIES[plan.input.industry];
  const readyCount = images.filter((s) => s !== "pending").length;
  const goalCounts = (Object.keys(GOALS) as Goal[])
    .map((g) => ({
      goal: g,
      count: plan.posts.filter((p) => p.goal === g).length,
    }))
    .filter((c) => c.count > 0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <section className="card p-4">
        <p className="text-sm text-muted">
          {industry.emoji} {industry.label}
          {plan.input.shopName && `｜${plan.input.shopName}`}
        </p>
        <p className="mt-1 font-bold">「{plan.input.concept}」の1週間</p>
        <p className="mt-2">{plan.overview}</p>
        {goalCounts.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-sm font-bold">伸びやすさの工夫</p>
            <p className="mt-1 text-sm text-muted">
              Instagramは「いいね」より「保存」と「友だちへの送信」を重く見るとされるため、狙う反応を投稿ごとに変えています。
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {goalCounts.map(({ goal, count }) => (
                <li key={goal}>
                  <GoalBadge goal={goal} suffix={`×${count}`} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {readyCount < images.length && (
          <p className="mt-3 flex items-center gap-2 text-sm text-brand" role="status">
            <span aria-hidden className="inline-block size-2 animate-pulse rounded-full bg-brand" />
            画像を作成中… {readyCount}/{images.length}枚
          </p>
        )}
      </section>

      {plan.searchKeywords && plan.searchKeywords.length > 0 && (
        <SearchSection
          keywords={plan.searchKeywords}
          profileName={plan.profileName}
          hasArea={Boolean(plan.input.area)}
          onCopied={() => setToast("名前欄の例をコピーしました")}
          onCopyFailed={() => setToast("コピーできませんでした。長押しで選択してください")}
        />
      )}

      <div role="note" className="mt-4 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-warn">
        <p className="font-bold">
          <span aria-hidden>👀 </span>投稿前に、必ず人の目でご確認ください
        </p>
        <p className="mt-1 text-sm">AIの下書きです。「⚠ 要確認」の箇所は、正しい情報に書き換えてからお使いください。</p>
      </div>

      <ol className="mt-6 space-y-8">
        {plan.posts.map((post, i) => (
          <li key={post.date} id={`post-${i}`} className="scroll-mt-4">
            <PostCard
              post={post}
              imageState={images[i]}
              cardSrc={`${cardBase}/${cardFile(i)}`}
              industryColors={industry.colors}
              imageMode={plan.input.imageMode ?? "ai"}
              shopName={plan.input.shopName}
              onToast={setToast}
              onCopied={() => setToast("投稿文をコピーしました")}
              onCopyFailed={() => setToast("コピーできませんでした。長押しで選択してください")}
            />
          </li>
        ))}
      </ol>

      <PhaseThree />

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-full bg-foreground px-5 py-3 text-center text-white shadow-lg"
        >
          <span aria-hidden>✓ </span>
          {toast}
        </div>
      )}
    </>
  );
}

function PostCard({
  post,
  imageState,
  cardSrc,
  industryColors,
  imageMode,
  shopName,
  onToast,
  onCopied,
  onCopyFailed,
}: {
  post: Post;
  imageState: ImageState;
  cardSrc: string;
  industryColors: readonly [string, string];
  imageMode: ImageMode;
  shopName?: string;
  onToast: (message: string) => void;
  onCopied: () => void;
  onCopyFailed: () => void;
}) {
  const [broken, setBroken] = useState(false);
  // 作成中に開いた結果ページでは、まだ無い画像の読み込みが失敗するので「作成中」として出す
  if (broken && imageState !== "pending") imageState = "pending";
  const hashtags = post.hashtags.map((t) => `#${t}`).join(" ");
  const hasWarnings = post.checkItems.length > 0 || post.riskyWords.length > 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${post.caption}\n\n${hashtags}`);
      onCopied();
    } catch {
      onCopyFailed();
    }
  }

  return (
    <article className="card overflow-hidden">
      <header className="flex items-baseline justify-between gap-2 px-4 pb-3 pt-4">
        <p className="text-lg font-bold">{post.label}</p>
        <p className="text-sm text-muted">{post.theme}</p>
      </header>
      {post.goal && (
        <div className="px-4 pb-3">
          <GoalBadge goal={post.goal} />
          <p className="mt-1 text-sm text-muted">{GOALS[post.goal].why}</p>
        </div>
      )}
      {post.slides && post.slides.length > 0 && (
        <p className="px-4 pb-3 text-sm">
          <span className="font-bold">
            <span aria-hidden>🧩 </span>全{post.slides.length + 1}枚構成
          </span>
          {post.slideReason && <span className="text-muted">：{post.slideReason}</span>}
        </p>
      )}

      {post.slides && post.slides.length > 0 ? (
        <SlideDeck
          post={{ ...post, slides: post.slides }}
          imageMode={imageMode}
          imageState={imageState}
          coverSrc={cardSrc}
          style={{ colors: industryColors, shopName }}
          onToast={onToast}
        />
      ) : (
        <div className="relative aspect-[4/5] w-full">
          {imageState === "pending" || imageState === "missing" ? (
            <div
              className="absolute inset-0 flex flex-col justify-end p-6"
              style={{
                background: `linear-gradient(160deg, ${industryColors[0]}, ${industryColors[1]})`,
              }}
            >
              {imageState === "pending" && <div className="shimmer absolute inset-0" />}
              <p className="relative flex items-center gap-2 text-sm text-white/90">
                {imageState === "pending" ? (
                  <>
                    <span
                      aria-hidden
                      className="inline-block size-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                    />
                    画像を作成中…
                  </>
                ) : (
                  "画像を用意できませんでした"
                )}
              </p>
              <p className="relative mt-2 text-2xl font-bold text-white">{post.headline}</p>
            </div>
          ) : (
            // 文字を重ねた完成カード（サーバーで合成）。LINE・Instagramにそのまま使える
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardSrc}
              alt={post.altText ? `${post.headline}。${post.altText}` : post.headline}
              onError={() => setBroken(true)}
              className="absolute inset-0 size-full object-cover"
            />
          )}
        </div>
      )}

      <div className="space-y-4 p-4">
        <p className="whitespace-pre-wrap">
          <Caption text={post.caption} />
        </p>
        <p className="text-brand">{hashtags}</p>

        {post.keywords && post.keywords.length > 0 && (
          <p className="text-sm text-muted">
            <span aria-hidden>🔍 </span>本文に入っている検索ワード：
            {post.keywords.join("、")}
          </p>
        )}
        {post.altText && (
          <details className="text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold text-brand">
              画像の代替テキスト（Instagramの「詳細設定」に貼る）
            </summary>
            <p className="pb-1">{post.altText}</p>
          </details>
        )}

        {post.reelIdea && (
          <div className="rounded-xl bg-brand-soft px-4 py-3">
            <p className="text-sm font-bold text-brand">
              <span aria-hidden>🎬 </span>リール（動画）にするなら
            </p>
            <p className="mt-1">{post.reelIdea}</p>
          </div>
        )}

        {hasWarnings && (
          <div className="rounded-xl bg-warn-soft px-4 py-3 text-warn">
            <p className="font-bold">
              <span aria-hidden>⚠ </span>投稿前に確認すること
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {post.checkItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {post.riskyWords.map((w) => (
                <li key={w}>
                  「{w}
                  」は誇大な表現や、事実と異なる内容になっていないか確認してください
                </li>
              ))}
            </ul>
          </div>
        )}

        {post.slides && post.slides.length > 0 ? (
          <button type="button" onClick={copy} className="btn-primary w-full">
            <span aria-hidden>📋</span> 文章コピー
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={copy} className="btn-primary">
              <span aria-hidden>📋</span> 文章コピー
            </button>
            {imageState === "pending" || imageState === "missing" ? (
              <button type="button" disabled className="btn-outline">
                {imageState === "pending" ? "画像を作成中…" : "画像なし"}
              </button>
            ) : (
              <a href={cardSrc} target="_blank" rel="noopener" className="btn-outline">
                <span aria-hidden>🖼</span> 画像を開く
              </a>
            )}
          </div>
        )}
        {imageState === "fallback" && (
          <p className="text-sm text-muted">※ 写真の作成がうまくいかなかったため、色の背景で代わりに作っています。</p>
        )}
      </div>
    </article>
  );
}

// お客様が検索しそうな言葉と、名前欄の例。実際の検索回数ではなくAIの推定である点を明記する
function SearchSection({
  keywords,
  profileName,
  hasArea,
  onCopied,
  onCopyFailed,
}: {
  keywords: string[];
  profileName?: string;
  hasArea: boolean;
  onCopied: () => void;
  onCopyFailed: () => void;
}) {
  async function copy() {
    if (!profileName) return;
    try {
      await navigator.clipboard.writeText(profileName);
      onCopied();
    } catch {
      onCopyFailed();
    }
  }

  return (
    <section className="card mt-4 p-4">
      <p className="font-bold">
        <span aria-hidden>🔍 </span>お客様が検索しそうな言葉
      </p>
      <p className="mt-1 text-sm text-muted">
        Instagramの検索は、名前欄や本文の言葉をもとに結果を出すとされます。各投稿の本文に、この言葉を自然に入れています（AIの推定で、実際の検索回数のデータではありません）。
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {keywords.map((k) => (
          <li key={k} className="rounded-full bg-brand-soft px-3 py-1 text-sm text-brand">
            {k}
          </li>
        ))}
      </ul>
      {!hasArea && (
        <p className="mt-3 text-sm text-muted">
          <span aria-hidden>💡 </span>
          「もっと詳しく書く」でエリア（駅名・地域名）を入れると、「地名＋業種」のような、近くのお客様が実際に使う言葉も提案できます。
        </p>
      )}
      {profileName && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-sm font-bold">プロフィールの「名前」欄の例</p>
          <p className="mt-1 break-all">
            <Caption text={profileName} />
          </p>
          <button type="button" onClick={copy} className="btn-outline mt-2 w-full">
            <span aria-hidden>📋</span> 名前欄の例をコピー
          </button>
        </div>
      )}
    </section>
  );
}

// 狙う反応を、色だけでなく絵文字と言葉で示す
function GoalBadge({ goal, suffix }: { goal: Goal; suffix?: string }) {
  const g = GOALS[goal];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-surface px-3 py-1 text-sm font-bold text-brand">
      <span aria-hidden>{g.emoji}</span>
      狙い：{g.label}
      {suffix && <span className="font-normal text-muted">{suffix}</span>}
    </span>
  );
}

// 【要確認】を、色だけでなく印と文字でも目立たせる
function Caption({ text }: { text: string }) {
  const parts = text.split(NEEDS_CHECK);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="mx-0.5 rounded bg-warn-soft px-1 font-bold text-warn ring-1 ring-warn/40">⚠ 要確認</mark>
          )}
        </span>
      ))}
    </>
  );
}

// 将来の完成形（今回は説明のみ）。自動投稿でも必ず人の承認を挟む
function PhaseThree() {
  return (
    <section className="card mt-10 p-4">
      <p className="text-sm font-bold text-brand">今後の予定</p>
      <p className="mt-1 font-bold">承認すると、Instagramに予約投稿</p>
      <ol className="mt-3 flex items-center gap-1 text-sm">
        {["AIが下書き", "あなたが確認・承認", "予約投稿"].map((step, i) => (
          <li key={step} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden className="text-muted">
                →
              </span>
            )}
            <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">{step}</span>
          </li>
        ))}
      </ol>
      <button type="button" disabled className="btn-outline mt-4 w-full">
        <span aria-hidden>🔒</span> 承認して予約投稿（準備中）
      </button>
    </section>
  );
}
