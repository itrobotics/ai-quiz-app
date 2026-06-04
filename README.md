# AI 工具使用小測驗（AI Quiz App）

> 課堂互動教學工具 — 讓學員在上課中即時回答 AI 工具相關問題，講師可即時查看答題統計

[![Deploy to GitHub Pages](https://github.com/itrobotics/ai-quiz-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/itrobotics/ai-quiz-app/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 目的

在 AI 工具使用課程中，講師希望即時了解學員的學習狀況、動態調整教學節奏。本工具提供零安裝、掃碼即用的課堂測驗體驗：

- **學員**：打開手機掃 QR Code，看到選擇題，點選作答，送出後看到確認訊息
- **講師**：在後台新增題目、一鍵開放、即時看到各選項的答題人數與比例

所有資料儲存於 Google Sheets，後端運行在 Google Apps Script，**完全零伺服器成本**。

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 學員答題頁 | 選擇題介面，防重複作答，每 5 秒自動輪詢新題目 |
| 講師管理頁 | 題目 CRUD（新增、編輯、刪除）、一鍵開放/關閉 |
| 即時統計圖表 | 各選項答題人數 + 百分比長條圖，每 3 秒自動更新 |
| 防重複作答 | sessionId + questionId 唯一鍵，localStorage 本地防護 |
| 零成本後端 | Google Apps Script + Google Sheets，無需自建伺服器 |
| 自動部署 | push to main → GitHub Actions 自動 build + deploy 到 GitHub Pages |

---

## 技術棧

| 層 | 技術 | 版本 |
|----|------|------|
| 前端框架 | React | 18.x |
| 建置工具 | Vite | 5.x |
| 路由 | React Router | 6.x |
| HTTP 客戶端 | Axios | 1.x |
| 後端 | Google Apps Script (GAS) | V8 runtime |
| 資料庫 | Google Sheets | — |
| 後端部署工具 | clasp | 最新版 |
| 前端部署 | GitHub Pages | — |
| CI/CD | GitHub Actions | — |

---

## 快速開始

**本機開發**請參閱 [HOW_TO_TEST.md](./HOW_TO_TEST.md)（含逐步說明）。

### 前置需求

- Node.js 18+
- Google 帳號（用於 Google Sheets + GAS）
- `npm install -g @google/clasp`

### 三步驟啟動

```bash
# 1. 複製環境變數範本
cp .env.example .env
# → 將 GAS Web App URL 填入 VITE_GAS_URL

# 2. 安裝前端相依套件
npm install

# 3. 啟動開發伺服器
npm run dev
```

| 頁面 | 本機網址 | GitHub Pages |
|------|----------|--------------|
| 學員答題頁 | http://localhost:5173 | https://itrobotics.github.io/ai-quiz-app/ |
| 講師後台 | http://localhost:5173/teacher | https://itrobotics.github.io/ai-quiz-app/teacher |

---

## 系統架構（SSD）

完整系統設計文件（15 sections）請見 [docs/spec.md](./docs/spec.md)，涵蓋：

- Functional Requirements（FR-001 ~ FR-010）
- API Specification（GAS doGet / doPost endpoints）
- Data Structure（questions / answers Google Sheets schema）
- Edge Cases（10 個邊界情況）
- Acceptance Criteria（AC-001 ~ AC-010）

### 架構示意

```
瀏覽器（學員/講師）
        │
        │  HTTPS（Axios）
        ▼
Google Apps Script Web App
（Code.gs / questions.gs / answers.gs）
        │
        │  SpreadsheetApp API
        ▼
Google Sheets
├── questions 工作表（題目 CRUD）
└── answers 工作表（答題記錄）
```

---

## 專案結構

```
ai-quiz-app/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions：push to main → 自動部署 gh-pages
├── docs/
│   └── spec.md               # 完整 SSD 規格書（15 sections，繁體中文）
├── gas/                      # GAS 後端（clasp 管理）
│   ├── Code.gs               # doGet / doPost 路由入口 + 共用工具函式
│   ├── questions.gs          # 題目 CRUD（新增/更新/刪除/查詢）
│   ├── answers.gs            # 答題記錄寫入 + 統計查詢
│   ├── appsscript.json       # GAS manifest（timezone / webapp 設定）
│   └── .clasp.json           # clasp 設定（scriptId 待填）
├── src/
│   ├── App.jsx               # React Router 路由（/ 學員頁、/teacher 講師頁）
│   ├── main.jsx              # React 應用進入點
│   ├── api.js                # 封裝所有 GAS API 呼叫 + sessionId 工具
│   ├── pages/
│   │   ├── StudentPage.jsx   # 學員作答頁（含輪詢、防重複、錯誤處理）
│   │   └── TeacherPage.jsx   # 講師後台（題目管理 + 即時統計）
│   └── components/
│       ├── QuestionCard.jsx  # 題目卡片元件（選項按鈕、送出）
│       └── StatChart.jsx     # 答題統計長條圖（A/B/C/D 各色）
├── index.html
├── package.json
├── vite.config.js            # base: '/ai-quiz-app/' for GitHub Pages
├── .env.example              # 環境變數範本（VITE_GAS_URL）
├── .claspignore              # clasp push 排除清單
├── .gitignore
├── CLAUDE.md                 # AI 工作記憶文件（供 Claude 讀取）
├── HOW_TO_TEST.md            # 完整測試指南（Step 1–8 + FAQ Q1–Q10）
└── README.md                 # 本文件
```

---

## GitHub Pages 部署

### 自動部署流程

```
git push origin main
        │
        ▼
GitHub Actions（.github/workflows/deploy.yml）
  1. actions/checkout@v4
  2. actions/setup-node@v4（Node 18）
  3. npm ci
  4. npm run build（注入 VITE_GAS_URL Secret）
  5. peaceiris/actions-gh-pages@v3 → 推送 dist/ 到 gh-pages branch
        │
        ▼
https://itrobotics.github.io/ai-quiz-app/
```

### 設定 GitHub Secret

在 repo Settings → Secrets and variables → Actions 中新增：

| Secret 名稱 | 值 |
|------------|-----|
| `VITE_GAS_URL` | GAS Web App 部署 URL |

---

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `VITE_GAS_URL` | GAS Web App 部署 URL（**必填**） | — |
| `VITE_POLL_INTERVAL_STUDENT` | 學員頁輪詢間隔（ms） | `5000` |
| `VITE_POLL_INTERVAL_TEACHER` | 講師統計輪詢間隔（ms） | `3000` |

---

## 開發指令

```bash
npm run dev      # 啟動開發伺服器（http://localhost:5173）
npm run build    # 打包到 dist/
npm run preview  # 預覽打包結果

# GAS 後端
cd gas
clasp login      # 首次登入
clasp push       # 推送程式碼到 GAS
```

---

## 文件索引

| 文件 | 說明 |
|------|------|
| [HOW_TO_TEST.md](./HOW_TO_TEST.md) | 完整測試指南：Step 1–8，含本機測試 + GitHub Pages 部署 |
| [docs/spec.md](./docs/spec.md) | 系統規格書：15 sections，含 FR、API、Data Schema、Edge Cases |
| [CLAUDE.md](./CLAUDE.md) | AI 開發上下文文件（供 Claude 讀取） |

---

## License

MIT © 2026 itrobotics

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
