/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // VITE_API_BASE_URL을 비워 두면 /api로 요청하고, 여기서 백엔드로 넘긴다
    proxy: { '/api': 'http://localhost:8000' },
  },
  build: {
    // Node 24.12의 fs.rmSync가 한글이 든 Windows 경로(…\넥스트허브\…)에서 0xC0000409로 죽는다(2026-10-29 확인).
    // Vite의 출력 폴더 비우기도 rmSync를 써서 같이 죽으므로 끄고, package.json의 prebuild가 비동기 fs.rm으로 대신 비운다.
    emptyOutDir: false,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
