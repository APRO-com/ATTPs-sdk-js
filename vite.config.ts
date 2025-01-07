import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 300000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
})
