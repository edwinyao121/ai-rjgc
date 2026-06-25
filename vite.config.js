import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/target/**',
        '**/logs/**',
        '**/*.log',
        '**/.idea/**',
        '**/.vscode/**',
        '**/tmp/**',
        '**/temp/**',
        '**/coverage/**',
        '**/.runtime/**'
      ]
    },
    proxy: {
      '/api': 'http://127.0.0.1:3100'
    }
  }
})
