// 保存場所の決まりごと。サーバーと画面（ブラウザ）の両方から使う
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isPlanId(id: string): boolean {
  return ID_PATTERN.test(id);
}

// 画面（ブラウザ）からも使うため NEXT_PUBLIC_ にしている
export function planBaseUrl(id: string): string {
  const base = (process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/plans/${id}`;
}

export const cardFile = (index: number) => `card-${index}.jpg`;
export const PLAN_FILE = "plan.json";
export const FINAL_FILE = "final.json";
