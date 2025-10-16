// 🧪 テストユーティリティ集
import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'

// 🏗️ テスト用プロバイダーのラッパー
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
  queryClient?: QueryClient
}

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })
}

const AllTheProviders = ({ 
  children, 
  initialRoute = '/',
  queryClient = createTestQueryClient()
}: {
  children: React.ReactNode
  initialRoute?: string
  queryClient?: QueryClient
}) => {
  // テスト用の履歴を初期化
  window.history.pushState({}, 'Test page', initialRoute)
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {children}
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

// 🎭 カスタムレンダー関数
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialRoute, queryClient, ...renderOptions } = options
  
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders 
        {...props} 
        initialRoute={initialRoute}
        queryClient={queryClient}
      />
    ),
    ...renderOptions,
  })
}

// 🧪 テストデータファクトリー
export const createMockFoodItem = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'テスト食材',
  category: '野菜',
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  quantity: 1,
  price: 100,
  isInBasket: false,
  ...overrides
})

export const createMockFoodItems = (count: number = 3) => {
  return Array.from({ length: count }, (_, index) => 
    createMockFoodItem({
      id: `test-item-${index}`,
      name: `テスト食材 ${index + 1}`,
      price: (index + 1) * 100
    })
  )
}

export const createExpiredFoodItem = (overrides = {}) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return createMockFoodItem({
    name: '期限切れ食材',
    expiryDate: yesterday.toISOString().split('T')[0],
    ...overrides
  })
}

export const createExpiringFoodItem = (daysUntilExpiry: number = 1, overrides = {}) => {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry)
  
  return createMockFoodItem({
    name: `${daysUntilExpiry}日後期限切れ食材`,
    expiryDate: expiryDate.toISOString().split('T')[0],
    ...overrides
  })
}

// 🎯 イベントヘルパー
export const simulateFileUpload = (input: HTMLInputElement, file: File) => {
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    [Symbol.iterator]: function* () {
      yield file
    }
  } as FileList

  Object.defineProperty(input, 'files', {
    value: fileList,
    writable: false,
  })

  const event = new Event('change', { bubbles: true })
  input.dispatchEvent(event)
}

export const createMockFile = (
  name: string = 'test-receipt.jpg',
  type: string = 'image/jpeg',
  size: number = 1024
): File => {
  const blob = new Blob(['mock file content'], { type })
  return new File([blob], name, { type, lastModified: Date.now() })
}

// 📅 日付ヘルパー
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// 💾 LocalStorage モック
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
}

// 🌐 API モックヘルパー
export const createMockApiResponse = <T>(data: T, delay: number = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const createMockApiError = (message: string = 'API Error', delay: number = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

// 🔍 カスタムマッチャー
export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

// 📊 デバッグヘルパー
export const debugRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const result = customRender(ui, options)
  result.debug()
  return result
}

// 🎯 非同期テストヘルパー
export const waitForLoadingToFinish = async () => {
  const { findByText } = await import('@testing-library/react')
  // ローディング表示が消えるまで待機
  try {
    await findByText('読み込み中...', {}, { timeout: 100 })
    // ローディングが見つかった場合、消えるまで待つ
    await new Promise(resolve => setTimeout(resolve, 50))
  } catch {
    // ローディングが見つからない場合は何もしない
  }
}

// 🧪 テストIDセレクター
export const testIds = {
  // メインページ
  mainContainer: 'main-container',
  navigationTabs: 'navigation-tabs',
  
  // 冷蔵庫
  fridgeGrid: 'fridge-grid',
  foodItemCard: 'food-item-card',
  categoryHeader: 'category-header',
  
  // レシートスキャナー
  receiptScanner: 'receipt-scanner',
  cameraView: 'camera-view',
  fileInput: 'file-input',
  
  // 今日のバスケット
  todayBasket: 'today-basket',
  basketItem: 'basket-item',
  
  // 家計簿
  budgetOverview: 'budget-overview',
  budgetChart: 'budget-chart',
  purchaseHistory: 'purchase-history',
  
  // モーダル
  modal: 'modal',
  modalClose: 'modal-close',
  
  // フォーム
  formField: 'form-field',
  submitButton: 'submit-button',
  cancelButton: 'cancel-button'
} as const

// re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { customRender as render }