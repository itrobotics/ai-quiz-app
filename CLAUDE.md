# AI 工具使用小測驗 — CLAUDE.md

## 專案概述
課堂即時互動測驗系統。學員用手機/電腦作答選擇題，講師即時看統計。

## 技術棧
- **前端**：React 18 + Vite 5 + React Router 6 + Axios
- **後端**：Google Apps Script (GAS) — Serverless，零維護
- **資料庫**：Google Sheets（questions 工作表、answers 工作表）
- **部署工具**：clasp（GAS CLI）

## 資料夾結構
```
ai-quiz-app/
├── docs/spec.md          # 完整系統規格書（15 sections）
├── gas/                  # GAS 後端（clasp 管理）
│   ├── Code.gs           # doGet/doPost 路由入口
│   ├── questions.gs      # 題目 CRUD
│   ├── answers.gs        # 答題記錄
│   ├── appsscript.json   # GAS manifest
│   └── .clasp.json       # clasp 設定（scriptId 待填）
├── src/
│   ├── App.jsx           # React Router 路由
│   ├── main.jsx          # React 進入點
│   ├── api.js            # GAS API 封裝
│   ├── pages/
│   │   ├── StudentPage.jsx   # 前台：學員作答頁
│   │   └── TeacherPage.jsx   # 後台：講師管理頁
│   └── components/
│       ├── QuestionCard.jsx  # 題目卡片元件
│       └── StatChart.jsx     # 統計長條圖元件
├── index.html
├── package.json
├── vite.config.js
├── .env.example          # 環境變數範本
├── .claspignore
├── README.md
└── HOW_TO_TEST.md
```

## 關鍵設定
- `VITE_GAS_URL`：GAS Web App 部署 URL（需先部署 GAS 才能取得）
- Google Sheets ID：填入 `gas/Code.gs` 的 `SPREADSHEET_ID` 常數

## API 快速參考
| Action | Method | 用途 |
|--------|--------|------|
| getActiveQuestion | GET | 取得開放中題目 |
| getAllQuestions | GET | 取得所有題目（講師用） |
| getStats | GET | 取得指定題目統計 |
| createQuestion | POST | 新增題目 |
| updateQuestion | POST | 更新題目（含狀態） |
| deleteQuestion | POST | 刪除題目 |
| submitAnswer | POST | 學員送出答案 |

## 開發注意事項
1. GAS 不支援 CORS，前端需透過 `no-cors` 模式或改用 JSONP；本專案以 GAS 回傳 CORS header 解決
2. GAS 每次部署會產生新 URL，更新後需同步更新 `.env`
3. sessionId 存放於 localStorage；無痕模式改用 sessionStorage
4. 輪詢間隔：學員頁 5 秒，講師統計 3 秒
5. GAS 並發限制：免費版 30 並發，課堂超過 30 人需考慮升級

## 常見問題
- **CORS 錯誤**：確認 GAS doGet/doPost 已加 `ContentService.createTextOutput` + `setMimeType(JSON)` + Access-Control-Allow-Origin header
- **clasp push 失敗**：確認已執行 `clasp login` 且 `.clasp.json` 內 scriptId 正確
- **統計不更新**：確認 GAS Web App 部署設定為「所有人可存取（包含匿名）」
