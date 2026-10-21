"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlanView } from "@/components/PlanView";
import { Spinner } from "@/components/Spinner";
import { FINAL_FILE, PLAN_FILE, planBaseUrl } from "@/lib/paths";
import type { ImageState, Plan } from "@/lib/plan";

type Loaded =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error" }
  | { status: "ok"; plan: Plan; images: ImageState[] | null };

// 保存済みの投稿案を、ブラウザから直接読んで表示する（LINEのカードから開くページ）
export function SavedPlan({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const base = planBaseUrl(id);

  useEffect(() => {
    (async () => {
      try {
        const [planRes, finalRes] = await Promise.all([
          fetch(`${base}/${PLAN_FILE}`),
          // 作成中の「まだ無い」がキャッシュで残らないよう、完了の印は毎回取り直す
          fetch(`${base}/${FINAL_FILE}?t=${Date.now()}`, { cache: "no-store" }),
        ]);
        if (planRes.status === 404) return setLoaded({ status: "notFound" });
        if (!planRes.ok) throw new Error(String(planRes.status));
        const plan = (await planRes.json()) as Plan;
        const images = finalRes.ok ? ((await finalRes.json()) as { images: ImageState[] }).images : null;
        setLoaded({ status: "ok", plan, images });
      } catch {
        setLoaded({ status: "error" });
      }
    })();
  }, [base]);

  if (loaded.status === "loading") {
    return (
      <p className="mt-6 flex items-center gap-2 text-muted" role="status">
        <Spinner /> 読み込み中…
      </p>
    );
  }

  if (loaded.status !== "ok") {
    return (
      <div className="card mt-6 p-6 text-center">
        <p className="font-bold">
          <span aria-hidden>⚠️ </span>
          {loaded.status === "notFound" ? "投稿案が見つかりませんでした" : "読み込みに失敗しました"}
        </p>
        <p className="mt-2 text-muted">
          {loaded.status === "notFound"
            ? "作成中か、保存期間（7日間）が過ぎた可能性があります。"
            : "電波の良い場所で、再読み込みしてください。"}
        </p>
        <a href={`/plans/${id}`} className="btn-outline mt-5 w-full">
          再読み込み
        </a>
        <Link href="/liff/new" className="btn-primary mt-2 w-full">
          新しくつくる
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {loaded.images === null && (
        <p role="status" className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-brand">
          <span aria-hidden>⏳ </span>画像を作成中です。完成するとLINEにお届けします。
        </p>
      )}
      <PlanView
        plan={loaded.plan}
        // 作成中に開いた場合も、できている画像は表示できるよう「ready」として試す
        images={loaded.images ?? loaded.plan.posts.map(() => "ready")}
        cardBase={base}
      />
    </div>
  );
}
