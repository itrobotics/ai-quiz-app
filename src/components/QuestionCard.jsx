import { useState } from 'react'

const OPTIONS = ['A', 'B', 'C', 'D']

const styles = {
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
  },
  questionText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  optionButton: (selected, disabled) => ({
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    marginBottom: '12px',
    borderRadius: '10px',
    border: selected ? '2px solid #3B82F6' : '2px solid #E2E8F0',
    background: selected ? '#3B82F6' : '#fff',
    color: selected ? '#fff' : '#374151',
    fontSize: '1rem',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled && !selected ? 0.6 : 1,
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  }),
  submitBtn: (canSubmit) => ({
    marginTop: '8px',
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: canSubmit ? '#10B981' : '#D1FAE5',
    color: canSubmit ? '#fff' : '#6EE7B7',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  }),
  successMsg: {
    textAlign: 'center',
    color: '#10B981',
    fontSize: '1.1rem',
    fontWeight: '600',
    padding: '20px 0',
  },
  alreadyMsg: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '0.95rem',
    marginTop: '12px',
    padding: '10px',
    background: '#F3F4F6',
    borderRadius: '8px',
  },
  optionLabel: {
    fontWeight: '700',
    marginRight: '10px',
    color: 'inherit',
  },
}

/**
 * QuestionCard — 學員作答卡片
 *
 * Props:
 *   question  {Object}   - 題目物件
 *   onSubmit  {Function} - (answer: string) => Promise<void>
 *   submitted {boolean}  - 是否已送出
 *   alreadyAnswered {boolean} - 是否已作答過（來自 localStorage）
 */
export default function QuestionCard({ question, onSubmit, submitted, alreadyAnswered }) {
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!selected || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(selected)
    } catch (err) {
      setError('送出失敗，請再試一次')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={styles.card}>
        <div style={styles.successMsg}>
          ✅ 已送出，感謝作答！
        </div>
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
          等待講師公布結果…
        </p>
      </div>
    )
  }

  if (alreadyAnswered) {
    return (
      <div style={styles.card}>
        <p style={styles.questionText}>{question.text}</p>
        <div style={styles.alreadyMsg}>您已作答過此題</div>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <p style={styles.questionText}>{question.text}</p>
      {OPTIONS.map(opt => (
        <button
          key={opt}
          style={styles.optionButton(selected === opt, submitting)}
          onClick={() => !submitting && setSelected(opt)}
          disabled={submitting}
        >
          <span style={styles.optionLabel}>{opt}.</span>
          {question[`option${opt}`]}
        </button>
      ))}
      {error && (
        <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '8px' }}>{error}</p>
      )}
      <button
        style={styles.submitBtn(!!selected && !submitting)}
        onClick={handleSubmit}
        disabled={!selected || submitting}
      >
        {submitting ? '送出中…' : '送出答案'}
      </button>
    </div>
  )
}
