// 使用 HashRouter：GitHub Pages 等靜態託管不支援 SPA 伺服器端 fallback，
// HashRouter 以 #/teacher 形式運作，重新整理或直接開啟子路徑都不會 404。
import { HashRouter as BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import StudentPage from './pages/StudentPage.jsx'
import TeacherPage from './pages/TeacherPage.jsx'

const navStyle = {
  background: '#1E293B',
  color: '#fff',
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
}
const linkStyle = { color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }
const activeLinkStyle = { color: '#60A5FA', fontWeight: '600' }

export default function App() {
  return (
    <BrowserRouter>
      <nav style={navStyle}>
        <span style={{ fontWeight: '700', fontSize: '16px', marginRight: '8px' }}>
          🤖 AI 小測驗
        </span>
        <Link
          to="/"
          style={linkStyle}
          onClick={e => {
            if (window.location.pathname === '/') e.preventDefault()
          }}
        >
          學員頁
        </Link>
        <Link to="/teacher" style={linkStyle}>
          講師後台
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<StudentPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </BrowserRouter>
  )
}
