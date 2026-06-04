/**
 * AI 工具使用小測驗 — 題目 CRUD
 * questions.gs
 */

// ─── 取得開放中題目（學員用）────────────────────────────────

function handleGetActiveQuestion() {
  const sheet = getSheet(SHEET_QUESTIONS);
  const questions = sheetToJson(sheet);
  const active = questions.find(q => q.status === 'active') || null;
  return jsonResponse({ success: true, question: active });
}

// ─── 取得所有題目（講師用）──────────────────────────────────

function handleGetAllQuestions() {
  const sheet = getSheet(SHEET_QUESTIONS);
  const questions = sheetToJson(sheet);
  // 依 createdAt 降序排列
  questions.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime() || 0;
    const tb = new Date(b.createdAt).getTime() || 0;
    return tb - ta;
  });
  return jsonResponse({ success: true, questions: questions });
}

// ─── 新增題目 ────────────────────────────────────────────────

function handleCreateQuestion(data) {
  // 驗證必填欄位
  const required = ['text', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'];
  for (const field of required) {
    if (!data[field] || !String(data[field]).trim()) {
      return errorResponse('缺少必填欄位: ' + field);
    }
  }
  if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) {
    return errorResponse('correctAnswer 必須是 A/B/C/D');
  }

  const now = new Date().toISOString();
  const question = {
    id:            generateId('q'),
    text:          data.text.trim(),
    optionA:       data.optionA.trim(),
    optionB:       data.optionB.trim(),
    optionC:       data.optionC.trim(),
    optionD:       data.optionD.trim(),
    correctAnswer: data.correctAnswer,
    status:        'draft',
    createdAt:     now,
    updatedAt:     now,
  };

  const sheet = getSheet(SHEET_QUESTIONS);
  appendRow(sheet, question);
  return jsonResponse({ success: true, question: question });
}

// ─── 更新題目 ────────────────────────────────────────────────

function handleUpdateQuestion(data) {
  if (!data.id) return errorResponse('缺少 id');

  const sheet = getSheet(SHEET_QUESTIONS);

  // 若要設為 active，先關閉其他所有 active 題目
  if (data.status === 'active') {
    const questions = sheetToJson(sheet);
    questions.forEach(q => {
      if (q.status === 'active' && q.id !== data.id) {
        const rowNum = findRowById(sheet, q.id);
        if (rowNum > 0) {
          updateRowFields(sheet, rowNum, { status: 'closed', updatedAt: new Date().toISOString() });
        }
      }
    });
  }

  const rowNum = findRowById(sheet, data.id);
  if (rowNum < 0) return errorResponse('找不到題目 id: ' + data.id);

  const updates = { ...data, updatedAt: new Date().toISOString() };
  delete updates.id; // id 不更新

  // 使用 LockService 防止並發衝突
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    updateRowFields(sheet, rowNum, updates);
  } finally {
    lock.releaseLock();
  }

  return jsonResponse({ success: true });
}

// ─── 刪除題目 ────────────────────────────────────────────────

function handleDeleteQuestion(data) {
  if (!data.id) return errorResponse('缺少 id');

  const sheet = getSheet(SHEET_QUESTIONS);

  // 確認非 active 才能刪除
  const questions = sheetToJson(sheet);
  const q = questions.find(q => q.id === data.id);
  if (!q) return errorResponse('找不到題目 id: ' + data.id);
  if (q.status === 'active') return errorResponse('開放中的題目不可刪除，請先關閉');

  const rowNum = findRowById(sheet, data.id);
  if (rowNum < 0) return errorResponse('找不到題目 id: ' + data.id);

  sheet.deleteRow(rowNum);
  return jsonResponse({ success: true });
}
