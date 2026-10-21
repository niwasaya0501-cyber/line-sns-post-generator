import { del, list } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

const KEEP_DAYS = 7;

// 保存は必要最小限にするため、作成から7日たった投稿案（文章・画像）を毎日消す
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const threshold = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "plans/", cursor, limit: 1000 });
    const old = page.blobs.filter((b) => b.uploadedAt.getTime() < threshold).map((b) => b.url);
    if (old.length > 0) {
      await del(old);
      deleted += old.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json({ deleted });
}
