# handbook2（百寶袋）

線上網站：https://xigua682.github.io/handbook2/ ，用 StatiCrypt 加密，需要密碼。

**這個 repo 是公開的，只能放加密後的 `index.html`。** 明文原始檔放在 private repo `handbook` 的 `handbook2-src/index.html`。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` | 網站本體（加密後），由 build 產生，不要手改 |
| `.staticrypt.json` | 加密參數（salt、remember-me）。salt 不是祕密，但不能改，改了大家要重新輸入密碼 |
| `tools/build.sh` | 一鍵：組合、加密、驗證、外洩檢查，然後寫入 index.html |
| `tools/decrypt.sh` | 把線上版解密：`export`（給 Claude 的單檔）或 `src`（可讀原始檔） |
| `tools/crypt.js` | StatiCrypt v3 相容的加解密 |
| `tools/src.py` | 原始檔和部署明文互轉（卡片 JSON 展開／壓縮） |
| `tools/verify.js` | 無頭 Chrome 驗證：解鎖、截圖比對、T+5 計算（正數和負數） |

## 流程
```bash
export HANDBOOK2_PASSWORD=...        # 從 secret 讀，不要寫進檔案
# 1. 改 /workspace/handbook-private/handbook2-src/index.html
tools/build.sh                       # 2. 建置並驗證，全部 PASS 才會寫入 index.html
git add index.html && git commit     # 3. 跟 Jerry 確認後才 push
```
第一次使用前要先裝驗證工具：`cd /workspace/.hbtools && npm i puppeteer-core pngjs pixelmatch@5`
