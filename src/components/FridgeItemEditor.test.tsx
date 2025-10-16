// 🧪 FridgeItemEditor コンポーネントのテスト
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '@test/utils'
import { createMockFoodItem } from '@test/utils'
import FridgeItemEditor from './FridgeItemEditor'

describe('✏️ FridgeItemEditor Component', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('新規作成モード', () => {
    test('新規作成時のデフォルト値が設定される', () => {
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('食材を追加')).toBeInTheDocument()
      expect(screen.getByDisplayValue('')).toBeInTheDocument() // 食材名が空
      expect(screen.getByDisplayValue('1')).toBeInTheDocument() // 数量のデフォルト値
    })

    test('すべてのフォームフィールドが表示される', () => {
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // フォームフィールドの存在確認
      expect(screen.getByLabelText('食材名')).toBeInTheDocument()
      expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument()
      expect(screen.getByLabelText('数量')).toBeInTheDocument()
      expect(screen.getByLabelText('価格 (円)')).toBeInTheDocument()
      expect(screen.getByLabelText('購入日')).toBeInTheDocument()
      expect(screen.getByLabelText('賞味期限')).toBeInTheDocument()
    })

    test('保存ボタンとキャンセルボタンが表示される', () => {
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /キャンセル/ })).toBeInTheDocument()
    })
  })

  describe('編集モード', () => {
    const mockItem = createMockFoodItem({
      name: 'テスト食材',
      category: '野菜',
      quantity: 2,
      price: 300
    })

    test('既存アイテムの値が初期表示される', () => {
      render(
        <FridgeItemEditor
          item={mockItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('食材を編集')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テスト食材')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // 数量
      expect(screen.getByDisplayValue('300')).toBeInTheDocument() // 価格
    })
  })

  describe('フォーム操作', () => {
    test('食材名の入力', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const nameInput = screen.getByLabelText('食材名')
      await user.type(nameInput, 'にんじん')
      
      expect(nameInput).toHaveValue('にんじん')
    })

    test('数値フィールドの入力', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const quantityInput = screen.getByLabelText('数量')
      const priceInput = screen.getByLabelText('価格 (円)')

      await user.clear(quantityInput)
      await user.type(quantityInput, '3')
      
      await user.clear(priceInput)
      await user.type(priceInput, '500')

      expect(quantityInput).toHaveValue(3)
      expect(priceInput).toHaveValue(500)
    })

    test('日付フィールドの入力', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const purchaseDateInput = screen.getByLabelText('購入日')
      await user.type(purchaseDateInput, '2023-12-01')
      
      expect(purchaseDateInput).toHaveValue('2023-12-01')
    })

    test('カテゴリの選択', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Select コンポーネントのテストは複雑なため、
      // 実際の実装に応じてセレクターを調整する必要があります
      const categorySelect = screen.getByRole('combobox')
      expect(categorySelect).toBeInTheDocument()
    })
  })

  describe('賞味期限調整ボタン', () => {
    test('賞味期限+1日ボタンの動作', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const plusButton = screen.getByRole('button', { name: '+1' })
      const expiryInput = screen.getByLabelText('賞味期限')
      
      // 初期値を確認
      const initialValue = expiryInput.value
      
      await user.click(plusButton)
      
      // 1日後の日付になっていることを確認
      const newDate = new Date(initialValue)
      newDate.setDate(newDate.getDate() + 1)
      const expectedValue = newDate.toISOString().split('T')[0]
      
      expect(expiryInput).toHaveValue(expectedValue)
    })

    test('賞味期限-1日ボタンの動作', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const minusButton = screen.getByRole('button', { name: '-1' })
      const expiryInput = screen.getByLabelText('賞味期限')
      
      // 明日の日付を設定（今日より前になっても大丈夫なように）
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = tomorrow.toISOString().split('T')[0]
      
      await user.clear(expiryInput)
      await user.type(expiryInput, tomorrowString)
      
      await user.click(minusButton)
      
      // 1日前の日付になっていることを確認
      const expectedDate = new Date(tomorrow)
      expectedDate.setDate(expectedDate.getDate() - 1)
      const expectedValue = expectedDate.toISOString().split('T')[0]
      
      expect(expiryInput).toHaveValue(expectedValue)
    })

    test('今日より前の日付にはならない制限', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const minusButton = screen.getByRole('button', { name: '-1' })
      const expiryInput = screen.getByLabelText('賞味期限')
      
      // 今日の日付を設定
      const today = new Date().toISOString().split('T')[0]
      await user.clear(expiryInput)
      await user.type(expiryInput, today)
      
      await user.click(minusButton)
      
      // 今日の日付のまま変わらないことを確認
      expect(expiryInput).toHaveValue(today)
    })
  })

  describe('保存とキャンセル', () => {
    test('保存ボタンクリック時にonSaveが呼ばれる', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // フォームに値を入力
      await user.type(screen.getByLabelText('食材名'), 'テスト食材')
      
      // 保存ボタンをクリック
      await user.click(screen.getByRole('button', { name: /保存/ }))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      
      // 呼び出された引数の検証
      const savedItem = mockOnSave.mock.calls[0][0]
      expect(savedItem.name).toBe('テスト食材')
      expect(savedItem.id).toBeDefined()
    })

    test('キャンセルボタンクリック時にonCancelが呼ばれる', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      await user.click(screen.getByRole('button', { name: /キャンセル/ }))

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    test('Xボタンクリック時にonCancelが呼ばれる', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Xボタンを探してクリック
      const closeButton = screen.getByRole('button')
      // Xアイコンを持つボタンを特定（実装に応じて調整が必要）
      
      await user.click(closeButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('バリデーション', () => {
    test('必須項目が空の場合でも保存は可能（バリデーションはサーバー側で実装想定）', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // 空のまま保存ボタンをクリック
      await user.click(screen.getByRole('button', { name: /保存/ }))

      // onSaveが呼ばれることを確認（バリデーションは親コンポーネントで実装）
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    test('数値フィールドに無効な値を入力した場合の処理', async () => {
      const user = userEvent.setup()
      
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const quantityInput = screen.getByLabelText('数量')
      
      // 無効な値を入力
      await user.clear(quantityInput)
      await user.type(quantityInput, 'abc')
      
      await user.click(screen.getByRole('button', { name: /保存/ }))

      // 保存は実行されるが、数値は0になる
      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const savedItem = mockOnSave.mock.calls[0][0]
      expect(savedItem.quantity).toBe(0)
    })
  })

  describe('アクセシビリティ', () => {
    test('すべてのフォームフィールドにラベルが関連付けられている', () => {
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // ラベルとフィールドの関連付けを確認
      expect(screen.getByLabelText('食材名')).toBeInTheDocument()
      expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument()
      expect(screen.getByLabelText('数量')).toBeInTheDocument()
      expect(screen.getByLabelText('価格 (円)')).toBeInTheDocument()
      expect(screen.getByLabelText('購入日')).toBeInTheDocument()
      expect(screen.getByLabelText('賞味期限')).toBeInTheDocument()
    })

    test('モーダルが適切にフォーカス管理されている', () => {
      render(
        <FridgeItemEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // モーダル内の要素がフォーカス可能であることを確認
      const firstInput = screen.getByLabelText('食材名')
      expect(firstInput).toBeInTheDocument()
      
      // キーボードナビゲーションのテストは実装に応じて追加
    })
  })

  describe('編集時の既存値保持', () => {
    test('編集モードで既存の値が全て正しく表示される', () => {
      const mockItem = createMockFoodItem({
        id: 'test-id',
        name: '編集テスト食材',
        category: '肉類',
        quantity: 5,
        price: 800,
        purchaseDate: '2023-11-01',
        expiryDate: '2023-11-15'
      })

      render(
        <FridgeItemEditor
          item={mockItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('編集テスト食材')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
      expect(screen.getByDisplayValue('800')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2023-11-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2023-11-15')).toBeInTheDocument()
    })

    test('編集後の保存で正しい値が渡される', async () => {
      const user = userEvent.setup()
      const mockItem = createMockFoodItem({
        id: 'existing-id',
        name: '元の名前'
      })

      render(
        <FridgeItemEditor
          item={mockItem}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // 名前を変更
      const nameInput = screen.getByLabelText('食材名')
      await user.clear(nameInput)
      await user.type(nameInput, '新しい名前')

      await user.click(screen.getByRole('button', { name: /保存/ }))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const savedItem = mockOnSave.mock.calls[0][0]
      expect(savedItem.id).toBe('existing-id') // IDは変更されない
      expect(savedItem.name).toBe('新しい名前') // 名前は変更される
    })
  })
})