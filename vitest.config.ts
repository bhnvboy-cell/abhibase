import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/api/**/*.ts', 'lib/**/*.ts'],
      exclude: ['node_modules', 'tests']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
})
