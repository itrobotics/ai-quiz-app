/**
 * AI 小測驗 — GAS 編輯器測試集 (tests.gs)
 *
 * 用途：不開瀏覽器、不用 PowerShell，直接在 GAS 編輯器測後端。
 *
 * 使用方式：
 *   1. 把這個檔貼進 GAS 專案、存檔（Ctrl+S）。
 *   2. 編輯器上方「函式下拉選單」選一個 test_xxx。
 *   3. 按「執行」。第一次會要求授權，同意即可。
 *   4. 下方「執行記錄 / Execution log」會印出結果（Ctrl+Enter 開啟）。
 *
 * 小知識：handler 回傳的是 ContentService 物件，不是字串，
 *        所以下面都用 .getContent() 取出 JSON 文字再 log。
 */

// ─── 共用：把 handler 回傳的 ContentService 印成漂亮 JSON ───────
function _log(label, contentServiceResult) {
  const text = contentServiceResult.getContent();
  console.log('===== ' + label + ' =====');
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch (e) {
    console.log(text); // 萬一不是 JSON，原樣印出
  }
}

// ─── 共用：撈第一筆題目的 id（給需要 id 的測試用）───────────────
function _firstQuestionId() {
  const parsed = JSON.parse(handleGetAllQuestions().getContent());
  if (!parsed.questions || parsed.questions.length === 0) {
    throw new Error('questions 工作表沒有題目，請先跑 test_createQuestion');
  }
  return parsed.questions[0].id;
}

// ═══════════════════════ 讀取類 (GET) ═══════════════════════

/** 取得目前開放中的題目 */
function test_getActiveQuestion() {
  _log('getActiveQuestion', handleGetActiveQuestion());
}

/** 取得所有題目，並印出題數與第一題 */
function test_getAllQuestions() {
  const result = handleGetAllQuestions();
  _log('getAllQuestions', result);
  const parsed = JSON.parse(result.getContent());
  console.log('題目總數 =', parsed.questions.length);
}

/** 取得某題統計（自動抓第一題的 id） */
function test_getStats() {
  const qid = _firstQuestionId();
  console.log('使用 questionId =', qid);
  _log('getStats', handleGetStats(qid));
}

/** 取得所有答題記錄（匯出 CSV 的來源） */
function test_getAllAnswers() {
  _log('getAllAnswers', handleGetAllAnswers());
}

// ═══════════════════════ 寫入類 (POST) ═══════════════════════
// 注意：這些會真的改動 Google Sheets 資料，測完記得清理。

/** 新增一題（不需要 id） */
function test_createQuestion() {
  const data = {
    text: '【測試】台灣最高的山是？',
    optionA: '阿里山',
    optionB: '玉山',
    optionC: '雪山',
    optionD: '合歡山',
    correctAnswer: 'B',
  };
  console.log('輸入 data =', JSON.stringify(data));
  _log('createQuestion', handleCreateQuestion(data));
}

/** 開放第一題（status 改 active） */
function test_updateQuestion_open() {
  const qid = _firstQuestionId();
  console.log('開放 questionId =', qid);
  _log('updateQuestion(active)', handleUpdateQuestion({ id: qid, status: 'active' }));
}

/** 關閉第一題（status 改 closed） */
function test_updateQuestion_close() {
  const qid = _firstQuestionId();
  console.log('關閉 questionId =', qid);
  _log('updateQuestion(closed)', handleUpdateQuestion({ id: qid, status: 'closed' }));
}

/** 模擬學員送出答案（對第一題答 B） */
function test_submitAnswer() {
  const qid = _firstQuestionId();
  const data = { questionId: qid, sessionId: 'sess-gas-test', answer: 'B' };
  console.log('輸入 data =', JSON.stringify(data));
  _log('submitAnswer', handleSubmitAnswer(data));
  console.log('提示：同一個 sessionId 再送一次，應該回 code:409（已作答過）');
}

/** 刪除第一題（active 的題目會被擋，需先 close） */
function test_deleteQuestion() {
  const qid = _firstQuestionId();
  console.log('刪除 questionId =', qid);
  _log('deleteQuestion', handleDeleteQuestion({ id: qid }));
}

// ═══════════════════════ 一條龍流程 ═══════════════════════

/**
 * 一次跑完整個生命週期：新增 → 開放 → 學員作答 → 看統計 → 關閉 → 刪除。
 * 適合上課示範「前端那些操作，後端到底發生什麼事」。
 * 全程只動這一題測試資料，跑完會自己刪掉，不留垃圾。
 */
function test_fullFlow() {
  console.log('───── 1) 新增題目 ─────');
  const created = JSON.parse(handleCreateQuestion({
    text: '【一條龍測試】1 + 1 = ?',
    optionA: '1', optionB: '2', optionC: '3', optionD: '4',
    correctAnswer: 'B',
  }).getContent());
  const qid = created.question.id;
  console.log('新題 id =', qid, ' status =', created.question.status);

  console.log('───── 2) 開放題目 ─────');
  console.log(handleUpdateQuestion({ id: qid, status: 'active' }).getContent());

  console.log('───── 3) 學員作答（答 B）─────');
  console.log(handleSubmitAnswer({ questionId: qid, sessionId: 'sess-flow-1', answer: 'B' }).getContent());

  console.log('───── 4) 看統計 ─────');
  console.log(handleGetStats(qid).getContent());

  console.log('───── 5) 關閉題目 ─────');
  console.log(handleUpdateQuestion({ id: qid, status: 'closed' }).getContent());

  console.log('───── 6) 刪除題目（清理）─────');
  console.log(handleDeleteQuestion({ id: qid }).getContent());

  console.log('✅ 一條龍完成。');
}
