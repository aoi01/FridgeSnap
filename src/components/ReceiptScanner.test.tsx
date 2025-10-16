// 🧪 ReceiptScanner コンポーネントのAPI統合テスト
import { describe, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, userEvent, waitFor } from '@test/utils'
import { createMockFile } from '@test/utils'
import { server, mockServer } from '@test/mocks/server'
import { http, HttpResponse } from 'msw'
import ReceiptScanner from './ReceiptScanner'

// 🎭 MSW サーバーのセットアップ
beforeAll(() => {
  mockServer.start()
})

afterAll(() => {
  mockServer.stop()
})

afterEach(() => {
  mockServer.reset()
})

describe('📸 ReceiptScanner API Integration', () => {
  const mockOnItemsScanned = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Gemini API統合', () => {
    test('正常なレシート解析フロー', async () => {
      const user = userEvent.setup()
      
      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      // ファイルを選択
      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択|画像をアップロード/)
      const mockFile = createMockFile('receipt.jpg', 'image/jpeg')

      await user.upload(fileInput, mockFile)

      // ローディング状態の確認
      expect(screen.getByText(/解析中|処理中/)).toBeInTheDocument()

      // API呼び出し完了まで待機
      await waitFor(() => {
        expect(mockOnItemsScanned).toHaveBeenCalledTimes(1)
      }, { timeout: 5000 })

      // 正しいデータで呼び出されたことを確認
      const scannedItems = mockOnItemsScanned.mock.calls[0][0]
      expect(scannedItems).toHaveLength(2) // モックデータは2件
      expect(scannedItems[0]).toMatchObject({
        name: 'にんじん',
        category: '野菜',
        price: 150
      })
    })

    test('APIキーエラーのハンドリング', async () => {
      const user = userEvent.setup()

      // 無効なAPIキーのレスポンスをモック
      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.json(
              { error: { code: 401, message: 'Invalid API key' } },
              { status: 401 }
            )
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      // エラーメッセージの確認
      await waitFor(() => {
        expect(screen.getByText(/APIキー.*エラー|認証.*失敗/)).toBeInTheDocument()
      })

      // onItemsScannedが呼ばれていないことを確認
      expect(mockOnItemsScanned).not.toHaveBeenCalled()
    })

    test('レート制限エラーのハンドリング', async () => {
      const user = userEvent.setup()

      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.json(
              { error: { code: 429, message: 'Rate limit exceeded' } },
              { status: 429 }
            )
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/レート制限|しばらくお待ち/)).toBeInTheDocument()
      })
    })

    test('サーバーエラーのハンドリング', async () => {
      const user = userEvent.setup()

      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.json(
              { error: { code: 500, message: 'Internal server error' } },
              { status: 500 }
            )
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/サーバー.*エラー|処理.*失敗/)).toBeInTheDocument()
      })
    })

    test('ネットワークエラーのハンドリング', async () => {
      const user = userEvent.setup()

      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.error()
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/ネットワーク.*エラー|接続.*失敗/)).toBeInTheDocument()
      })
    })
  })

  describe('ファイルバリデーション', () => {
    test('サポートされていないファイル形式', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const invalidFile = createMockFile('document.pdf', 'application/pdf')

      await user.upload(fileInput, invalidFile)

      // エラーメッセージの確認
      expect(screen.getByText(/サポートされていない.*形式|画像ファイル.*選択/)).toBeInTheDocument()
      expect(mockOnItemsScanned).not.toHaveBeenCalled()
    })

    test('ファイルサイズが大きすぎる場合', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const largeFile = createMockFile('large-receipt.jpg', 'image/jpeg', 50 * 1024 * 1024) // 50MB

      await user.upload(fileInput, largeFile)

      expect(screen.getByText(/ファイル.*大きすぎ|サイズ.*制限/)).toBeInTheDocument()
    })
  })

  describe('カメラ機能', () => {
    test('カメラアクセス許可', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const cameraButton = screen.getByRole('button', { name: /カメラ.*使用|写真.*撮影/ })
      await user.click(cameraButton)

      // カメラビューの表示確認
      await waitFor(() => {
        expect(screen.getByTestId('mock-webcam')).toBeInTheDocument()
      })
    })

    test('カメラアクセス拒否のハンドリング', async () => {
      const user = userEvent.setup()

      // getUserMediaを失敗させる
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied'))
        }
      })

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const cameraButton = screen.getByRole('button', { name: /カメラ.*使用/ })
      await user.click(cameraButton)

      await waitFor(() => {
        expect(screen.getByText(/カメラ.*アクセス.*拒否|権限.*必要/)).toBeInTheDocument()
      })
    })
  })

  describe('レスポンスデータの解析', () => {
    test('不正なJSONレスポンスのハンドリング', async () => {
      const user = userEvent.setup()

      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.json({
              candidates: [{
                content: {
                  parts: [{
                    text: 'invalid json format'
                  }]
                }
              }]
            })
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/解析.*失敗|データ.*解析.*エラー/)).toBeInTheDocument()
      })
    })

    test('空のレスポンスのハンドリング', async () => {
      const user = userEvent.setup()

      mockServer.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          () => {
            return HttpResponse.json({
              candidates: [{
                content: {
                  parts: [{
                    text: JSON.stringify([])
                  }]
                }
              }]
            })
          }
        )
      )

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/食品.*見つかりません|解析.*結果.*なし/)).toBeInTheDocument()
      })
    })
  })

  describe('ユーザーインターフェース', () => {
    test('キャンセルボタンの動作', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /キャンセル|閉じる/ })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    test('処理中はボタンが無効化される', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      // 処理中はファイル選択が無効化される
      expect(fileInput).toBeDisabled()
    })
  })

  describe('Base64変換', () => {
    test('ファイルのBase64変換が正常に動作', async () => {
      const user = userEvent.setup()

      render(
        <ReceiptScanner
          onItemsScanned={mockOnItemsScanned}
          onCancel={mockOnCancel}
        />
      )

      const fileInput = screen.getByTestId('file-input') || screen.getByLabelText(/ファイルを選択/)
      const mockFile = createMockFile()

      await user.upload(fileInput, mockFile)

      // Base64変換が実行されることを間接的に確認
      // （APIが呼ばれることで変換が成功したと判断）
      await waitFor(() => {
        expect(mockOnItemsScanned).toHaveBeenCalledTimes(1)
      })
    })
  })
})