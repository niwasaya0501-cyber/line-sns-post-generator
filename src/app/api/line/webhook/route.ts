import { NextResponse, type NextRequest } from "next/server";
import type { webhook } from "@line/bot-sdk";
import { replyMessage, verifyWebhookSignature } from "@/lib/line";
import { buildStartMessage } from "@/lib/messages";

// 何を話しかけられても「投稿案を作る」ボタンを返す。
// 業種などの入力はLINE内の入力画面(LIFF)で受け取るため、ここでは文章の中身を解釈・保存しない
export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifyWebhookSignature(body, req.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(body) as webhook.CallbackRequest;
  await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" && event.type !== "follow") return;
      if (!("replyToken" in event) || !event.replyToken) return;
      try {
        await replyMessage(event.replyToken, [buildStartMessage()]);
      } catch (err) {
        console.error("[webhook] 返信に失敗", err instanceof Error ? err.message : err);
      }
    }),
  );

  return NextResponse.json({ ok: true });
}
