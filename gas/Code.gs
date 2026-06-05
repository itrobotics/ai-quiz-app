/**
 * AI 工具使用小測驗 — GAS 後端入口
 * Code.gs
 *
 * 設定方式：
 *   1. 將下方 SPREADSHEET_ID 替換為你的 Google Sheets ID
 *   2. clasp push
 *   3. 在 GAS 控制台部署為 Web App（執行身份：我；存取：所有人）
 */

const SPREADSHEET_ID = '1NsCZc2uAiB8-7IqdUngOS2wwzYo0CQuXCRl0F4tMzy4';
const SHEET_QUESTIONS = 'questions';
const SHEET_ANSWERS   = 'answers';

// ─── JSON Response Helper ─────────────────────────────────────
//
// 注意：GAS 的 ContentService.TextOutput 沒有 setHeader 方法，
// 無法手動設定 CORS header。部署為「任何人（含匿名）」存取時，
// 對「簡單請求」(GET、以及 Content-Type: text/plain 的 POST) 瀏覽器即可正常讀取回應，
// 因此前端 POST 一律用 text/plain（見 src/api.js）以規避 preflight。

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg, code) {
  return jsonResponse({ success: false, error: msg, code: code || 400 });
}

// ─── doGet ────────────────────────────────────────────────────

function doGet(e) {
  try {
    const action = e.parameter.action;
    switch (action) {
      case 'getActiveQuestion':
        return handleGetActiveQuestion();
      case 'getAllQuestions':
        return handleGetAllQuestions();
      case 'getStats':
        return handleGetStats(e.parameter.questionId);
      case 'getAllAnswers':
        return handleGetAllAnswers();
      default:
        return errorResponse('未知的 action: ' + action);
    }
  } catch (err) {
    return errorResponse('伺服器錯誤: ' + err.message, 500);
  }
}

// ─── doPost ───────────────────────────────────────────────────

function doPost(e) {
  try {
    // 支援 application/json 與 text/plain（規避 CORS preflight）
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return errorResponse('無效的 JSON body');
    }

    const action = body.action;
    const data   = body.data || {};

    switch (action) {
      case 'createQuestion':
        return handleCreateQuestion(data);
      case 'updateQuestion':
        return handleUpdateQuestion(data);
      case 'deleteQuestion':
        return handleDeleteQuestion(data);
      case 'submitAnswer':
        return handleSubmitAnswer(data);
      default:
        return errorResponse('未知的 action: ' + action);
    }
  } catch (err) {
    return errorResponse('伺服器錯誤: ' + err.message, 500);
  }
}

// ─── Spreadsheet Helper ───────────────────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('找不到工作表: ' + name);
  return sheet;
}

/**
 * 將工作表資料轉為 JSON 陣列（第一列為 header）
 */
function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * 依 header 欄位順序將物件 append 到工作表
 */
function appendRow(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}

/**
 * 找到指定欄位值的列號（1-based），找不到回傳 -1
 */
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) return i + 1; // 1-based
  }
  return -1;
}

/**
 * 更新指定列的欄位值
 */
function updateRowFields(sheet, rowNum, updates) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) {
      sheet.getRange(rowNum, i + 1).setValue(updates[h]);
    }
  });
}

/**
 * 產生 UUID v4（GAS 相容）
 */
function generateId(prefix) {
  const p = prefix || 'id';
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return p + '-' + s4() + s4() + '-' + s4();
}
