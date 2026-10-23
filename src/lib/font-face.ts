// ブラウザ用。使う文字だけのフォントを Google Fonts から読み込み、その文字列専用の名前で登録する。
// canvas でのスライド作成と、入力画面のデザイン見本で使う
import type { FontSpec } from "./design";
import { loadFont } from "./font";

const loaded = new Map<string, Promise<string>>();
let fontCount = 0;

export function loadFontFace(spec: FontSpec, text: string): Promise<string> {
  const key = `${spec.family}|${spec.weight}|${text}`;
  let face = loaded.get(key);
  if (!face) {
    face = (async () => {
      const name = `subset-font-${++fontCount}`;
      const font = new FontFace(name, await loadFont(spec, text), { weight: String(spec.weight) });
      document.fonts.add(await font.load());
      return name;
    })();
    // 通信の失敗は次回やり直せるように、覚えておかない
    face.catch(() => loaded.delete(key));
    loaded.set(key, face);
  }
  return face;
}
