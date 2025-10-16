// 🎭 MSW サーバー設定
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 🔧 テスト用のモックサーバーを作成
export const server = setupServer(...handlers)

// 🎯 サーバー制御ヘルパー
export const mockServer = {
  // サーバー開始
  start: () => {
    server.listen({
      onUnhandledRequest: 'warn' // ハンドルされていないリクエストを警告
    })
  },

  // サーバー停止
  stop: () => {
    server.close()
  },

  // リクエストハンドラーのリセット
  reset: () => {
    server.resetHandlers()
  },

  // 一時的なハンドラーの使用
  use: (...handlers: any[]) => {
    server.use(...handlers)
  },

  // すべてのハンドラーをリセットして新しいものを設定
  resetWithHandlers: (...handlers: any[]) => {
    server.resetHandlers(...handlers)
  }
}

// 🔍 デバッグ用のリクエストログ
export const enableRequestLogging = () => {
  server.events.on('request:start', ({ request }) => {
    console.log('🌐 MSW Request:', request.method, request.url)
  })

  server.events.on('request:match', ({ request }) => {
    console.log('✅ MSW Matched:', request.method, request.url)
  })

  server.events.on('request:unhandled', ({ request }) => {
    console.log('❌ MSW Unhandled:', request.method, request.url)
  })
}

// 🚫 リクエストログの無効化
export const disableRequestLogging = () => {
  server.events.removeAllListeners()
}