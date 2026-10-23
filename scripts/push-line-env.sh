#!/bin/bash
# .env.local に貼った LINE の鍵を、Vercel の本番（Production）に登録する。鍵の値は画面に出さない
# 使い方: bash scripts/push-line-env.sh
set -e
cd "$(dirname "$0")/.."

KEYS="LINE_CHANNEL_SECRET LINE_CHANNEL_ACCESS_TOKEN LINE_LOGIN_CHANNEL_ID NEXT_PUBLIC_LIFF_ID"

for key in $KEYS; do
  # 「KEY=値」の行から値だけを取り出す（前後の空白と "" は外す）
  value=$(grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | sed -E 's/^[[:space:]]*"?//; s/"?[[:space:]]*$//')
  if [ -z "$value" ]; then
    echo "スキップ: ${key}（.env.local が空欄）"
    continue
  fi
  # 秘密の鍵は、登録後に Vercel の画面でも中身を見られない設定（--sensitive）にする
  sensitive=""
  case "$key" in LINE_CHANNEL_SECRET|LINE_CHANNEL_ACCESS_TOKEN) sensitive="--sensitive" ;; esac
  printf '%s' "$value" | vercel env add "$key" production --force --yes $sensitive >/dev/null 2>&1 \
    && echo "登録OK: ${key}" \
    || echo "失敗: ${key}（vercel にログインしているか確認してください）"
done
