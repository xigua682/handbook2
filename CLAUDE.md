# 編輯規則（bot 和 Claude 都要遵守）

1. **明文絕不進這個 repo**（公開）。只 commit 加密後的 `index.html` 和 tools、說明檔。
2. **改原始檔，不改 index.html**：原始檔是 `handbook-private/handbook2-src/index.html`。
   - 卡片內容在 `/*@@PROCS_JSON_BEGIN@@ ... */` 和 `/*@@PROCS_JSON_END@@*/` 之間的 JSON 陣列，一張卡片就是一個物件。
   - 欄位：`id`、`section`（例如 tw、fut、wm、ot、s-tw…，對應 SECS）、`topic`、`title`、`summary`、`groups:[{k, items:[...]}]`、`checked`（最後確認日 YYYY-MM-DD），以及選填的 `calc` 和 `script`。
   - JSON 必須合法，最後一項後面不能有逗號。build 時會自動壓縮。
   - 原始檔可以直接用瀏覽器打開預覽，不用加密。
3. **Claude 同步**：給 Claude 的單檔用原始檔（可讀版），Claude 改完的檔案放回原始檔路徑，再跑 `tools/build.sh`。
   - 如果 Claude 給的是壓縮版的部署明文，就先 `python3 tools/src.py expand <檔案> <原始檔>`。
   - 改之前先 `git pull` 並 `tools/decrypt.sh src`，確保拿的是最新版，避免覆蓋別人的修改。
4. **一律用 `tools/build.sh`**，全部 PASS 才算完成。不要手動跑 staticrypt，也不要換 salt。
5. **T+5 錄音範例（循環）公式不能改壞**：
   - 淨付 = 買進 − 賣出
   - 手續費 = round(代墊款 × 萬分之費率，預設 1.75)
   - 差額 = 淨付 + 代墊款 + 手續費
   - 淨付為負數時，文字顯示「原賣超淨收金額為 |X| 元」
   - verify.js 會檢查這些。
6. **權限與內容限制**：
   - push 前要先跟 Jerry 確認。
   - 不刪檔、不 force push、不改 repo 設定。
   - 密碼只從環境變數 `HANDBOOK2_PASSWORD` 讀，不准印出或寫進任何檔案。
   - 付費內容（定錨、曼報）不准放進來。
