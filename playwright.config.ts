import { defineConfig, devices } from '@playwright/test';

/**
 * E2E テスト設定
 *
 * Playwrightを使用したクロスブラウザE2Eテスト
 * ローカル開発環境での実行とCI環境での実行の両方に対応
 */

export default defineConfig({
  // テストディレクトリとファイルパターン
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // タイムアウト設定
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  // レポーター設定
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // 並列実行設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 共通の設定
  use: {
    // ベースURL - ローカル開発サーバーを指す
    baseURL: 'http://localhost:5173',

    // ブラウザ操作の記録
    trace: 'on-first-retry',

    // スクリーンショット
    screenshot: 'only-on-failure',

    // ビデオ
    video: 'retain-on-failure',
  },

  // ローカル開発サーバーの自動起動設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // ブラウザ設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
