/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // グローバルAPIの有効化（describe, it, expectなどをインポートなしで使用可能）
    globals: true,

    // テスト対象のファイルパターン
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', 'test/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // 型テストの設定
    typecheck: {
      enabled: true,
      include: ['**/*.test-d.ts'],
    },

    // カバレッジの設定
    coverage: {
      provider: 'v8', // V8カバレッジプロバイダーを使用
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'], // カバレッジ対象
      exclude: ['**/*.test.ts', '**/*.test-d.ts'], // カバレッジから除外
    },

    // テスト環境
    environment: 'node',
  },
})