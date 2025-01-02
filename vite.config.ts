import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 30000,
    env: config({ path: '.env' }).parsed,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
})
