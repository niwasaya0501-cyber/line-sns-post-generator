// 投稿案のファイルと保存時刻を表示（npx tsx --env-file=.env.local scripts/list-plan.mts <id>）
import { list } from "@vercel/blob";
const id = process.argv[2];
for (const b of (await list({ prefix: `plans/${id}/` })).blobs) console.log(b.uploadedAt.toISOString(), b.pathname);
