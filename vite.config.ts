import { defineConfig } from 'vite'

// cors: パッケージ版（別オリジン）から meal.json を読めるようにする
export default defineConfig({
  server: { host: true, port: 5174, cors: true },
  build: { target: 'esnext' },
})
