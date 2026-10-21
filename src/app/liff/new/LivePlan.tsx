"use client";

import { useEffect, useRef, useState } from "react";
import { PlanView } from "@/components/PlanView";
import { FailureCard, WritingProgress } from "@/components/Progress";
import { planBaseUrl } from "@/lib/paths";
import type { ImageState, Plan, PlanEvent } from "@/lib/plan";

const CONNECTION_LOST =
  "通信が途切れました。作成は続いているので、完成するとLINEにお届けします。届かない場合は、もう一度お試しください。";

// /api/plans の応答（1行1JSONの知らせ）を読みながら、できたところから表示する
export function LivePlan({ response }: { response: Response }) {
  const [id, setId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [images, setImages] = useState<ImageState[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // 応答は一度しか読めないため、開発時に effect が2回走っても読み始めは1回だけにする
    const body = response.body;
    if (!body || started.current) return;
    started.current = true;
    const reader = body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let finished = false;

    function handle(event: PlanEvent) {
      switch (event.type) {
        case "started":
          setId(event.id);
          // 再読み込みやLINEで共有しても同じ結果が見られるよう、URLを結果ページに変える
          window.history.replaceState(null, "", `/plans/${event.id}`);
          break;
        case "plan":
          setPlan(event.plan);
          setImages(event.plan.posts.map(() => "pending"));
          break;
        case "image":
          setImages((prev) => prev.map((s, i) => (i === event.index ? event.state : s)));
          break;
        case "done":
          finished = true;
          break;
        case "failed":
          finished = true;
          setFailure(event.message);
          break;
      }
    }

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) handle(JSON.parse(line) as PlanEvent);
        }
      } catch {
        // 下で、終わりの知らせが来ていなければ通信切れとして扱う
      }
      if (!finished) setFailure(CONNECTION_LOST);
    })();
  }, [response]);

  if (failure && !plan) return <FailureCard message={failure} />;
  if (!plan || !id) return <WritingProgress />;

  return (
    <div className="mt-6">
      {failure && (
        <p role="alert" className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">
          <span aria-hidden>⚠️ </span>
          {failure}
        </p>
      )}
      <PlanView plan={plan} images={images} cardBase={planBaseUrl(id)} />
    </div>
  );
}
