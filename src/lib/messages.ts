import type { messagingApi } from "@line/bot-sdk";
import { GOALS } from "./buzz";
import { INDUSTRIES } from "./input";
import type { ImageState, Plan } from "./plan";
import { cardFile, planBaseUrl } from "./paths";

const BRAND = "#3F5E5A";
const MUTED = "#8A8F8C";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function liffUrl(): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  return liffId ? `https://liff.line.me/${liffId}` : `${appUrl()}/liff/new`;
}

// 話しかけられたとき・友だち追加のときに返す案内
export function buildStartMessage(): messagingApi.Message {
  return {
    type: "flex",
    altText: "1週間分のSNS投稿案を作ります",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "SNS投稿ジェネレーター", size: "xs", color: MUTED },
          {
            type: "text",
            text: "業種とお店の一言だけで、1週間分の投稿案をお作りします",
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "text",
            text: "投稿文・ハッシュタグ・画像を、日付ごとにまとめてお届けします（約1分）",
            size: "sm",
            color: MUTED,
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: BRAND,
            action: { type: "uri", label: "投稿案を作る", uri: liffUrl() },
          },
          {
            type: "button",
            style: "link",
            color: BRAND,
            action: { type: "uri", label: "作成例を見る", uri: `${appUrl()}/sample` },
          },
        ],
      },
    },
  };
}

function truncate(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

// 完成した投稿案を、日付ごとのカードを横に並べたカルーセルで送る
export function buildPlanCarousel(plan: Plan, images: ImageState[]): messagingApi.Message[] {
  const pageUrl = `${appUrl()}/plans/${plan.id}`;
  const industry = INDUSTRIES[plan.input.industry];

  const bubbles: messagingApi.FlexBubble[] = plan.posts.map((post, i) => ({
    type: "bubble",
    size: "kilo",
    ...(images[i] === "ready" || images[i] === "fallback"
      ? {
          hero: {
            type: "image" as const,
            url: `${planBaseUrl(plan.id)}/${cardFile(i)}`,
            size: "full",
            aspectRatio: "4:5",
            aspectMode: "cover" as const,
            action: { type: "uri" as const, label: "全文を見る", uri: `${pageUrl}#post-${i}` },
          },
        }
      : {}),
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: `${post.label}　${post.theme}${post.slides ? `（全${post.slides.length + 1}枚）` : ""}`,
          size: "xxs",
          color: MUTED,
          wrap: true,
        },
        ...(post.goal
          ? [
              {
                type: "text" as const,
                text: `${GOALS[post.goal].emoji} 狙い：${GOALS[post.goal].label}`,
                size: "xxs" as const,
                color: BRAND,
                weight: "bold" as const,
              },
            ]
          : []),
        { type: "text", text: truncate(post.caption, 50), size: "xs", wrap: true, maxLines: 3 },
        ...(post.checkItems.length > 0 || post.riskyWords.length > 0
          ? [{ type: "text" as const, text: "⚠ 確認が必要な箇所があります", size: "xxs" as const, color: "#B26A00" }]
          : []),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          color: BRAND,
          action: { type: "uri", label: "全文・コピー", uri: `${pageUrl}#post-${i}` },
        },
      ],
    },
  }));

  return [
    {
      type: "text",
      text: `${industry.emoji} 1週間分の投稿案ができました！\n\n${plan.overview}\n\n${
        plan.input.imageMode === "own" ? "📷 「全文・コピー」から、ご自分の写真を選んで仕上げてください。\n\n" : ""
      }※投稿前に、内容（特に【要確認】の箇所）を必ずご確認ください。`,
    },
    { type: "flex", altText: "1週間分の投稿案ができました", contents: { type: "carousel", contents: bubbles } },
  ];
}

export function buildFailureMessage(): messagingApi.Message {
  return {
    type: "text",
    text: "申し訳ありません、投稿案の作成に失敗しました🙇\n少し時間をおいて、もう一度「投稿案を作る」からお試しください。",
  };
}
