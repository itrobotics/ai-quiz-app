import { useState, useEffect, useRef, useCallback } from 'react'
import { getActiveQuestion, submitAnswer, getSessionId, hasAnswered, markAnswered } from '../api.js'
import QuestionCard from '../components/QuestionCard.jsx'

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_STUDENT) || 5000

const styles = {
  page: {
    minHeight: 'calc(100vh - 48px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: '#F8FAFC',
  },
  waiting: {
    textAlign: 'center',
    color: '#94A3B8',
  },
  waitingIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '16px',
    animation: 'pulse 2s infinite',
  },
  waitingText: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    color: '#64748B',
  },
  waitingSubText: {
    fontSize: '0.875rem',
    color: '#94A3B8',
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '20px',
    color: '#B91C1C',
    maxWidth: '420px',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: '12px',
    padding: '8px 20px',
    background: '#EF4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
}

export default function StudentPage() {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [warningShown, setWarningShown] = useState(false)

  const sessionId = getSessionId()
  const pollRef = useRef(null)
  const currentQuestionId = useRef(null)

  const fetchQuestion = useCallback(async (silent = false) => {
    try {
      const data = await getActiveQuestion()
      setError(null)
      setFailCount(0)
      setWarningShown(false)

      if (data.question) {
        // 若題目切換，重置送出狀態
        if (currentQuestionId.current !== data.question.id) {
          currentQuestionId.current = data.question.id
          setSubmitted(false)
        }
        setQuestion(data.question)
      } else {
        setQuestion(null)
        currentQuestionId.current = null
        setSubmitted(false)
      }
    } catch (err) {
      setFailCount(prev => {
        const next = prev + 1
        if (next >= 3 && !warningShown) {
          setWarningShown(true)
          setError('網路連線中斷，請重新整理頁面')
          stopPolling()
        }
        return next
      })
      if (!silent) setError('載入失敗，請重新整理頁面')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [warningShown])

  function startPolling() {
    stopPolling()
    pollRef.current = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchQuestion(true)
      }
    }, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    fetchQuestion()
    startPolling()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchQuestion(true)
        startPolling()
      } else {
        stopPolling()
      }
    }

    const handleOnline = () => {
      setError(null)
      setFailCount(0)
      setWarningShown(false)
      fetchQuestion(true)
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  async function handleSubmit(answer) {
    if (!question) return
    await submitAnswer(question.id, sessionId, answer)
    markAnswered(question.id)
    setSubmitted(true)
  }

  function handleRetry() {
    setError(null)
    setFailCount(0)
    setWarningShown(false)
    setLoading(true)
    fetchQuestion()
    startPolling()
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <span style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</span>
        <p style={{ marginTop: '12px', color: '#94A3B8' }}>載入中…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.error}>
          <p>⚠️ {error}</p>
          <button style={styles.retryBtn} onClick={handleRetry}>重試</button>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div style={styles.page}>
        <div style={styles.waiting}>
          <span style={styles.waitingIcon}>⏰</span>
          <p style={styles.waitingText}>目前沒有開放的題目</p>
          <p style={styles.waitingSubText}>請等待講師操作，頁面將自動更新</p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <QuestionCard
        question={question}
        onSubmit={handleSubmit}
        submitted={submitted}
        alreadyAnswered={!submitted && hasAnswered(question.id)}
      />
    </div>
  )
}
