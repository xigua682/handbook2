#!/usr/bin/env bash
# 把線上版 index.html 解密成明文。
#   tools/decrypt.sh export   -> /workspace/handbook2-export/百寶袋_明文_YYYY-MM-DD.html（給 Claude 的單檔，跟網站實際內容一樣）
#   tools/decrypt.sh src      -> 覆寫 /workspace/handbook-private/handbook2-src/index.html（可讀版原始檔，卡片 JSON 已展開）
set -euo pipefail
cd "$(dirname "$0")/.."
[ -n "${HANDBOOK2_PASSWORD:-}" ] || { echo "HANDBOOK2_PASSWORD 未設定"; exit 2; }
W=$(mktemp -d /tmp/hb2dec.XXXX); chmod 700 "$W"; trap 'rm -rf "$W"' EXIT
node tools/crypt.js decrypt index.html "$W/plain.html" >/dev/null
case "${1:-export}" in
  export) mkdir -p /workspace/handbook2-export; O="/workspace/handbook2-export/百寶袋_明文_$(date +%F).html"; cp "$W/plain.html" "$O"; echo "-> $O";;
  src) python3 tools/src.py expand "$W/plain.html" /workspace/handbook-private/handbook2-src/index.html;;
  *) echo "用法: $0 [export|src]"; exit 2;;
esac
