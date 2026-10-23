"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ImageMode } from "@/lib/input";
import type { ImageState, Post, Slide } from "@/lib/plan";
import { loadPhoto, renderCover, renderSlide, type DeckStyle } from "@/lib/slide-canvas";
import { Spinner } from "./Spinner";

type Props = {
  post: Post & { slides: Slide[] };
  imageMode: ImageMode;
  imageState: ImageState;
  // AIが作った表紙（サーバーで合成済み）の場所
  coverSrc: string;
  style: DeckStyle;
  onToast: (message: string) => void;
};

// 表紙＋スライドを、Instagramと同じように横にスワイプして見られるようにする。
// 「自分の写真」では、1枚ずつ写真を選ぶと、その場で文字を重ねた画像を作り直す
export function SlideDeck({ post, imageMode, imageState, coverSrc, style, onToast }: Props) {
  const total = post.slides.length + 1;
  const useServerCover = imageMode === "ai" && imageState !== "missing";
  const [urls, setUrls] = useState<(string | null)[]>(() => Array(total).fill(null));
  const [photos, setPhotos] = useState<(ImageBitmap | null)[]>(() => Array(total).fill(null));
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const blobs = useRef<(Blob | null)[]>(Array(total).fill(null));
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { taste, palette } = style.design;
  const shopName = style.shopName;

  // 画面を離れるときに、作った画像のURLを片付ける
  const liveUrls = useRef<(string | null)[]>([]);
  useEffect(() => () => liveUrls.current.forEach((u) => u && URL.revokeObjectURL(u)), []);

  // スライドを描く（写真を選び直したときも、ここで描き直す）
  useEffect(() => {
    let cancelled = false;
    const deckStyle: DeckStyle = { design: { taste, palette }, shopName };
    (async () => {
      for (let i = 0; i < total; i++) {
        if (i === 0 && useServerCover) continue;
        try {
          const blob =
            i === 0
              ? await renderCover(post, photos[0], deckStyle)
              : await renderSlide(post.slides[i - 1], i + 1, total, photos[i], deckStyle);
          if (cancelled) return;
          blobs.current[i] = blob;
          const url = URL.createObjectURL(blob);
          const old = liveUrls.current[i];
          liveUrls.current[i] = url;
          setUrls((prev) => prev.map((u, j) => (j === i ? url : u)));
          if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
        } catch (err) {
          console.error("スライドを描けませんでした", i, err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post, photos, taste, palette, shopName, total, useServerCover]);

  function onScroll() {
    const el = scroller.current;
    if (el) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(index: number) {
    const el = scroller.current;
    el?.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const bitmap = await loadPhoto(file);
      setPhotos((prev) => prev.map((p, i) => (i === current ? bitmap : p)));
    } catch {
      onToast("この写真は読み込めませんでした。別の写真をお試しください");
    }
  }

  function removePhoto() {
    setPhotos((prev) => prev.map((p, i) => (i === current ? null : p)));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const files: File[] = [];
      for (let i = 0; i < total; i++) {
        let blob = blobs.current[i];
        if (i === 0 && useServerCover) blob = await (await fetch(coverSrc)).blob();
        if (!blob) throw new Error("まだ作成中のスライドがあります");
        files.push(new File([blob], `${post.date}-${i + 1}.jpg`, { type: "image/jpeg" }));
      }
      // スマホでは共有メニューから「画像を保存」で、全部まとめて写真アプリに入れられる
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files });
        return;
      }
      for (const file of files) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      }
      onToast(`${total}枚の画像を保存しました`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // 共有メニューを閉じただけ
      onToast("保存できませんでした。画像を長押しして1枚ずつ保存してください");
    } finally {
      setSaving(false);
    }
  }

  const coverPending = useServerCover && imageState === "pending";
  const currentGuide = current === 0 ? post.coverPhotoGuide : post.slides[current - 1]?.photoGuide;

  return (
    <div>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${total}枚の画像。横にスワイプして見られます`}
        >
          {Array.from({ length: total }, (_, i) => {
            const src = i === 0 && useServerCover ? (coverPending ? null : coverSrc) : urls[i];
            return (
              <div key={i} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-brand-soft">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={i === 0 ? post.headline : `${post.slides[i - 1].title}。${post.slides[i - 1].body}`}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 text-brand">
                    <Spinner /> {i === 0 && coverPending ? "画像を作成中…" : "準備中…"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 矢印は画像に重ねず、ページの点の両側に置く（スマホでは横スワイプでも動かせる） */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => go(current - 1)}
          disabled={current === 0}
          aria-label="前の画像"
          className="flex size-11 items-center justify-center rounded-full text-2xl text-brand disabled:opacity-30"
        >
          ‹
        </button>
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`size-2 rounded-full ${i === current ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(current + 1)}
          disabled={current === total - 1}
          aria-label="次の画像"
          className="flex size-11 items-center justify-center rounded-full text-2xl text-brand disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <p className="text-center text-sm text-muted" aria-live="polite">
        {current + 1} / {total}枚目
      </p>

      {imageMode === "own" && (
        <div className="mx-4 mt-3 rounded-xl border border-line px-4 py-3">
          <p className="text-sm font-bold">
            <span aria-hidden>📷 </span>
            {current + 1}枚目に合う写真
          </p>
          {currentGuide && <p className="mt-1">{currentGuide}</p>}
          <input ref={fileInput} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} className="btn-primary flex-1">
              {photos[current] ? "写真を変える" : "写真を選ぶ"}
            </button>
            {photos[current] && (
              <button type="button" onClick={removePhoto} className="btn-outline">
                外す
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">写真はこの端末の中だけで使い、送信・保存はされません。</p>
        </div>
      )}

      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving || coverPending}
          className="btn-outline w-full"
        >
          {saving ? (
            <>
              <Spinner /> 準備中…
            </>
          ) : coverPending ? (
            "画像を作成中…"
          ) : (
            <>
              <span aria-hidden>⬇</span> 全{total}枚を保存
            </>
          )}
        </button>
        <p className="mt-1 text-center text-sm text-muted">うまく保存できないときは、画像を長押しして保存できます</p>
      </div>
    </div>
  );
}
