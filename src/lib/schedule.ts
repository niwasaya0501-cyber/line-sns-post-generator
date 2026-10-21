import { FREQUENCIES, type Frequency } from "./input";

export type ScheduleSlot = { date: string; label: string };

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 投稿日はAIに決めさせず、ここで計算する（日付の誤りを防ぐため）。
// 日本時間の「翌日」から1週間の範囲で、頻度に応じた日を選ぶ
export function buildSchedule(frequency: Frequency, now: Date = new Date()): ScheduleSlot[] {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const base = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + 1);

  return FREQUENCIES[frequency].days.map((offset) => {
    const d = new Date(base + offset * 24 * 60 * 60 * 1000);
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return {
      date: `${d.getUTCFullYear()}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      label: `${m}/${day}(${WEEKDAYS[d.getUTCDay()]})`,
    };
  });
}
