/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 🧪 テスト実行環境の設定
    environment: 'jsdom',
    
    // 🔧 セットアップファイル
    setupFiles: ['./src/test/setup.ts'],
    
    // 📊 カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/**/*.config.*',
        'src/**/*.type.ts',
        'dist/',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // 🌐 グローバル設定
    globals: true,
    
    // 📁 パスエイリアス
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    },
    
    // ⏱️ タイムアウト設定
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 🔄 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // 📝 レポーター設定
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './coverage/index.html'
    }
  },
  
  // 🔗 Vite設定の継承
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
})