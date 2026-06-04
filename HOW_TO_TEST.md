# HOW_TO_TEST.md — 完整測試指南

## 前置需求

| 需求 | 版本 | 安裝方式 |
|------|------|----------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | 隨 Node.js 安裝 |
| clasp | 最新版 | `npm install -g @google/clasp` |
| Google 帳號 | — | 需能存取 Google Drive / Sheets |
| 瀏覽器 | Chrome 90+ | — |

---

## Step 1：建立 Google Sheet

1. 開啟 [Google Sheets](https://sheets.google.com)，建立新試算表，命名為「AI Quiz App」
2. 在工作表底部，將預設工作表重新命名為 **`questions`**
3. 點選工作表標籤旁的 **+**，新增第二個工作表，命名為 **`answers`**
4. **設定 `questions` 工作表的標題列（第 1 列）**，依序填入：
   ```
   id | text | optionA | optionB | optionC | optionD | correctAnswer | status | createdAt | updatedAt
   ```
5. **設定 `answers` 工作表的標題列（第 1 列）**，依序填入：
   ```
   id | questionId | sessionId | answer | timestamp
   ```
6. 從瀏覽器網址列複製 **Spreadsheet ID**（即 `/d/` 和 `/edit` 之間的那串字元）
   - 範例網址：`https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`**`/edit`
   - 複製的 ID：`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

---

## Step 2：clasp 登入 + 建立 GAS 專案 + clasp push

### 2-1. 登入 clasp
```bash
clasp login
```
瀏覽器會開啟 Google OAuth 授權頁面，使用你的 Google 帳號登入並授權。

### 2-2. 進入 gas 目錄，建立 GAS 專案
```bash
cd gas
clasp create --type webapp --title "AI Quiz App"
```
成功後會顯示 `Created new webapp script: https://script.google.com/...`，並在 `gas/` 目錄下產生或更新 `.clasp.json`，其中包含 `scriptId`。

### 2-3. 填入 Spreadsheet ID
開啟 `gas/Code.gs`，找到以下這行，將 `YOUR_SPREADSHEET_ID_HERE` 替換為 Step 1 複製的 ID：
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

### 2-4. 推送程式碼到 GAS
```bash
clasp push
```
輸出應顯示 `Pushed X files.`

### 2-5. 部署為 Web App
1. 在瀏覽器開啟 [script.google.com](https://script.google.com)
2. 找到「AI Quiz App」專案並開啟
3. 點選右上角「部署」→「新增部署作業」
4. 部署類型選「網頁應用程式」
5. 設定：
   - **說明**：v1
   - **執行身份**：我
   - **有存取權的使用者**：所有人
6. 點擊「部署」，**複製 Web 應用程式 URL**（格式：`https://script.google.com/macros/s/xxx/exec`）

> ⚠️ **重要**：每次執行 `clasp push` 後，若要讓更新生效，必須到 GAS 控制台重新「管理部署作業」→ 編輯現有部署，將版本改為「新版本」。

---

## Step 3：部署 GAS 為 Web App，複製 URL 填入 .env

回到專案根目錄（`ai-quiz-app/`）：

```bash
cd ..                          # 回到 ai-quiz-app 根目錄
cp .env.example .env           # 複製環境變數範本
```

開啟 `.env`，填入 Step 2-5 複製的 Web App URL：
```
VITE_GAS_URL=https://script.google.com/macros/s/你的SCRIPT_ID/exec
```

---

## Step 4：npm install + npm run dev

```bash
npm install
```
安裝完成後應顯示 `added xxx packages`，無 error。

```bash
npm run dev
```
應顯示：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## Step 5：開啟 http://localhost:5173 測試學員頁

1. 開啟瀏覽器，前往 `http://localhost:5173`
2. **預期畫面**：顯示「目前沒有開放的題目，請等待講師操作」
3. **此時學員頁尚無題目**，需先到講師頁新增並開放題目

---

## Step 6：開啟 http://localhost:5173/#/teacher 測試講師頁

> 本專案使用 HashRouter，講師頁網址含 `#`：`http://localhost:5173/#/teacher`。
> 也可直接點左上角導覽列的「講師後台」連結切換。

### 6-1. 新增測試題目
1. 前往 `http://localhost:5173/#/teacher`
2. 在「新增題目」區填入：
   - **題目**：ChatGPT 使用的主要 AI 架構是？
   - **選項 A**：CNN
   - **選項 B**：Transformer
   - **選項 C**：RNN
   - **選項 D**：GAN
   - **正確答案**：B
3. 點擊「新增題目」
4. **預期**：題目出現在清單，狀態為「草稿」

### 6-2. 開放題目
1. 在題目清單找到剛新增的題目
2. 點擊「開放此題」
3. **預期**：狀態變為「開放中」（綠色標籤）

### 6-3. 回到學員頁確認題目顯示
1. 開啟新分頁，前往 `http://localhost:5173`
2. **預期**：5 秒內自動顯示題目與四個選項（學員頁網址為 `http://localhost:5173`，無需 `#`）

---

## Step 7：驗證答題資料有寫入 Google Sheet

1. 在學員頁選擇一個選項（例如選 B）
2. 點擊「送出答案」
3. **預期**：顯示「已送出，感謝作答！」
4. 開啟 Google Sheets，切換到 **answers** 工作表
5. **預期**：新增一列記錄，包含 id、questionId、sessionId、answer（B）、timestamp
6. 回到講師頁，**預期**：統計圖表的「B」項目顯示 1 票

---

## 常見問題 FAQ

### Q1：出現 CORS 錯誤（Access-Control-Allow-Origin）
**原因**：GAS 部署存取權限不對，或前端 POST 觸發了 preflight。

> 📌 重點：GAS 的 `ContentService.TextOutput` **無法**手動設定 CORS header（沒有 `setHeader` 方法）。
> 正確做法不是加 header，而是：(1) 部署為「所有人（含匿名）」，(2) POST 用 `Content-Type: text/plain` 規避 preflight。本專案的 `src/api.js` 與 `gas/Code.gs` 已照此實作。

**解決方式**：
1. 確認 GAS 部署設定「有存取權的使用者」為「所有人（包含匿名）」
2. 確認前端 POST 的 `Content-Type` 為 `text/plain`（見 `src/api.js` 的 `gasPost`）
3. 修改 GAS 後務必重新部署「新版本」（見 Q7）

---

### Q2：clasp push 授權失敗 / ENOENT 錯誤
**原因**：未登入 clasp，或 `.clasp.json` 不存在。

**解決方式**：
```bash
clasp login          # 重新登入
clasp list           # 確認可列出現有 scripts
```
若 `.clasp.json` 不存在，確認你在 `gas/` 目錄下執行 `clasp create`。

---

### Q3：Sheet ID 設定錯誤 / 找不到工作表
**原因**：`gas/Code.gs` 的 `SPREADSHEET_ID` 填錯，或工作表名稱不是 `questions` / `answers`。

**解決方式**：
1. 確認 `SPREADSHEET_ID` 是正確的試算表 ID（從網址複製）
2. 確認工作表名稱完全符合（區分大小寫）：`questions`、`answers`
3. 確認 GAS 使用的 Google 帳號對該 Spreadsheet 有編輯權限

---

### Q4：API 呼叫後無回應 / 一直 loading
**原因**：GAS URL 設定錯誤，或 GAS 冷啟動中。

**解決方式**：
1. 確認 `.env` 的 `VITE_GAS_URL` 正確（重新啟動 `npm run dev` 讓新環境變數生效）
2. 直接在瀏覽器網址列貼上 `VITE_GAS_URL?action=getActiveQuestion`，應看到 JSON 回應
3. 等待 5-10 秒後重試（GAS 冷啟動）

---

### Q5：學員頁題目不自動更新
**原因**：瀏覽器標籤頁切換到背景時輪詢暫停（設計行為）。

**解決方式**：確認瀏覽器分頁為前景（active），等待最多 5 秒即可看到更新。

---

### Q6：npm install 報錯
**原因**：Node.js 版本過低，或網路問題。

**解決方式**：
```bash
node -v              # 確認 >= 18
npm cache clean --force
npm install
```

---

### Q7：部署後更新程式碼無效
**原因**：GAS 部署後，clasp push 不會自動更新已部署的版本。

**解決方式**：
1. `clasp push` 推送新程式碼
2. 到 GAS 控制台 → 部署 → 管理部署作業
3. 編輯現有部署，版本改為「新版本」→ 儲存

---

## Step 8：部署到 GitHub Pages（正式環境）

完成本機測試後，可透過 GitHub Actions 自動部署到 GitHub Pages，讓學員用公開網址存取，不需要啟動 `npm run dev`。

### 8-1. 建立 GitHub Repository

1. 前往 [github.com](https://github.com) 並登入
2. 點選右上角 **+** → **New repository**
3. Repository name 填入：`ai-quiz-app`（**必須與此名稱完全一致**，否則需修改 vite.config.js 的 base）
4. 設定為 Public（GitHub Pages 免費方案需要 Public）
5. **不要**勾選 Initialize repository（因為本地已有程式碼）
6. 點擊「Create repository」，複製顯示的 repo URL（格式：`https://github.com/{username}/ai-quiz-app.git`）

---

### 8-2. 設定 GitHub Secret（注入 GAS URL）

GitHub Actions build 時需要 `VITE_GAS_URL`，透過 Secret 安全傳入，不會暴露在程式碼中。

1. 開啟你的 GitHub repo 頁面
2. 點選上方 **Settings** → 左側 **Secrets and variables** → **Actions**
3. 點擊「**New repository secret**」
4. Name：`VITE_GAS_URL`
5. Secret：貼上你在 Step 2-5 取得的 GAS Web App URL
6. 點擊「Add secret」

---

### 8-3. git init + 首次推送

在你的本機終端機中，進入專案資料夾：

```bash
cd D:\內部教育訓練\AI自動化教學\ai-quiz-app

# 初始化 git（若已是 git repo 可跳過）
git init

# 設定主分支名稱為 main
git branch -M main

# 加入所有檔案
git add .

# 首次提交
git commit -m "feat: initial commit — AI quiz app"

# 加入遠端 repo（替換為你的 GitHub username）
git remote add origin https://github.com/{your-github-username}/ai-quiz-app.git

# 推送到 main branch（會自動觸發 GitHub Actions）
git push -u origin main
```

> 💡 推送後，GitHub Actions 會自動執行 `.github/workflows/deploy.yml`，約需 1-2 分鐘完成部署。

---

### 8-4. 在 GitHub repo Settings 啟用 GitHub Pages

1. 開啟 GitHub repo 頁面 → **Settings** → 左側 **Pages**
2. **Source** 選擇：`Deploy from a branch`
3. **Branch** 選擇：`gh-pages` / `/ (root)`
4. 點擊「Save」

> ⚠️ `gh-pages` branch 會在 Actions 第一次跑完後才出現，請先確認 Actions 執行成功再回來設定。

---

### 8-5. 確認 Actions 執行狀態

1. 開啟 GitHub repo 頁面 → 上方 **Actions** 標籤
2. 應看到一筆 workflow run「Deploy to GitHub Pages」
3. 等待圖示變為綠色勾勾（✅），代表部署成功
4. 若出現紅色叉叉（❌），點進去查看 log 找錯誤原因（常見原因：Secret 未設定、build 失敗）

---

### 8-6. 存取正式環境網址

部署成功後，存取以下網址：

| 頁面 | 網址 |
|------|------|
| 學員頁（前台） | `https://{username}.github.io/ai-quiz-app/` |
| 講師後台 | `https://{username}.github.io/ai-quiz-app/teacher` |

將 `{username}` 替換為你的 GitHub 帳號名稱。

> 💡 **給學員的 QR Code**：建議用 [qr-code-generator.com](https://www.qr-code-generator.com/) 或類似工具，將學員頁網址轉成 QR Code，投影在螢幕上讓學員掃碼。

---

### 8-7. 後續更新部署流程

之後每次修改程式碼，只需推送到 main branch，GitHub Actions 會自動重新部署：

```bash
git add .
git commit -m "fix: 修正某某問題"
git push
```

---

## 常見問題 FAQ（GitHub Pages 相關）

### Q8：推送後 Actions 沒有自動觸發
**原因**：`.github/workflows/deploy.yml` 未被包含在推送的檔案中，或 workflow 語法有誤。

**解決方式**：
```bash
git status          # 確認 .github/ 資料夾有被追蹤
git add .github/
git commit -m "ci: add deploy workflow"
git push
```

---

### Q9：GitHub Pages 顯示 404 或白畫面
**原因**：`vite.config.js` 的 `base` 設定與 repo 名稱不符，或 `gh-pages` branch 尚未產生。

**解決方式**：
1. 確認 repo 名稱為 `ai-quiz-app`（與 `base: '/ai-quiz-app/'` 一致）
2. 確認 Actions 已執行成功且 `gh-pages` branch 存在
3. 清除瀏覽器快取後重試

---

### Q10：Actions 執行時報錯「VITE_GAS_URL is not defined」
**原因**：GitHub Secret 未正確設定，或 Secret 名稱拼錯。

**解決方式**：
1. 到 repo Settings → Secrets and variables → Actions
2. 確認 Secret 名稱為 `VITE_GAS_URL`（區分大小寫）
3. 若未設定，依 8-2 步驟新增
4. Secret 更新後需重新觸發 Actions：到 Actions 頁面點「Re-run jobs」

---

### Q6：npm install 報錯
**原因**：Node.js 版本過低，或網路問題。

**解決方式**：
```bash
node -v              # 確認 >= 18
npm cache clean --force
npm install
```

---

### Q7：部署後更新程式碼無效
**原因**：GAS 部署後，clasp push 不會自動更新已部署的版本。

**解決方式**：
1. `clasp push` 推送新程式碼
2. 到 GAS 控制台 → 部署 → 管理部署作業
3. 編輯現有部署，版本改為「新版本」→ 儲存

---

## Step 8：部署到 GitHub Pages（正式環境）

完成本機測試後，可透過 GitHub Actions 自動部署到 GitHub Pages，讓學員用公開網址存取，不需要啟動 `npm run dev`。

### 8-1. 建立 GitHub Repository

1. 前往 [github.com](https://github.com) 並登入
2. 點選右上角 **+** → **New repository**
3. Repository name 填入：`ai-quiz-app`（**必須與此名稱完全一致**，否則需修改 vite.config.js 的 base）
4. 設定為 Public（GitHub Pages 免費方案需要 Public）
5. **不要**勾選 Initialize repository（因為本地已有程式碼）
6. 點擊「Create repository」，複製顯示的 repo URL（格式：`https://github.com/{username}/ai-quiz-app.git`）

---

### 8-2. 設定 GitHub Secret（注入 GAS URL）

GitHub Actions build 時需要 `VITE_GAS_URL`，透過 Secret 安全傳入，不會暴露在程式碼中。

1. 開啟你的 GitHub repo 頁面
2. 點選上方 **Settings** → 左側 **Secrets and variables** → **Actions**
3. 點擊「**New repository secret**」
4. Name：`VITE_GAS_URL`
5. Secret：貼上你在 Step 2-5 取得的 GAS Web App URL
6. 點擊「Add secret」

---

### 8-3. git init + 首次推送

在你的本機終端機中，進入專案資料夾：

```bash
cd D:\內部教育訓練\AI自動化教學\ai-quiz-app

# 初始化 git（若已是 git repo 可跳過）
git init

# 設定主分支名稱為 main
git branch -M main

# 加入所有檔案
git add .

# 首次提交
git commit -m "feat: initial commit — AI quiz app"

# 加入遠端 repo（替換為你的 GitHub username）
git remote add origin https://github.com/{your-github-username}/ai-quiz-app.git

# 推送到 main branch（會自動觸發 GitHub Actions）
git push -u origin main
```

> 💡 推送後，GitHub Actions 會自動執行 `.github/workflows/deploy.yml`，約需 1-2 分鐘完成部署。

---

### 8-4. 在 GitHub repo Settings 啟用 GitHub Pages

1. 開啟 GitHub repo 頁面 → **Settings** → 左側 **Pages**
2. **Source** 選擇：`Deploy from a branch`
3. **Branch** 選擇：`gh-pages` / `/ (root)`
4. 點擊「Save」

> ⚠️ `gh-pages` branch 會在 Actions 第一次跑完後才出現，請先確認 Actions 執行成功再回來設定。

---

### 8-5. 確認 Actions 執行狀態

1. 開啟 GitHub repo 頁面 → 上方 **Actions** 標籤
2. 應看到一筆 workflow run「Deploy to GitHub Pages」
3. 等待圖示變為綠色勾勾（✅），代表部署成功
4. 若出現紅色叉叉（❌），點進去查看 log 找錯誤原因（常見原因：Secret 未設定、build 失敗）

---

### 8-6. 存取正式環境網址

部署成功後，存取以下網址：

| 頁面 | 網址 |
|------|------|
| 學員頁（前台） | `https://{username}.github.io/ai-quiz-app/` |
| 講師後台 | `https://{username}.github.io/ai-quiz-app/teacher` |

將 `{username}` 替換為你的 GitHub 帳號名稱。

> 💡 **給學員的 QR Code**：建議用 [qr-code-generator.com](https://www.qr-code-generator.com/) 或類似工具，將學員頁網址轉成 QR Code，投影在螢幕上讓學員掃碼。

---

### 8-7. 後續更新部署流程

之後每次修改程式碼，只需推送到 main branch，GitHub Actions 會自動重新部署：

```bash
git add .
git commit -m "fix: 修正某某問題"
git push
```

---

## 常見問題 FAQ（GitHub Pages 相關）

### Q8：推送後 Actions 沒有自動觸發
**原因**：`.github/workflows/deploy.yml` 未被包含在推送的檔案中，或 workflow 語法有誤。

**解決方式**：
```bash
git status          # 確認 .github/ 資料夾有被追蹤
git add .github/
git commit -m "ci: add deploy workflow"
git push
```

---

### Q9：GitHub Pages 顯示 404 或白畫面
**原因**：`vite.config.js` 的 `base` 設定與 repo 名稱不符，或 `gh-pages` branch 尚未產生。

**解決方式**：
1. 確認 repo 名稱為 `ai-quiz-app`（與 `base: '/ai-quiz-app/'` 一致）
2. 確認 Actions 已執行成功且 `gh-pages` branch 存在
3. 清除瀏覽器快取後重試

---

### Q10：Actions 執行時報錯「VITE_GAS_URL is not defined」
**原因**：GitHub Secret 未正確設定，或 Secret 名稱拼錯。

**解決方式**：
1. 到 repo Settings → Secrets and variables → Actions
2. 確認 Secret 名稱為 `VITE_GAS_URL`（區分大小寫）
3. 若未設定，依 8-2 步驟新增
4. Secret 更新後需重新觸發 Actions：到 Actions 頁面點「Re-run jobs」
