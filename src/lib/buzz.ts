// 「伸びやすい投稿」にするための決まりごと。
// Instagramは、いいねの数よりも「保存」や「DMで友だちに送る（シェア）」をリーチ（表示される人数）に
// 強く反映するとされる。そこで投稿ごとに、どの反応を狙うかをアプリ側で割り当て、文章の型を変える
export const GOALS = {
  save: {
    label: "保存されやすい",
    emoji: "🔖",
    why: "あとで見返したくなる情報は保存されやすく、多くの人に表示されやすくなります",
    prompt:
      "保存して見返したくなる、役に立つ内容にする（「〇つのコツ」「〜の選び方」「〜を楽しむ3ステップ」など、具体的で一覧にしやすい形）。" +
      "一般的な豆知識は使ってよいが、お店の料金・メニュー・営業時間などの事実は入力にあるものだけを使う。" +
      "最後は「保存して、あとで見返してくださいね」のように保存を促す",
  },
  share: {
    label: "送りたくなる",
    emoji: "📤",
    why: "友だちにDMで送られる投稿は、フォロワー以外にも届きやすくなります",
    prompt:
      "思わず誰かに送りたくなる内容にする（「あるある」への共感、「〇〇な人と行きたい」と思える提案など）。" +
      "最後は「〇〇な友だちに送ってみてください」のように、送る相手が具体的に浮かぶ一言で終える",
  },
  comment: {
    label: "コメントが集まる",
    emoji: "💬",
    why: "答えやすい質問はコメントを生み、お客様との会話が続くきっかけになります",
    prompt:
      "読んだ人が一言で答えられる質問を入れる（「AとBならどっち派？」のような二択や、好みを聞く質問）。" +
      "最後は「コメントで教えてください」のように、答え方が分かる一言で終える",
  },
  visit: {
    label: "来店につながる",
    emoji: "📍",
    why: "保存や共感で集めた関心を、来店・予約という行動につなげます",
    prompt:
      "来店・予約したくなる内容にする（イベント・キャンペーンの入力があればその告知を優先）。" +
      "予約方法・営業時間・場所などで入力に無いものは【要確認】にする。最後は来店・予約を促す一言で終える",
  },
} as const;

export type Goal = keyof typeof GOALS;

// 投稿数ごとの組み合わせ。保存をいちばん多くし、来店の案内は多くても2回までにする
const GOAL_PATTERNS: Record<number, Goal[]> = {
  2: ["save", "visit"],
  3: ["save", "share", "visit"],
  5: ["save", "share", "comment", "save", "visit"],
  7: ["save", "share", "comment", "save", "visit", "share", "save"],
};

export function assignGoals(count: number): Goal[] {
  const pattern = GOAL_PATTERNS[count] ?? GOAL_PATTERNS[7];
  return Array.from({ length: count }, (_, i) => pattern[i % pattern.length]);
}

// Instagramは2025年12月から、1投稿のハッシュタグを5個までに制限している
export const MAX_HASHTAGS = 5;

export function normalizeHashtags(tags: string[]): string[] {
  const cleaned = tags.map((t) => t.replace(/^[#＃]+/, "").replace(/\s+/g, "")).filter(Boolean);
  return [...new Set(cleaned)].slice(0, MAX_HASHTAGS);
}
