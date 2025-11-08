// 🧪 Kitchen Sensei Go - テストセットアップ
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import React from 'react'
import { mockServer } from './mocks/server'

// 🗑️ 各テスト後のクリーンアップ
afterEach(() => {
  cleanup()
  // LocalStorageのクリーンアップ
  localStorage.clear()
  sessionStorage.clear()
  // モックのリセット
  vi.clearAllMocks()
})

// 🌐 グローバルモック設定
beforeAll(() => {
  // 🔊 Console API のモック（テスト出力をクリーンに）
  Object.defineProperty(window, 'console', {
    value: {
      ...console,
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn()
    }
  })

  // 📍 Location API のモック
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn()
    },
    writable: true
  })

  // 🖥️ MatchMedia API のモック（レスポンシブテスト用）
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // 🎯 IntersectionObserver のモック
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // 📐 ResizeObserver のモック
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // 📱 WebRTC/Camera API のモック
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }]
      })
    }
  })

  // 🔐 Crypto API のモック
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
    }
  })
})

afterAll(() => {
  // 🧹 テストスイート終了後のクリーンアップ
  vi.restoreAllMocks()
})

// 🎭 MSWサーバーのグローバルセットアップ
beforeAll(() => {
  mockServer.start()
})

afterAll(() => {
  mockServer.stop()
})

// 🌍 環境変数のモック
vi.mock('import.meta', () => ({
  env: {
    VITE_GEMINI_API_KEY: 'test-gemini-key',
    VITE_RAKUTEN_API_KEY: 'test-rakuten-key',
    DEV: true,
    VITE_DEBUG_MODE: 'true'
  }
}))

// 🎭 外部ライブラリのモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// 📊 Recharts のモック（チャートテスト用）
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
  Line: () => React.createElement('div', { 'data-testid': 'line' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  ReferenceLine: () => React.createElement('div', { 'data-testid': 'reference-line' }),
  Legend: () => React.createElement('div', { 'data-testid': 'legend' })
}))

// 📸 React Webcam のモック
vi.mock('react-webcam', () => ({
  default: vi.fn(({ onUserMedia, onUserMediaError }) => {
    // モックのWebcamコンポーネント
    return React.createElement(
      'div',
      {
        'data-testid': 'mock-webcam',
        onClick: () => onUserMedia && onUserMedia()
      },
      'Mock Webcam'
    )
  })
}))

// 🎨 Lucide React アイコンのモック
vi.mock('lucide-react', () => {
  const MockIcon = ({ 'data-testid': testId, ...props }: any) =>
    React.createElement('div', { 'data-testid': testId || 'mock-icon', ...props })

  return {
    Save: MockIcon,
    X: MockIcon,
    Calendar: MockIcon,
    Camera: MockIcon,
    Wallet: MockIcon,
    TrendingUp: MockIcon,
    Receipt: MockIcon,
    Calculator: MockIcon,
    Warning: MockIcon,
    Restaurant: MockIcon,
    Basket: MockIcon,
    Search: MockIcon,
    Snow: MockIcon,
    Create: MockIcon,
    Trash: MockIcon,
    Lightbulb: MockIcon,
    CheckCircle: MockIcon
  }
})