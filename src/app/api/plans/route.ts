import { waitUntil } from "@vercel/functions";
import { NextResponse, type NextRequest } from "next/server";
import { planInputSchema } from "@/lib/input";
import { isLiffConfigured, verifyLiffIdToken } from "@/lib/line";
import type { PlanEvent } from "@/lib/plan";
import { FAILURE_MESSAGE, runPlan } from "@/lib/pipeline";

// 投稿文(約10秒)＋画像(最大90秒)を続けて処理するため長めに取る
export const maxDuration = 300;

// 作成を始め、途中経過を1行1JSONで流し続ける（画面側は2秒おきに問い合わせなくてよい）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = planInputSchema.safeParse(body?.input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" },
      { status: 400 },
    );
  }

  // LIFFが設定済みの環境では、LINEから開いた人だけが使えるようにする（AI利用料の無制限な消費を防ぐ）
  let lineUserId: string | null = null;
  if (isLiffConfigured()) {
    if (typeof body?.idToken !== "string") {
      return NextResponse.json({ error: "LINEアプリから開いてください" }, { status: 401 });
    }
    try {
      lineUserId = await verifyLiffIdToken(body.idToken);
    } catch {
      return NextResponse.json(
        { error: "LINEの認証が切れました。画面を閉じて、もう一度開いてください" },
        { status: 401 },
      );
    }
  }

  const id = crypto.randomUUID();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const emit = (event: PlanEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // 画面が閉じられても、作成は続けてLINEに届ける
          open = false;
        }
      };
      emit({ type: "started", id });

      const job = runPlan(id, parsed.data, lineUserId, emit)
        .catch((err) => {
          console.error("[plan] 予期しないエラー", id, err instanceof Error ? err.message : err);
          emit({ type: "failed", message: FAILURE_MESSAGE });
        })
        .finally(() => {
          if (open) controller.close();
          open = false;
        });
      // 画面との通信が切れても、最後まで処理させる
      waitUntil(job);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
