import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 子路徑設定：對應 repo 名稱 ai-quiz-app
  // 本機開發（npm run dev）不受影響；打包後資源路徑自動加前綴。
  base: '/ai-quiz-app/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
