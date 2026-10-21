"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

const WRITING_STEPS = [
  "お店の雰囲気を読み取っています…",
  "1週間のテーマを考えています…",
  "投稿文とハッシュタグを書いています…",
  "表現をチェックしています…",
];

// 投稿文ができるまでの待ち時間に、進んでいることが分かる表示を出す
export function WritingProgress() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 500);
    return () => clearInterval(t);
  }, []);

  const step = WRITING_STEPS[Math.min(Math.floor(elapsed / 3), WRITING_STEPS.length - 1)];
  return (
    <div className="card mt-6 p-6" role="status">
      <p className="flex items-center gap-3 text-lg font-bold text-brand">
        <Spinner className="size-5" /> 投稿案を作成中
      </p>
      <p className="mt-3">{step}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-soft">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${Math.min(95, (elapsed / 15) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted">文章は10〜20秒ほどでできます。画面はこのままでお待ちください。</p>
    </div>
  );
}

export function FailureCard({ message }: { message: string }) {
  return (
    <div role="alert" className="card mt-6 p-6 text-center">
      <p className="text-lg font-bold">
        <span aria-hidden>⚠️ </span>うまく作成できませんでした
      </p>
      <p className="mt-2 text-muted">{message}</p>
      <Link href="/liff/new" className="btn-primary mt-5 w-full">
        もう一度つくる
      </Link>
      <Link href="/sample" className="btn-outline mt-2 w-full">
        作成例を見る
      </Link>
    </div>
  );
}
