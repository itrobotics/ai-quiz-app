import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getAllQuestions, createQuestion, updateQuestion, deleteQuestion, getStats,
} from '../api.js'
import StatChart from '../components/StatChart.jsx'

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_TEACHER) || 3000
const OPTIONS = ['A', 'B', 'C', 'D']
const STATUS_LABEL = { draft: '草稿', active: '開放中', closed: '已關閉' }
const STATUS_COLOR = {
  draft:  { background: '#F1F5F9', color: '#64748B' },
  active: { background: '#D1FAE5', color: '#065F46' },
  closed: { background: '#DBEAFE', color: '#1E40AF' },
}

const s = {
  page: { minHeight: 'calc(100vh - 48px)', background: '#F8FAFC', padding: '24px 16px' },
  maxW: { maxWidth: '1100px', margin: '0 auto' },
  title: { fontSize: '1.4rem', fontWeight: '700', color: '#1E293B', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: {
    background: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px',
  },
  sectionTitle: {
    fontSize: '1rem', fontWeight: '600', color: '#374151',
    marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px',
  },
  label: { display: 'block', fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px', fontWeight: '500' },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0',
    borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit',
    outline: 'none', marginBottom: '12px', color: '#1E293B',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  btn: (color, light) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: color, color: light || '#fff',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity 0.15s',
  }),
  addBtn: {
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: '#3B82F6', color: '#fff', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px',
  },
  tag: (status) => ({
    display: 'inline-block', padding: '2px 10px',
    borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
    ...STATUS_COLOR[status],
  }),
  qItem: {
    border: '1px solid #E2E8F0', borderRadius: '10px',
    padding: '14px 16px', marginBottom: '10px',
  },
  qText: { fontSize: '0.9rem', color: '#1E293B', marginBottom: '6px', fontWeight: '500' },
  qActions: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' },
  errMsg: { color: '#EF4444', fontSize: '0.8rem', marginBottom: '8px' },
  successMsg: {
    background: '#D1FAE5', color: '#065F46', padding: '10px 14px',
    borderRadius: '8px', fontSize: '0.875rem', marginBottom: '12px',
  },
}

const EMPTY_FORM = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' }

export default function TeacherPage() {
  const [questions, setQuestions]   = useState([])
  const [stats, setStats]           = useState(null)
  const [activeQ, setActiveQ]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formErr, setFormErr]       = useState('')
  const [formOk, setFormOk]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [editId, setEditId]         = useState(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const pollRef = useRef(null)

  // ── 載入題目清單 ────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    try {
      const data = await getAllQuestions()
      const qs = data.questions || []
      setQuestions(qs)
      const active = qs.find(q => q.status === 'active') || null
      setActiveQ(active)
    } catch (err) {
      console.error('fetchQuestions error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── 載入統計 ────────────────────────────────────────────────
  const fetchStats = useCallback(async (qId) => {
    if (!qId) { setStats(null); return }
    try {
      const data = await getStats(qId)
      setStats(data.stats)
      const now = new Date()
      setLastUpdated(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`)
    } catch (err) {
      console.error('fetchStats error', err)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [])

  // ── 統計輪詢 ─────────────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    const qId = activeQ?.id
    if (qId) {
      fetchStats(qId)
      pollRef.current = setInterval(() => fetchStats(qId), POLL_INTERVAL)
    } else {
      setStats(null)
    }
    return () => clearInterval(pollRef.current)
  }, [activeQ?.id])

  // ── 表單驗證 ────────────────────────────────────────────────
  function validate() {
    if (!form.text.trim()) return '請填寫題目'
    for (const opt of OPTIONS) {
      if (!form[`option${opt}`].trim()) return `請填寫選項 ${opt}`
    }
    if (!OPTIONS.includes(form.correctAnswer)) return '請選擇正確答案'
    return ''
  }

  // ── 新增 / 編輯題目 ─────────────────────────────────────────
  async function handleSave() {
    const err = validate()
    if (err) { setFormErr(err); return }
    setSaving(true)
    setFormErr('')
    try {
      if (editId) {
        await updateQuestion(editId, form)
        setFormOk('題目已更新！')
        setEditId(null)
      } else {
        await createQuestion(form)
        setFormOk('題目已新增！')
      }
      setForm(EMPTY_FORM)
      await fetchQuestions()
      setTimeout(() => setFormOk(''), 3000)
    } catch (err) {
      setFormErr(err.message || '操作失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  // ── 開放 / 關閉題目 ─────────────────────────────────────────
  async function handleToggleStatus(q) {
    const newStatus = q.status === 'active' ? 'closed' : 'active'
    try {
      await updateQuestion(q.id, { status: newStatus })
      await fetchQuestions()
    } catch (err) {
      alert('操作失敗：' + err.message)
    }
  }

  // ── 刪除題目 ─────────────────────────────────────────────────
  async function handleDelete(q) {
    if (q.status === 'active') { alert('請先關閉題目再刪除'); return }
    if (!confirm(`確定要刪除「${q.text}」？`)) return
    try {
      await deleteQuestion(q.id)
      await fetchQuestions()
    } catch (err) {
      alert('刪除失敗：' + err.message)
    }
  }

  // ── 編輯題目（填入表單） ────────────────────────────────────
  function handleEdit(q) {
    if (q.status === 'active') { alert('請先關閉題目再編輯'); return }
    setEditId(q.id)
    setForm({
      text: q.text, optionA: q.optionA, optionB: q.optionB,
      optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormErr('')
  }

  if (loading) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94A3B8' }}>⏳ 載入中…</p>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.maxW}>
        <h1 style={s.title}>🎓 講師後台</h1>
        <div style={s.grid}>
          {/* ── 左欄：題目管理 ── */}
          <div>
            {/* 新增 / 編輯表單 */}
            <div style={s.card}>
              <p style={s.sectionTitle}>{editId ? '✏️ 編輯題目' : '➕ 新增題目'}</p>
              {formOk && <p style={s.successMsg}>{formOk}</p>}
              {formErr && <p style={s.errMsg}>⚠️ {formErr}</p>}

              <label style={s.label}>題目文字 *</label>
              <textarea
                style={{ ...s.input, height: '80px', resize: 'vertical' }}
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="請輸入題目內容…"
              />
              <div style={s.row}>
                {OPTIONS.map(opt => (
                  <div key={opt}>
                    <label style={s.label}>選項 {opt} *</label>
                    <input
                      style={s.input}
                      value={form[`option${opt}`]}
                      onChange={e => setForm(f => ({ ...f, [`option${opt}`]: e.target.value }))}
                      placeholder={`選項 ${opt}`}
                    />
                  </div>
                ))}
              </div>
              <label style={s.label}>正確答案 *</label>
              <select
                style={s.input}
                value={form.correctAnswer}
                onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
              >
                {OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={s.addBtn} onClick={handleSave} disabled={saving}>
                  {saving ? '儲存中…' : editId ? '儲存變更' : '新增題目'}
                </button>
                {editId && (
                  <button
                    style={{ ...s.addBtn, background: '#6B7280', width: 'auto', padding: '12px 20px' }}
                    onClick={cancelEdit}
                  >取消</button>
                )}
              </div>
            </div>

            {/* 題目清單 */}
            <div style={{ ...s.card, marginTop: '20px' }}>
              <p style={s.sectionTitle}>📋 題目清單（共 {questions.length} 題）</p>
              {questions.length === 0 && (
                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>
                  尚無題目，請從上方新增
                </p>
              )}
              {questions.map(q => (
                <div key={q.id} style={s.qItem}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <p style={s.qText}>{q.text}</p>
                    <span style={s.tag(q.status)}>{STATUS_LABEL[q.status]}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {OPTIONS.map(opt => (
                      <span key={opt} style={{ marginRight: '12px' }}>
                        {opt}. {q[`option${opt}`]}
                        {q.correctAnswer === opt ? ' ✓' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={s.qActions}>
                    <button
                      style={s.btn(q.status === 'active' ? '#6B7280' : '#10B981')}
                      onClick={() => handleToggleStatus(q)}
                    >
                      {q.status === 'active' ? '關閉題目' : '開放此題'}
                    </button>
                    <button
                      style={s.btn('#F59E0B')}
                      onClick={() => handleEdit(q)}
                      disabled={q.status === 'active'}
                    >編輯</button>
                    <button
                      style={s.btn('#EF4444')}
                      onClick={() => handleDelete(q)}
                      disabled={q.status === 'active'}
                    >刪除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 右欄：統計 ── */}
          <div>
            <div style={s.card}>
              <p style={s.sectionTitle}>
                {activeQ ? `📊 ${activeQ.text}` : '📊 目前無開放題目'}
              </p>
              {!activeQ ? (
                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '24px 0', fontSize: '0.9rem' }}>
                  請從左側開放一道題目後，統計將在此顯示
                </p>
              ) : (
                <StatChart
                  stats={stats}
                  question={activeQ}
                  lastUpdated={lastUpdated}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RWD */}
      <style>{`
        @media (max-width: 768px) {
          .teacher-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
