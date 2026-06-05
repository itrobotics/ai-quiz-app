# GAS 與前端 API 如何互動 —— 觀念 + 實測教學

**範例專案**：AI 工具使用小測驗（React 前端 + Google Apps Script 後端 + Google Sheets 資料庫）
**適合對象**：看得懂 JavaScript、想搞懂「前端怎麼跟 GAS 後端對話、又怎麼測它」的人
**閱讀方式**：Part A 先建立觀念，Part B 開始動手實測（本文重心，所有指令可直接複製貼上），Part C 是除錯與常見錯誤

> **本文件使用的真實 GAS URL（本專案實際部署）：**
> ```
> https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec
> ```
> 下面所有指令都已內嵌這個網址，整段複製就能跑。若日後重新部署換了 URL，全文用編輯器「取代全部」換掉即可。

---

# Part A — 觀念篇

## A1. 一句話講清楚架構

```
 學員/講師的瀏覽器                Google 雲端
┌──────────────────┐         ┌─────────────────────────────┐
│  React 前端       │  HTTP   │  GAS Web App (/exec)         │
│  src/api.js  ─────┼────────▶│  doGet() / doPost() 路由      │
│                   │  JSON   │     │                         │
│  ◀────────────────┼─────────┤     ▼                         │
└──────────────────┘         │  questions.gs / answers.gs   │
                             │     │                         │
                             │     ▼                         │
                             │  Google Sheets（questions /   │
                             │  answers 兩個工作表）          │
                             └─────────────────────────────┘
```

重點只有三層：**前端送 HTTP 請求 → GAS 接收並處理 → 讀寫 Google Sheets → 回 JSON 給前端**。沒有傳統意義的「伺服器」，GAS 就是那台 serverless 後端。

## A2. 前端怎麼「呼叫」後端

前端不是直接操作資料庫，而是發 HTTP 請求到同一個網址，靠一個 **`action` 參數**告訴後端「我要做什麼」。本專案把所有呼叫封裝在 `src/api.js`，分兩種：

```js
// 讀資料 → 用 GET，參數放在 query string
async function gasGet(params) {
  const response = await axios.get(GAS_URL, { params, timeout: 10000 })
  if (!response.data.success) throw new Error(response.data.error)
  return response.data
}

// 寫資料 → 用 POST，資料放在 body
async function gasPost(body) {
  const response = await axios.post(GAS_URL, body, {
    headers: { 'Content-Type': 'text/plain' }, // ← 這行很關鍵，A5 會解釋
    timeout: 10000,
  })
  if (!response.data.success) throw new Error(response.data.error)
  return response.data
}
```

所以前端呼叫 `getActiveQuestion()`，實際上就是送出一個 GET 請求，網址帶 `?action=getActiveQuestion`。

## A3. 後端怎麼「接住」請求 —— doGet / doPost 路由

GAS Web App 只有兩個固定入口函式：前端發 **GET** 就進 `doGet(e)`，發 **POST** 就進 `doPost(e)`。本專案在 `gas/Code.gs` 用 `action` 做分流：

```js
function doGet(e) {
  const action = e.parameter.action;          // 從 query string 取 action
  switch (action) {
    case 'getActiveQuestion': return handleGetActiveQuestion();
    case 'getAllQuestions':   return handleGetAllQuestions();
    case 'getStats':          return handleGetStats(e.parameter.questionId);
    case 'getAllAnswers':     return handleGetAllAnswers();
    default: return errorResponse('未知的 action: ' + action);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents); // 從 body 取 JSON
  const action = body.action;
  const data = body.data || {};
  switch (action) {
    case 'createQuestion': return handleCreateQuestion(data);
    case 'updateQuestion': return handleUpdateQuestion(data);
    case 'deleteQuestion': return handleDeleteQuestion(data);
    case 'submitAnswer':   return handleSubmitAnswer(data);
    default: return errorResponse('未知的 action: ' + action);
  }
}
```

分工：**讀（getXXX）走 GET、寫（create/update/delete/submit）走 POST**。GAS 不支援 PUT/DELETE，所以全部用 GET/POST + action 表達。

## A4. 回應長什麼樣 —— JSON 契約

不論成功失敗，後端都回一包 JSON，且固定有 `success` 欄位，這是前端判斷成敗的依據：

```js
{ "success": true,  "question": { ... } }                 // 成功
{ "success": false, "error": "題目不存在", "code": 404 }   // 失敗
```

前端那句 `if (!response.data.success) throw new Error(...)` 就是讀這個契約。**只要回應沒有 `success: true`，前端就當失敗丟錯誤**。

## A5. 為什麼 POST 要用 `Content-Type: text/plain`（CORS 的坑）

瀏覽器的跨來源（CORS）規則：

- **簡單請求**（GET，或 `Content-Type` 為 `text/plain` 的 POST）：瀏覽器直接送。
- **非簡單請求**（例如 `Content-Type: application/json` 的 POST）：瀏覽器會先送 **preflight（OPTIONS）** 詢問，但 **GAS 不回應 OPTIONS**，preflight 直接失敗 → POST 送不出去。

本專案解法：POST 時用 `Content-Type: text/plain` 偽裝成簡單請求繞過 preflight；後端 `JSON.parse(e.postData.contents)` 照樣解析。這就是 `gasPost` 裡那行 header 的用意。

---

# Part B — 互動測試篇（重心，指令可直接複製）

## B0. 先確認部署是活的（瀏覽器點開即可）

直接點開或複製到瀏覽器網址列：

```
https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec?action=getActiveQuestion
```

| 看到什麼 | 代表 |
|----------|------|
| 一包 JSON（`{"success":true,...}`） | 部署正常，doGet 有跑 ✅ |
| 「找不到指令碼函式：doGet」 | 程式沒部署到位（見 C1） |
| 要求登入 Google | 部署存取權不是「任何人」 |

## B1. 方法一：瀏覽器網址列測 GET（最快，複製即用）

GET 參數全在網址上，**直接複製到瀏覽器**就能測。四個 GET：

**① 取得目前開放中的題目（學員頁靠這個）**
```
https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec?action=getActiveQuestion
```

**② 取得所有題目（講師頁靠這個，也用來查 questionId）**
```
https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec?action=getAllQuestions
```

**③ 取得所有答題記錄（匯出 CSV 的來源）**
```
https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec?action=getAllAnswers
```

**④ 取得某題統計**（把網址最後的 `q-xxxx` 換成 ② 查到的真實 id）
```
https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec?action=getStats&questionId=q-xxxx
```

> 成功就是回 `{"success":true, ...}`。沒有開放題目時 `getActiveQuestion` 回 `{"success":true,"question":null}`，這是正常的。

## B2. 方法二：PowerShell 測 POST（Windows 內建，整段複製）

POST 資料在 body，要用工具。下面每一段都已內嵌真實網址，**整段複製貼進 PowerShell 即可執行**。

**① 新增一題（createQuestion，不需要 id，先跑這個）**
```powershell
$url = "https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec"
$body = '{"action":"createQuestion","data":{"text":"測試題：台灣最高的山是？","optionA":"阿里山","optionB":"玉山","optionC":"雪山","optionD":"合歡山","correctAnswer":"B"}}'
Invoke-RestMethod -Uri $url -Method Post -ContentType "text/plain" -Body $body
```

**② 自動撈一個題目 id 存進變數（後面 ③④⑤ 會用到）**
```powershell
$url = "https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec"
$all = Invoke-RestMethod -Uri "$url`?action=getAllQuestions" -Method Get
$qid = $all.questions[0].id
"抓到的 questionId = $qid"
```

**③ 開放這一題（updateQuestion，把 status 改 active）**
```powershell
$body = "{""action"":""updateQuestion"",""data"":{""id"":""$qid"",""status"":""active""}}"
Invoke-RestMethod -Uri $url -Method Post -ContentType "text/plain" -Body $body
```

**④ 模擬學員送出答案（submitAnswer）**
```powershell
$body = "{""action"":""submitAnswer"",""data"":{""questionId"":""$qid"",""sessionId"":""sess-demo-001"",""answer"":""B""}}"
Invoke-RestMethod -Uri $url -Method Post -ContentType "text/plain" -Body $body
```

**⑤ 看這題的統計（GET，沿用 $qid）**
```powershell
Invoke-RestMethod -Uri "$url`?action=getStats&questionId=$qid" -Method Get
```

**⑥ 關閉並刪除這一題（先關才能刪）**
```powershell
$body = "{""action"":""updateQuestion"",""data"":{""id"":""$qid"",""status"":""closed""}}"
Invoke-RestMethod -Uri $url -Method Post -ContentType "text/plain" -Body $body

$body = "{""action"":""deleteQuestion"",""data"":{""id"":""$qid""}}"
Invoke-RestMethod -Uri $url -Method Post -ContentType "text/plain" -Body $body
```

> 教學示範順序建議：① 新增 → ② 撈 id → ③ 開放 → ④ 送答案 → ⑤ 看統計 → ⑥ 收尾刪除。一條龍走完，學員就看懂整個 GET/POST 互動了。

## B3. 方法二（替代）：curl 測 POST（Mac / Git Bash，整段複製）

```bash
# 新增一題
curl -L -X POST "https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"createQuestion","data":{"text":"測試題：1+1=?","optionA":"1","optionB":"2","optionC":"3","optionD":"4","correctAnswer":"B"}}'

# 送出答案（把 q-xxxx 換成真實 id）
curl -L -X POST "https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"submitAnswer","data":{"questionId":"q-xxxx","sessionId":"sess-demo","answer":"A"}}'
```

> curl 一定要加 `-L`：GAS 成功後會 302 轉址到 `googleusercontent.com` 才吐 JSON，不跟轉址會看到空白。

## B4. 方法三：看 GAS 後端執行紀錄（從後端視角驗證）

前面是「前端送、看回應」。想知道後端到底跑到哪、在哪爆掉，打開 GAS 編輯器：

1. 左側「執行項目 / Executions」會列出每一次 `doGet` / `doPost` 的呼叫、耗時、狀態（完成 / 失敗）。
2. 程式裡加 `Logger.log('收到 action: ' + action)`，重新部署後呼叫就會在紀錄裡看到 log。
3. 狀態「失敗」點進去看錯誤堆疊（例如「找不到工作表: questions」），直接指出哪一行出問題。

這在「前端只拿到 `success:false` 看不出原因」時特別有用——完整堆疊在後端紀錄裡。

## B5. 方法四：前端 DevTools Network 面板（對照前後端）

跑 `npm run dev` 後按 **F12 → Network**，操作學員/講師頁，逐筆檢查對 `/exec` 的請求：

- **Request**：method 是 GET 還 POST？參數/body 對不對？
- **Response**：回的 JSON 是什麼？`success` 是 true 嗎？
- **Timing**：這一筆花多久？（NFR 要求 < 2 秒，免費版冷啟動偶爾超過。）
- **Status**：200 正常；0 / failed 通常是 CORS 或 URL 錯。

把 Network 看到的，跟 B1/B2 手動測的對照，就能判斷是前端送錯還是後端處理錯。

## B6. 方法五：VS Code REST Client（反覆測最方便）

裝 REST Client 外掛，新增 `api-test.http`，整檔複製貼上，點每段上方「Send Request」即可：

```http
@url = https://script.google.com/macros/s/AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA/exec

### 取得所有題目
GET {{url}}?action=getAllQuestions

### 取得開放中題目
GET {{url}}?action=getActiveQuestion

### 新增一題
POST {{url}}
Content-Type: text/plain

{"action":"createQuestion","data":{"text":"REST Client 測試題","optionA":"A","optionB":"B","optionC":"C","optionD":"D","correctAnswer":"A"}}

### 送出答案（把 q-xxxx 換成真實 id）
POST {{url}}
Content-Type: text/plain

{"action":"submitAnswer","data":{"questionId":"q-xxxx","sessionId":"sess-demo","answer":"A"}}
```

## B7. 方法六：在 GAS 編輯器直接執行（純後端，免瀏覽器/PowerShell）

前面五種都從「前端送、看回應」的角度測。這個方法反過來，**直接在 GAS 編輯器裡跑後端函式、把結果印到「執行記錄」**，完全不碰前端——除錯後端邏輯最快。

本專案已附測試集 `gas/tests.gs`，`clasp push` 上去（或貼進 GAS 編輯器）後即可使用。

**兩個必懂的前提：**

1. **「執行」只能跑「沒有參數」的函式。** 像 `handleDeleteQuestion(data)` 需要參數，直接選它按執行會因 `data` 為 undefined 而出錯——所以 `tests.gs` 把每個操作都包成無參數的 `test_xxx`。
2. **handler 回傳的是 `ContentService` 物件，不是字串。** 要看內容得用 `.getContent()` 取出 JSON，否則只會印出像 `TextOutput@1a2b` 的無用訊息。

**操作步驟：**

1. `tests.gs` 存檔（或 push 上去）。
2. 編輯器上方「函式下拉選單」選一個 `test_xxx`（例如 `test_fullFlow`）。
3. 按「執行」，第一次會要求授權，同意即可。
4. 下方「執行記錄 / Execution log」就會印出結果（Ctrl+Enter 開啟）。

**`tests.gs` 提供的函式：**

| 函式 | 作用 |
|------|------|
| `test_getActiveQuestion` / `test_getAllQuestions` / `test_getStats` / `test_getAllAnswers` | 四個讀取類，安全、隨便跑 |
| `test_createQuestion` / `test_updateQuestion_open` / `test_updateQuestion_close` / `test_submitAnswer` / `test_deleteQuestion` | 五個寫入類，會動到 Sheet 資料 |
| `test_fullFlow` | 一條龍：新增→開放→作答→看統計→關閉→刪除，跑完自動清理，最適合上課示範 |

**附註：`console.log` vs `_log`**
`console.log` 是 GAS 內建的印訊息函式；`_log` 是 `tests.gs` 裡自訂的小幫手，**底層還是呼叫 `console.log`**，只是多做兩件事：先 `.getContent()` 取出 JSON 字串、再排版美化。換句話說 `console.log` 你到哪都能用，`_log` 只是我們專案為了少打字、把回應印漂亮而包的工具。

## B8. 七個 action 測試對照卡

| Action | 方法 | 怎麼測 | 預期成功回應 | 驗證點 |
|--------|------|--------|--------------|--------|
| getActiveQuestion | GET | 瀏覽器貼網址 | `{success:true, question:{...}或null}` | 有開放題目就回該題 |
| getAllQuestions | GET | 瀏覽器貼網址 | `{success:true, questions:[...]}` | 陣列依 createdAt 降序 |
| getStats | GET | 網址帶 `&questionId=` | `{success:true, stats:{total,A,B,C,D}}` | 票數加總 = total |
| getAllAnswers | GET | 瀏覽器貼網址 | `{success:true, answers:[...]}` | 匯出 CSV 的來源 |
| createQuestion | POST | PowerShell ① | `{success:true, question:{...}}` | 回傳含新 id，status=draft |
| updateQuestion | POST | PowerShell ③ | `{success:true}` | 去 Sheet 確認該列真的改了 |
| deleteQuestion | POST | PowerShell ⑥ | `{success:true}` | active 題目會被擋（先關閉） |
| submitAnswer | POST | PowerShell ④ | `{success:true, record:{...}}` | 同 session 重送回 `code:409` |

> 每測完一個 POST，都到 Google Sheets 對應工作表看一眼資料有沒有真的進去——這是最終、最可靠的驗證。

---

# Part C — 進階：除錯與常見錯誤

下面都是這個專案實際遇過的真實狀況，附「症狀 → 原因 → 解法」。

## C1. 「找不到指令碼函式：doGet」
- **症狀**：瀏覽器開 `/exec?action=...` 顯示這行紅字。
- **原因**：部署背後的專案沒有 doGet——程式沒 push，或部署釘在沒程式碼的舊版本。
- **解法**：`clasp push` 把程式推上去，再 `clasp deploy -i <deploymentId>` 用新版本更新部署。記住 **push ≠ deploy**：push 只更新程式碼，deploy 才會把它端出去。

## C2. 前端顯示「網路連線中斷，請重新整理頁面」
- **原因 1**：`.env` 的 `VITE_GAS_URL` 沒設、設錯、或存成 UTF-16（Vite 只讀 UTF-8）。
- **原因 2**：改了 `.env` 但沒重啟 dev server（環境變數只在啟動時讀一次）。
- **解法**：確認 `.env` 是 UTF-8、URL 完整含 `/exec`，重啟 `npm run dev`。

## C3. 題目只剩 A/B/C/D 空選項；或「開放此題」按了沒反應
- **原因**：Google Sheets 的**表頭列名稱跟程式對不上**。後端靠表頭名稱（第一列）對應欄位，名稱錯一個字那欄就讀不到 / 寫不進去。
- **解法**：`questions` 表頭逐字等於 `id, text, optionA, optionB, optionC, optionD, correctAnswer, status, createdAt, updatedAt`；`answers` 表頭等於 `id, questionId, sessionId, answer, timestamp`。

## C4. 統計永遠是 0、學員答案沒寫進去
- **原因**：`answers` 工作表表頭錯（例如寫成 `question_id` 而非 `questionId`）。
- **解法**：同 C3，修正 `answers` 表頭。

## C5. POST 在瀏覽器失敗、在 PowerShell 卻成功（CORS）
- **原因**：前端 POST 用了 `application/json` 觸發 preflight，GAS 不回 OPTIONS；命令列工具不受 CORS 限制所以照樣通。
- **解法**：前端 POST 改用 `Content-Type: text/plain`（見 A5）。

## C6. API 回應超過 2 秒
- **原因**：GAS 免費版冷啟動延遲。
- **解法**：屬基礎設施限制，程式改不掉。可接受就列為已知限制，或升級 / 換後端。

---

## 附錄：互動測試檢查清單

部署或改設定後，照這個順序跑一遍最不會漏：

1. [ ] 瀏覽器測 `getActiveQuestion` → 回 JSON（部署活著）
2. [ ] 無痕視窗再測一次 → 不需登入（存取權=任何人）
3. [ ] 瀏覽器測 `getAllQuestions` → 看得到題目陣列
4. [ ] PowerShell ① `createQuestion` → 回新題 id，Sheet 多一列且欄位齊全
5. [ ] PowerShell ③ `updateQuestion` 設 active → Sheet 的 status 變 active
6. [ ] PowerShell ④ `submitAnswer` → answers 多一列；同 session 重送回 409
7. [ ] 瀏覽器測 `getStats&questionId=` → 票數正確
8. [ ] 前端 DevTools Network → 每筆請求 200、回應 success:true、耗時可接受

全部打勾，代表前端與 GAS 的互動鏈路完整可用。
