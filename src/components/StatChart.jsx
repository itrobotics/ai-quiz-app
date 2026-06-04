const OPTIONS = ['A', 'B', 'C', 'D']
const COLORS = { A: '#3B82F6', B: '#10B981', C: '#F59E0B', D: '#EF4444' }

const styles = {
  container: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
  },
  total: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '20px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '12px',
  },
  label: {
    width: '20px',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#374151',
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    background: '#F1F5F9',
    borderRadius: '6px',
    height: '28px',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: (pct, color) => ({
    height: '100%',
    width: `${pct}%`,
    background: color,
    borderRadius: '6px',
    transition: 'width 0.4s ease',
    minWidth: pct > 0 ? '4px' : '0',
  }),
  count: {
    width: '50px',
    textAlign: 'right',
    fontSize: '0.875rem',
    color: '#374151',
    flexShrink: 0,
  },
  pct: {
    width: '42px',
    textAlign: 'right',
    fontSize: '0.8rem',
    color: '#94A3B8',
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: '24px 0',
    fontSize: '0.9rem',
  },
}

/**
 * StatChart — 答題統計長條圖
 *
 * Props:
 *   stats     {Object|null} - { total, A, B, C, D }
 *   question  {Object|null} - 題目物件（用於顯示正確答案）
 *   lastUpdated {string}    - 最後更新時間字串
 */
export default function StatChart({ stats, question, lastUpdated }) {
  const total = stats?.total || 0

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={styles.title}>📊 即時統計</p>
        {lastUpdated && (
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            更新：{lastUpdated}
          </span>
        )}
      </div>
      <p style={styles.total}>總作答人數：<strong>{total}</strong> 人</p>

      {total === 0 ? (
        <p style={styles.empty}>尚無學員作答</p>
      ) : (
        OPTIONS.map(opt => {
          const count = stats?.[opt] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const isCorrect = question?.correctAnswer === opt
          return (
            <div key={opt} style={styles.barRow}>
              <span style={{ ...styles.label, color: COLORS[opt] }}>
                {opt}{isCorrect ? ' ✓' : ''}
              </span>
              <div style={styles.barTrack}>
                <div style={styles.barFill(pct, COLORS[opt])} />
              </div>
              <span style={styles.count}>{count} 票</span>
              <span style={styles.pct}>{pct}%</span>
            </div>
          )
        })
      )}

      {question?.correctAnswer && (
        <p style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '16px' }}>
          ✅ 正確答案：{question.correctAnswer}（{question[`option${question.correctAnswer}`]}）
        </p>
      )}
    </div>
  )
}
