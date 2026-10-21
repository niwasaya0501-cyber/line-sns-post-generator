import type { Metadata } from "next";
import Link from "next/link";
import { PlanView } from "@/components/PlanView";
import type { ImageState, Plan } from "@/lib/plan";
import samplePlan from "../../../public/sample/plan.json";
import sampleFinal from "../../../public/sample/final.json";

export const metadata: Metadata = { title: "作成例" };

// 作成例（架空のカフェ）。scripts/make-sample.mts で作ったデータをアプリに同梱しているので、
// AIや通信の調子に関係なく、いつでもすぐ表示できる
export default function SamplePage() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
      <h1 className="mt-1 text-2xl font-bold">作成例：1週間分の投稿案</h1>
      <p className="mt-2 text-muted">
        架空のカフェで作った例です。業種とお店の一言、期間限定メニューを入力すると、こんな投稿案が届きます。
      </p>
      <Link href="/liff/new" className="btn-primary mt-4 w-full">
        自分のお店で試す
      </Link>
      <div className="mt-6">
        <PlanView
          plan={samplePlan as Plan}
          images={sampleFinal.images as ImageState[]}
          cardBase="/sample"
        />
      </div>
    </main>
  );
}
