import { notFound } from "next/navigation";
import { isPlanId } from "@/lib/paths";
import { SavedPlan } from "./SavedPlan";

// LINEのカードから開く結果ページ
export default async function PlanPage({ params }: PageProps<"/plans/[id]">) {
  const { id } = await params;
  if (!isPlanId(id)) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
      <h1 className="mt-1 text-2xl font-bold">1週間分の投稿案</h1>
      <SavedPlan id={id} />
    </main>
  );
}
