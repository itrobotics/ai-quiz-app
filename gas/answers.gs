/**
 * AI 工具使用小測驗 — 答題記錄
 * answers.gs
 */

// ─── 學員送出答案 ─────────────────────────────────────────────

function handleSubmitAnswer(data) {
  const { questionId, sessionId, answer } = data;

  // 基本驗證
  if (!questionId) return errorResponse('缺少 questionId');
  if (!sessionId)  return errorResponse('缺少 sessionId');
  if (!['A', 'B', 'C', 'D'].includes(answer)) return errorResponse('answer 必須是 A/B/C/D');

  // 確認題目存在且狀態為 active
  const qSheet = getSheet(SHEET_QUESTIONS);
  const questions = sheetToJson(qSheet);
  const question = questions.find(q => q.id === questionId);
  if (!question) return errorResponse('題目不存在: ' + questionId);
  if (question.status !== 'active') {
    return jsonResponse({ success: false, error: '此題已關閉，無法作答', code: 410 });
  }

  // 防重複作答：檢查 sessionId + questionId 是否已存在
  const aSheet = getSheet(SHEET_ANSWERS);

  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const answers = sheetToJson(aSheet);
    const duplicate = answers.find(
      a => a.questionId === questionId && a.sessionId === sessionId
    );
    if (duplicate) {
      return jsonResponse({ success: false, error: '您已作答過此題', code: 409 });
    }

    // 寫入答題記錄
    const record = {
      id:         generateId('a'),
      questionId: questionId,
      sessionId:  sessionId,
      answer:     answer,
      timestamp:  new Date().toISOString(),
    };
    appendRow(aSheet, record);
    return jsonResponse({ success: true, record: record });

  } finally {
    lock.releaseLock();
  }
}

// ─── 取得答題統計 ─────────────────────────────────────────────

function handleGetStats(questionId) {
  if (!questionId) return errorResponse('缺少 questionId');

  const sheet = getSheet(SHEET_ANSWERS);
  const answers = sheetToJson(sheet);
  const filtered = answers.filter(a => a.questionId === questionId);

  const stats = { questionId: questionId, total: filtered.length, A: 0, B: 0, C: 0, D: 0 };
  filtered.forEach(a => {
    if (['A', 'B', 'C', 'D'].includes(a.answer)) {
      stats[a.answer]++;
    }
  });

  return jsonResponse({ success: true, stats: stats });
}

// ─── 取得所有答題記錄（講師匯出 CSV 用）─────────────────────────

function handleGetAllAnswers() {
  const sheet = getSheet(SHEET_ANSWERS);
  const answers = sheetToJson(sheet);
  return jsonResponse({ success: true, answers: answers });
}
