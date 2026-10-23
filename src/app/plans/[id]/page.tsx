import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isPlanId } from "@/lib/paths";
import { Spinner } from "@/components/Spinner";
import { SavedPlan } from "./SavedPlan";

// LINEのカードから開く結果ページ
// 見出しは先に出し、URLのIDを読む部分だけ Suspense の中で待つ（Cache Components では枠の外で params を読むと公開時の組み立てが失敗する）
export default function PlanPage({ params }: PageProps<"/plans/[id]">) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
      <h1 className="mt-1 text-2xl font-bold">1週間分の投稿案</h1>
      <Suspense
        fallback={
          <p className="mt-6 flex items-center gap-2 text-muted" role="status">
            <Spinner /> 読み込み中…
          </p>
        }
      >
        <PlanBody params={params} />
      </Suspense>
    </main>
  );
}

async function PlanBody({ params }: Pick<PageProps<"/plans/[id]">, "params">) {
  const { id } = await params;
  if (!isPlanId(id)) notFound();
  return <SavedPlan id={id} />;
}
