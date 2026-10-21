import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-10">
      <p className="text-sm font-bold text-brand">SNS投稿ジェネレーター</p>
      <h1 className="mt-2 text-3xl font-bold leading-snug">
        LINEで話しかけるだけで、
        <br />
        1週間分のSNS投稿案
      </h1>
      <p className="mt-4 text-muted">
        業種とお店の一言を送るだけ。投稿文・ハッシュタグ・画像を、日付ごとにまとめてお届けします。
      </p>

      <ol className="mt-8 space-y-3">
        {[
          ["💬", "LINEで話しかける", "インストール不要。いつものLINEで使えます"],
          ["✍️", "業種と一言を入力", "詳しく書くほど、お店らしい内容になります"],
          ["📅", "1週間分が届く", "文章・ハッシュタグ・画像をそのまま使えます"],
        ].map(([icon, title, body], i) => (
          <li key={title} className="card flex gap-4 p-4">
            <span aria-hidden className="text-2xl">
              {icon}
            </span>
            <div>
              <p className="font-bold">
                {i + 1}. {title}
              </p>
              <p className="text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-2">
        <Link href="/sample" className="btn-primary">
          作成例を見る
        </Link>
        <Link href="/liff/new" className="btn-outline">
          ブラウザで試す
        </Link>
      </div>
    </main>
  );
}
