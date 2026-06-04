# AI 工具使用小測驗 — 系統規格書 (SSD)

**版本**：v1.0.0  
**日期**：2026-06-04  
**作者**：AI 自動化教學團隊  

---

## 1. Project Goal

本專案目標是建立一套輕量、即時的課堂互動測驗系統，供 AI 工具使用課程的學員進行課中小測驗，並讓講師即時查看各題答題率統計。

**核心目標：**
- 降低課堂互動門檻，學員只需掃 QR Code 即可作答
- 講師可即時掌握學員理解程度，適時調整教學節奏
- 所有資料儲存於 Google Sheets，無需額外資料庫成本
- 零後端維護成本：使用 Google Apps Script (GAS) 作為 Serverless 後端

---

## 2. User Scenario

### 學員流程
1. 講師在課堂上顯示 QR Code 或分享測驗連結
2. 學員用手機或電腦開啟連結（前台頁面 `/`）
3. 學員看到目前開放的題目（選擇題，單選）
4. 學員選擇答案後點擊「送出答案」
5. 系統顯示「已送出，感謝作答！」確認訊息
6. 若題目尚未開放，顯示「目前沒有開放的題目，請等待講師操作」

### 講師流程
1. 講師開啟後台頁面（`/teacher`）
2. 在「題目管理」區新增題目（題目文字 + 四個選項 + 正確答案）
3. 點擊「開放此題」讓學員可以作答
4. 在「統計」區查看各選項答題人數與比例（即時更新）
5. 點擊「關閉題目」結束本題作答
6. 可重複上述流程進行多題測驗

---

## 3. Functional Requirements

### FR-001：顯示測驗題目
- **Input**：學員開啟前台頁面
- **Output**：顯示目前狀態為「開放中」的題目與四個選項
- **Rule**：同一時間只能有一題處於開放狀態；若無開放題目則顯示等待訊息
- **Error Handling**：GAS API 呼叫失敗時顯示「載入失敗，請重新整理頁面」

### FR-002：學員送出答案
- **Input**：學員選擇選項後點擊送出
- **Output**：答案寫入 Google Sheets answers 工作表；顯示送出確認訊息
- **Rule**：同一 sessionId 對同一 questionId 只能作答一次（防重複）
- **Error Handling**：送出失敗顯示「送出失敗，請再試一次」並保留選取狀態

### FR-003：自動輪詢題目狀態
- **Input**：學員前台頁面開啟中
- **Output**：每 5 秒自動呼叫 API 確認題目狀態，若有新題目自動顯示
- **Rule**：輪詢間隔 5 秒；頁面不可見時（background tab）暫停輪詢
- **Error Handling**：連續 3 次失敗後停止輪詢並顯示警告

### FR-004：新增題目
- **Input**：講師填入題目文字、四個選項、正確答案後點擊新增
- **Output**：題目寫入 Google Sheets questions 工作表
- **Rule**：題目文字與四個選項均為必填；正確答案必須是 A/B/C/D 其中之一
- **Error Handling**：欄位驗證失敗時顯示紅色錯誤提示；API 失敗時顯示錯誤訊息

### FR-005：編輯題目
- **Input**：講師點擊題目旁的「編輯」按鈕，修改內容後儲存
- **Output**：Google Sheets 對應列更新；題目清單重新整理
- **Rule**：僅能編輯狀態為「未開放」或「已關閉」的題目；開放中題目不可編輯
- **Error Handling**：嘗試編輯開放中題目時顯示「請先關閉題目再編輯」

### FR-006：開放 / 關閉題目
- **Input**：講師點擊「開放此題」或「關閉題目」
- **Output**：題目狀態更新為 active / closed；同時將其他開放中題目設為 closed
- **Rule**：同一時間只能有一題為 active 狀態
- **Error Handling**：API 失敗時顯示錯誤訊息，狀態不變

### FR-007：查看答題統計
- **Input**：講師查看統計面板
- **Output**：顯示各選項答題人數與百分比；以長條圖呈現
- **Rule**：統計資料每 3 秒自動更新；顯示總作答人數
- **Error Handling**：無資料時顯示「尚無學員作答」

### FR-008：刪除題目
- **Input**：講師點擊「刪除」並確認
- **Output**：Google Sheets 對應列刪除（或標記為 deleted）
- **Rule**：開放中題目不可刪除；刪除需二次確認對話框
- **Error Handling**：API 失敗時顯示錯誤訊息

### FR-009：匯出答題記錄
- **Input**：講師點擊「匯出 CSV」
- **Output**：下載包含所有答題記錄的 CSV 檔案
- **Rule**：CSV 含欄位：questionId, sessionId, answer, timestamp
- **Error Handling**：無資料時提示「目前沒有答題記錄」

### FR-010：防重複作答
- **Input**：已作答的學員嘗試再次送出
- **Output**：顯示「您已作答過此題」，不寫入新記錄
- **Rule**：以 localStorage 的 sessionId + questionId 組合判斷
- **Error Handling**：若 localStorage 不可用，以 IP + User-Agent 作為備用識別

---

## 4. Non-Functional Requirements

| 項目 | 規格 |
|------|------|
| 回應時間 | API 呼叫 < 2 秒（一般網路環境） |
| 並發支援 | GAS 免費版支援最多 30 並發；付費版無上限 |
| 瀏覽器相容 | Chrome 90+、Safari 14+、Firefox 88+、Edge 90+ |
| 行動裝置 | 支援 iOS 14+ / Android 10+，響應式設計 |
| 資料保留 | Google Sheets 自動保留；無自動清除機制 |
| 安全性 | 後台無身份驗證（MVP 版本）；建議部署後設定 IP 限制 |
| 可用性 | 依賴 GAS 服務可用性（Google SLA 99.9%） |

---

## 5. Modules / Components

### 前端模組

| 模組 | 路徑 | 職責 |
|------|------|------|
| App | `src/App.jsx` | 路由配置（React Router） |
| StudentPage | `src/pages/StudentPage.jsx` | 學員測驗頁面，含輪詢邏輯 |
| TeacherPage | `src/pages/TeacherPage.jsx` | 講師後台，題目管理 + 統計 |
| QuestionCard | `src/components/QuestionCard.jsx` | 題目顯示與選項點擊元件 |
| StatChart | `src/components/StatChart.jsx` | 答題統計長條圖元件 |
| api.js | `src/api.js` | 封裝所有 GAS API 呼叫 |

### 後端模組（GAS）

| 模組 | 路徑 | 職責 |
|------|------|------|
| Code.gs | `gas/Code.gs` | doGet / doPost 入口，路由分發 |
| questions.gs | `gas/questions.gs` | 題目 CRUD 操作 |
| answers.gs | `gas/answers.gs` | 答題記錄寫入與查詢 |

---

## 6. Data Structure

### Google Sheets：`questions` 工作表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | String | UUID，主鍵 |
| text | String | 題目文字 |
| optionA | String | 選項 A |
| optionB | String | 選項 B |
| optionC | String | 選項 C |
| optionD | String | 選項 D |
| correctAnswer | String | 正確答案（A/B/C/D） |
| status | String | `draft` / `active` / `closed` |
| createdAt | String | ISO 8601 時間戳 |
| updatedAt | String | ISO 8601 時間戳 |

**JSON 範例：**
```json
{
  "id": "q-550e8400-e29b",
  "text": "ChatGPT 使用的主要 AI 架構是？",
  "optionA": "CNN",
  "optionB": "Transformer",
  "optionC": "RNN",
  "optionD": "GAN",
  "correctAnswer": "B",
  "status": "active",
  "createdAt": "2026-06-04T08:00:00.000Z",
  "updatedAt": "2026-06-04T08:05:00.000Z"
}
```

### Google Sheets：`answers` 工作表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | String | UUID，主鍵 |
| questionId | String | 對應 questions.id |
| sessionId | String | 學員 sessionId（localStorage 產生） |
| answer | String | 學員選擇（A/B/C/D） |
| timestamp | String | ISO 8601 時間戳 |

**JSON 範例：**
```json
{
  "id": "a-f47ac10b-58cc",
  "questionId": "q-550e8400-e29b",
  "sessionId": "sess-abc123def456",
  "answer": "B",
  "timestamp": "2026-06-04T08:07:30.000Z"
}
```

---

## 7. API Specification

**Base URL：** `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

所有請求皆透過 GAS Web App endpoint；GAS 不支援 PUT/DELETE，故統一以 GET/POST + action 參數處理。

### GET Endpoints

#### 取得開放中題目
```
GET ?action=getActiveQuestion
```
**Response 200：**
```json
{
  "success": true,
  "question": { /* Question 物件 */ }
}
```
**Response（無開放題目）：**
```json
{ "success": true, "question": null }
```

#### 取得所有題目（講師用）
```
GET ?action=getAllQuestions
```
**Response 200：**
```json
{
  "success": true,
  "questions": [ /* Question 陣列 */ ]
}
```

#### 取得答題統計
```
GET ?action=getStats&questionId={id}
```
**Response 200：**
```json
{
  "success": true,
  "stats": {
    "questionId": "q-xxx",
    "total": 25,
    "A": 3, "B": 18, "C": 2, "D": 2
  }
}
```

### POST Endpoints

所有 POST 請求 Content-Type 為 `application/json`，body 為 JSON。

#### 新增題目
```
POST { "action": "createQuestion", "data": { Question 物件（無 id） } }
```

#### 更新題目
```
POST { "action": "updateQuestion", "data": { "id": "xxx", ...更新欄位 } }
```

#### 刪除題目
```
POST { "action": "deleteQuestion", "data": { "id": "xxx" } }
```

#### 送出答案
```
POST { "action": "submitAnswer", "data": { "questionId": "xxx", "sessionId": "xxx", "answer": "B" } }
```

**統一 Error Response：**
```json
{ "success": false, "error": "錯誤描述訊息" }
```

---

## 8. UI/UX Specification

### 學員頁（前台 `/`）

- **背景色**：淺灰白（#F8FAFC）
- **題目卡片**：白色圓角卡片，陰影效果，最大寬度 600px，置中
- **選項按鈕**：全寬按鈕，hover 變藍色底、白色文字
- **已選狀態**：藍色底（#3B82F6）
- **送出按鈕**：綠色（#10B981），選擇選項後才可點擊
- **等待訊息**：居中顯示，灰色文字，含動畫等待圖示
- **字體大小**：題目 1.25rem，選項 1rem
- **行動裝置**：padding 縮減，按鈕加大點擊區域

### 講師頁（後台 `/teacher`）

- **版面**：左右兩欄（題目管理 | 統計），行動裝置改為上下疊加
- **題目清單**：每題顯示狀態標籤（草稿/開放中/已關閉）
- **新增題目表單**：輸入框清晰標示、必填標記
- **統計圖表**：水平長條圖，顏色：A=藍、B=綠、C=橘、D=紅
- **即時更新指示器**：右上角顯示「最後更新：xx:xx:xx」
- **狀態顏色**：draft=灰、active=綠、closed=藍

---

## 9. Business Rules

1. **單題限制**：同一時間系統中只能有一題狀態為 `active`，開放新題時自動關閉舊題
2. **防重複作答**：以 `sessionId + questionId` 為唯一鍵，重複送出回傳 409 狀態
3. **sessionId 生成**：首次載入時在 localStorage 生成 UUID v4，後續持續使用
4. **題目排序**：題目清單依 `createdAt` 降序排列（最新在上）
5. **統計計算**：統計不含重複記錄（以最後一筆為準，MVP 版本以第一筆為準）
6. **正確答案可見性**：正確答案僅在後台顯示，前台不呈現
7. **空題目保護**：題目選項不可為空字串，後端驗證
8. **GAS 限制應對**：前端輪詢間隔設為 5 秒，避免觸發 GAS 每分鐘執行限制

---

## 10. Edge Cases

1. **學員在作答途中題目被關閉**：送出時後端檢查題目狀態，若已關閉回傳 `{ success: false, error: "此題已關閉" }`，前端顯示提示
2. **多個學員同時送出**：GAS Spreadsheet Lock Service 保護並發寫入，使用 `LockService.getScriptLock()`
3. **Google Sheets 欄位順序錯誤**：Code.gs 以欄位名稱（第一列 header）動態對應欄位，不依賴固定欄位索引
4. **localStorage 不可用（無痕模式）**：偵測後改用 sessionStorage，若兩者均不可用，使用記憶體變數（頁面重整後失效）
5. **GAS 冷啟動延遲**：首次請求可能需要 3-5 秒，前端顯示 loading 動畫並設定 10 秒 timeout
6. **網路中斷後重連**：前端偵測 online 事件，重連後立即重新呼叫一次，再恢復輪詢
7. **題目文字包含特殊字元**：JSON 序列化時自動跳脫，GAS 端使用 `JSON.stringify` 確保正確
8. **學員同時開啟多個分頁**：每個分頁共用同一 sessionId（來自 localStorage），但各自輪詢，不影響資料正確性
9. **GAS 部署 URL 變更**：僅需更新 .env 的 VITE_GAS_URL 並重新 build，不需修改程式碼
10. **題目數量過多（> 100 題）**：後台清單加入搜尋/篩選功能（FR 擴充項），目前 MVP 全量載入（GAS Sheets 上限 500 萬 cells）

---

## 11. Implementation Plan

### Step 1：建立 Google Sheet（10 分鐘）
建立新 Google Spreadsheet，新增兩個工作表：`questions`（含 header 列）、`answers`（含 header 列）。記錄 Spreadsheet ID。

### Step 2：建立 GAS 專案 + 部署（15 分鐘）
1. 安裝 clasp：`npm install -g @google/clasp`
2. 登入：`clasp login`
3. 在 `gas/` 目錄執行：`clasp create --type webapp --title "AI Quiz App"`
4. 將 `SPREADSHEET_ID` 填入 `gas/Code.gs`
5. `clasp push`
6. 在 GAS 控制台部署為 Web App（執行身份：我、存取權：所有人）
7. 複製 Web App URL

### Step 3：設定前端環境變數（5 分鐘）
1. 複製 `.env.example` 為 `.env`
2. 填入 Step 2 取得的 GAS Web App URL

### Step 4：安裝前端相依套件（5 分鐘）
```bash
npm install
```

### Step 5：本地開發測試（持續）
```bash
npm run dev
```
開啟 `http://localhost:5173` 測試學員頁，`http://localhost:5173/teacher` 測試講師頁。

### Step 6：端到端測試（30 分鐘）
依照 `HOW_TO_TEST.md` 逐步驗收所有功能。

### Step 7：前端 Build（5 分鐘）
```bash
npm run build
```
產生 `dist/` 資料夾，可部署至任何靜態託管服務（Netlify、GitHub Pages、Vercel 等）。

### Step 8：正式部署（選用，30 分鐘）
部署前端至 Netlify/Vercel，設定環境變數，更新 GAS CORS 白名單。

---

## 12. Acceptance Criteria

| 編號 | 驗收條件 | 驗證方式 |
|------|----------|----------|
| AC-001 | 學員頁面能顯示開放中的題目 | 後台開放題目後，學員頁 5 秒內自動顯示 |
| AC-002 | 學員送出答案後資料寫入 Google Sheets | 開啟 Google Sheets answers 工作表確認新增一列 |
| AC-003 | 同一學員對同一題不可重複作答 | 送出後再按送出按鈕應被禁用或顯示已作答提示 |
| AC-004 | 講師可新增題目並在清單中看到 | 新增後題目出現在清單，狀態為 draft |
| AC-005 | 講師可開放/關閉題目 | 點擊開放後狀態變 active；關閉後變 closed |
| AC-006 | 同一時間只有一題為 active | 開放新題時，前一道題自動變 closed |
| AC-007 | 統計圖表即時反映答題資料 | 學員作答後，講師統計 3 秒內更新 |
| AC-008 | 頁面在行動裝置上可正常操作 | iPhone / Android 瀏覽器可完成完整作答流程 |
| AC-009 | GAS API 回應時間 < 2 秒 | 使用 Network Tab 確認 API 請求時間 |
| AC-010 | 無開放題目時學員頁顯示等待訊息 | 關閉所有題目後，學員頁顯示等待提示 |

---

## 13. Suggested Test Cases

### 正常流程
- TC-001：新增一道題目 → 開放 → 學員作答 → 確認統計更新
- TC-002：連續開放兩道題目，確認第一題自動關閉
- TC-003：5 位學員同時作答同一題，確認統計總數正確
- TC-004：學員作答後重整頁面，確認不可重複作答

### 邊界條件
- TC-005：題目文字 500 字，確認正常顯示不截斷
- TC-006：所有選項皆被選（需 4 位不同學員），確認統計各有 1 筆
- TC-007：新增題目時不填必填欄位，確認前端驗證阻擋送出

### 例外情況
- TC-008：斷網後重連，確認自動恢復輪詢
- TC-009：GAS URL 設定錯誤，確認錯誤訊息友善顯示
- TC-010：在無痕視窗作答，確認 sessionStorage 備用機制正常

---

## 14. Open Questions

1. **身份驗證**：MVP 版本後台無驗證，正式課程環境是否需要加密碼保護？建議：使用 URL query token（`/teacher?token=xxx`）作為簡易保護
2. **多班級支援**：目前一個 Google Sheet 對應一個班級，是否需要支援多班同時進行測驗？建議：增加 `classId` 欄位，搭配 URL 參數切換
3. **歷史記錄查詢**：講師是否需要查看歷史測驗記錄？目前需直接查看 Google Sheets
4. **匿名 vs 具名**：學員目前完全匿名，是否需要收集姓名或員工編號？
5. **離線支援**：課堂環境網路不穩定時是否需要離線暫存再同步功能？

---

## 15. Suggested Next Prompt

完成基本功能後，建議的後續開發提示：

```
在現有 ai-quiz-app 專案基礎上，為後台講師頁加入以下功能：
1. 簡易密碼保護（URL token 方式）
2. 題目分類標籤（用於多堂課複用題目）
3. 答題結束後顯示正確答案與解析
4. 匯出本次測驗報告（PDF 格式，含統計圖表）
請在 docs/spec.md 中新增相關 FR，並更新對應的元件。
```
