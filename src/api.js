import axios from 'axios'

const GAS_URL = import.meta.env.VITE_GAS_URL || ''

if (!GAS_URL) {
  console.warn('[api.js] VITE_GAS_URL 未設定，請複製 .env.example 為 .env 並填入 GAS URL')
}

/**
 * 通用 GET 請求
 * @param {Object} params - query 參數
 */
async function gasGet(params) {
  const response = await axios.get(GAS_URL, {
    params,
    timeout: 10000,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || '未知錯誤')
  }
  return response.data
}

/**
 * 通用 POST 請求
 * @param {Object} body - 請求 body
 */
async function gasPost(body) {
  const response = await axios.post(GAS_URL, body, {
    headers: { 'Content-Type': 'text/plain' }, // GAS 需要 text/plain 避免 CORS preflight
    timeout: 10000,
  })
  if (!response.data.success) {
    throw new Error(response.data.error || '未知錯誤')
  }
  return response.data
}

// ─── 學員 API ────────────────────────────────────────────────

/**
 * 取得目前開放中的題目
 * @returns {{ question: Object|null }}
 */
export async function getActiveQuestion() {
  return gasGet({ action: 'getActiveQuestion' })
}

/**
 * 學員送出答案
 * @param {string} questionId
 * @param {string} sessionId
 * @param {string} answer - 'A'|'B'|'C'|'D'
 */
export async function submitAnswer(questionId, sessionId, answer) {
  return gasPost({ action: 'submitAnswer', data: { questionId, sessionId, answer } })
}

// ─── 講師 API ────────────────────────────────────────────────

/**
 * 取得所有題目
 * @returns {{ questions: Object[] }}
 */
export async function getAllQuestions() {
  return gasGet({ action: 'getAllQuestions' })
}

/**
 * 新增題目
 * @param {Object} questionData - { text, optionA, optionB, optionC, optionD, correctAnswer }
 */
export async function createQuestion(questionData) {
  return gasPost({ action: 'createQuestion', data: questionData })
}

/**
 * 更新題目（含狀態）
 * @param {string} id
 * @param {Object} updates
 */
export async function updateQuestion(id, updates) {
  return gasPost({ action: 'updateQuestion', data: { id, ...updates } })
}

/**
 * 刪除題目
 * @param {string} id
 */
export async function deleteQuestion(id) {
  return gasPost({ action: 'deleteQuestion', data: { id } })
}

/**
 * 取得指定題目的答題統計
 * @param {string} questionId
 * @returns {{ stats: { total, A, B, C, D } }}
 */
export async function getStats(questionId) {
  return gasGet({ action: 'getStats', questionId })
}

/**
 * 取得所有答題記錄（講師匯出 CSV 用）
 * @returns {{ answers: Object[] }}
 */
export async function getAllAnswers() {
  return gasGet({ action: 'getAllAnswers' })
}

// ─── Session 工具 ─────────────────────────────────────────────

/**
 * 取得或建立 sessionId（優先使用 localStorage，備用 sessionStorage）
 * @returns {string}
 */
export function getSessionId() {
  const KEY = 'ai_quiz_session_id'
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = 'sess-' + crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    try {
      let id = sessionStorage.getItem(KEY)
      if (!id) {
        id = 'sess-' + crypto.randomUUID()
        sessionStorage.setItem(KEY, id)
      }
      return id
    } catch {
      return 'sess-' + Math.random().toString(36).slice(2)
    }
  }
}

/**
 * 檢查是否已作答過此題
 * @param {string} questionId
 * @returns {boolean}
 */
export function hasAnswered(questionId) {
  try {
    const answered = JSON.parse(localStorage.getItem('ai_quiz_answered') || '[]')
    return answered.includes(questionId)
  } catch {
    return false
  }
}

/**
 * 標記已作答
 * @param {string} questionId
 */
export function markAnswered(questionId) {
  try {
    const answered = JSON.parse(localStorage.getItem('ai_quiz_answered') || '[]')
    if (!answered.includes(questionId)) {
      answered.push(questionId)
      localStorage.setItem('ai_quiz_answered', JSON.stringify(answered))
    }
  } catch {
    // silent fail
  }
}
