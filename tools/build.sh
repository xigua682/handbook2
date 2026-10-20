#!/usr/bin/env bash
# 一鍵：組合明文 -> 加密 -> 無頭瀏覽器驗證 -> 明文外洩檢查 -> 寫入 index.html（不 commit、不 push）
# 用法: tools/build.sh [原始檔路徑]   預設 /workspace/handbook-private/handbook2-src/index.html
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-/workspace/handbook-private/handbook2-src/index.html}"
[ -n "${HANDBOOK2_PASSWORD:-}" ] || { echo "HANDBOOK2_PASSWORD 未設定"; exit 2; }
[ -f "$SRC" ] || { echo "找不到原始檔 $SRC"; exit 2; }
W=$(mktemp -d /tmp/hb2build.XXXX); chmod 700 "$W"; trap 'rm -rf "$W"' EXIT
SHOTS="${SHOTS:-/workspace/hb2push_shots/build_$(date +%Y%m%d_%H%M%S)}"
git show HEAD:index.html > "$W/ref.html"                         # 目前線上版（已加密）
node tools/crypt.js decrypt "$W/ref.html" "$W/ref_plain.html" >/dev/null
python3 tools/src.py assemble "$SRC" "$W/plain.html" "$W/ref_plain.html"
node tools/crypt.js encrypt "$W/plain.html" "$W/ref.html" "$W/out.html"
node tools/crypt.js decrypt "$W/out.html" "$W/check.html" >/dev/null
cmp -s "$W/plain.html" "$W/check.html" && echo "PASS 解密後與明文逐位元相同" || { echo "FAIL 解密不一致"; exit 1; }
# 明文外洩檢查：加密檔裡不能出現明文特徵
for k in 'const PROCS' 'const SECS' 'PROCS_JSON_BEGIN' '錄音範例' '手續費'; do
  if grep -qF "$k" "$W/out.html"; then echo "FAIL 加密檔含明文特徵：$k"; exit 1; fi
done; echo "PASS 加密檔不含明文特徵"
if ! cmp -s "$W/plain.html" "$W/ref_plain.html"; then export ALLOW_VISUAL_DIFF=1; fi
node tools/verify.js "$W/out.html" "$W/ref.html" "$SHOTS"
if cmp -s "$W/plain.html" "$W/ref_plain.html"; then echo "內容與線上版相同，index.html 不變更"; exit 0; fi
cp "$W/out.html" index.html
# repo 內不得有明文檔
bad=$(git ls-files -co --exclude-standard | grep -viE '^(index\.html|tools/.*|\.staticrypt\.json|\.gitignore|README\.md|CLAUDE\.md)$' || true)
[ -z "$bad" ] || { echo "FAIL repo 有未預期的檔案：$bad"; exit 1; }
echo "完成：index.html 已更新（尚未 commit / push）。截圖：$SHOTS"; git status --short
