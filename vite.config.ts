/// <reference types="vitest" />
import { defineConfig } from 'vite'
import angular from '@analogjs/vite-plugin-angular'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => ({
  plugins: [angular(), viteTsConfigPaths()],
  test: {
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'istanbul',
      include: ['src/app/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/test-setup.ts'],
    },
  },
}))
