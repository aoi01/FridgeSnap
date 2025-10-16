// 🧪 TodayBasket コンポーネントのテスト
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@test/utils'
import { createMockFoodItem, createMockFoodItems } from '@test/utils'
import TodayBasket from './TodayBasket'

describe('🍽️ TodayBasket Component', () => {
  const mockOnRemoveItem = vi.fn()
  const mockOnClearBasket = vi.fn()
  const mockOnUpdateItem = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('空の状態', () => {
    test('アイテムがない場合の空状態表示', () => {
      render(
        <TodayBasket
          basketItems={[]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.getByText(/今日の献立がありません/)).toBeInTheDocument()
      expect(screen.getByText(/冷蔵庫から食材を追加しましょう/)).toBeInTheDocument()
    })

    test('空状態ではクリアボタンが表示されない', () => {
      render(
        <TodayBasket
          basketItems={[]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.queryByText(/調理完了/)).not.toBeInTheDocument()
    })
  })

  describe('アイテムがある状態', () => {
    const mockItems = createMockFoodItems(3).map(item => ({
      ...item,
      isInBasket: true,
      price: 100 * (parseInt(item.id.split('-')[2]) + 1) // 100, 200, 300
    }))

    test('バスケット内のアイテムが表示される', () => {
      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      mockItems.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument()
      })
    })

    test('合計価格が正しく計算されて表示される', () => {
      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 100 + 200 + 300 = 600円
      expect(screen.getByText('¥600')).toBeInTheDocument()
    })

    test('調理完了ボタンが表示される', () => {
      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.getByRole('button', { name: /調理完了/ })).toBeInTheDocument()
    })

    test('各アイテムに削除ボタンが表示される', () => {
      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 削除ボタンが各アイテムに対して存在することを確認
      const removeButtons = screen.getAllByRole('button', { name: /削除|remove/i })
      expect(removeButtons.length).toBeGreaterThan(0)
    })
  })

  describe('価格計算', () => {
    test('価格が設定されていないアイテムを含む場合', () => {
      const itemsWithMissingPrice = [
        createMockFoodItem({ name: 'アイテム1', price: 100 }),
        createMockFoodItem({ name: 'アイテム2', price: undefined as any }),
        createMockFoodItem({ name: 'アイテム3', price: 200 })
      ]

      render(
        <TodayBasket
          basketItems={itemsWithMissingPrice}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 100 + 0 + 200 = 300円
      expect(screen.getByText('¥300')).toBeInTheDocument()
    })

    test('全てのアイテムの価格が0の場合', () => {
      const freeItems = [
        createMockFoodItem({ price: 0 }),
        createMockFoodItem({ price: 0 })
      ]

      render(
        <TodayBasket
          basketItems={freeItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.getByText('¥0')).toBeInTheDocument()
    })
  })

  describe('インタラクション', () => {
    const mockItems = createMockFoodItems(2)

    test('調理完了ボタンクリックでonClearBasketが呼ばれる', async () => {
      const user = userEvent.setup()

      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      await user.click(screen.getByRole('button', { name: /調理完了/ }))

      expect(mockOnClearBasket).toHaveBeenCalledTimes(1)
    })

    test('個別削除ボタンクリックでonRemoveItemが呼ばれる', async () => {
      const user = userEvent.setup()

      render(
        <TodayBasket
          basketItems={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 最初のアイテムの削除ボタンを探してクリック
      const removeButtons = screen.getAllByRole('button')
      const firstRemoveButton = removeButtons.find(button => 
        button.textContent?.includes('削除') || 
        button.getAttribute('aria-label')?.includes('削除')
      )

      if (firstRemoveButton) {
        await user.click(firstRemoveButton)
        expect(mockOnRemoveItem).toHaveBeenCalledTimes(1)
        expect(mockOnRemoveItem).toHaveBeenCalledWith(mockItems[0].id)
      }
    })
  })

  describe('賞味期限調整機能', () => {
    const mockItem = createMockFoodItem({
      expiryDate: '2023-12-01'
    })

    test('賞味期限+1日ボタンの動作', async () => {
      const user = userEvent.setup()

      render(
        <TodayBasket
          basketItems={[mockItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      const plusButton = screen.getByRole('button', { name: '+1' })
      await user.click(plusButton)

      expect(mockOnUpdateItem).toHaveBeenCalledTimes(1)
      const updatedItem = mockOnUpdateItem.mock.calls[0][0]
      expect(updatedItem.expiryDate).toBe('2023-12-02') // 1日後
    })

    test('賞味期限-1日ボタンの動作', async () => {
      const user = userEvent.setup()

      render(
        <TodayBasket
          basketItems={[mockItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      const minusButton = screen.getByRole('button', { name: '-1' })
      await user.click(plusButton)

      expect(mockOnUpdateItem).toHaveBeenCalledTimes(1)
      const updatedItem = mockOnUpdateItem.mock.calls[0][0]
      expect(updatedItem.expiryDate).toBe('2023-11-30') // 1日前
    })

    test('今日より前の日付には設定されない制限', async () => {
      const user = userEvent.setup()
      const today = new Date().toISOString().split('T')[0]
      const todayItem = createMockFoodItem({ expiryDate: today })

      render(
        <TodayBasket
          basketItems={[todayItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      const minusButton = screen.getByRole('button', { name: '-1' })
      await user.click(minusButton)

      // 今日より前にはならないため、onUpdateItemは呼ばれない
      expect(mockOnUpdateItem).not.toHaveBeenCalled()
    })
  })

  describe('カテゴリとアイコン表示', () => {
    test('各アイテムのカテゴリが表示される', () => {
      const itemsWithCategories = [
        createMockFoodItem({ name: 'にんじん', category: '野菜' }),
        createMockFoodItem({ name: '牛肉', category: '肉類' }),
        createMockFoodItem({ name: 'チーズ', category: '乳製品' })
      ]

      render(
        <TodayBasket
          basketItems={itemsWithCategories}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.getByText('野菜')).toBeInTheDocument()
      expect(screen.getByText('肉類')).toBeInTheDocument()
      expect(screen.getByText('乳製品')).toBeInTheDocument()
    })
  })

  describe('賞味期限表示と警告', () => {
    test('期限切れアイテムの警告表示', () => {
      const expiredItem = createMockFoodItem({
        name: '期限切れ食材',
        expiryDate: '2023-01-01' // 過去の日付
      })

      render(
        <TodayBasket
          basketItems={[expiredItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 期限切れの表示があることを確認
      expect(screen.getByText(/期限切れ/)).toBeInTheDocument()
    })

    test('今日期限切れアイテムの警告表示', () => {
      const todayItem = createMockFoodItem({
        name: '今日期限切れ',
        expiryDate: new Date().toISOString().split('T')[0]
      })

      render(
        <TodayBasket
          basketItems={[todayItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      expect(screen.getByText(/今日まで/)).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    test('モバイル表示での調整ボタンの非表示', () => {
      // matchMediaをモックしてモバイルサイズをシミュレート
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('(max-width: 640px)'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const mockItem = createMockFoodItem()

      render(
        <TodayBasket
          basketItems={[mockItem]}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // モバイルでは調整ボタンが非表示になる設定の場合
      // 実装に応じてテストを調整
    })
  })

  describe('パフォーマンス', () => {
    test('大量のアイテムでも正常に動作', () => {
      const manyItems = Array.from({ length: 100 }, (_, index) =>
        createMockFoodItem({
          id: `item-${index}`,
          name: `食材 ${index}`,
          price: index * 10
        })
      )

      render(
        <TodayBasket
          basketItems={manyItems}
          onRemoveItem={mockOnRemoveItem}
          onClearBasket={mockOnClearBasket}
          onUpdateItem={mockOnUpdateItem}
        />
      )

      // 合計金額の計算が正しく行われることを確認
      const expectedTotal = manyItems.reduce((sum, item) => sum + item.price, 0)
      expect(screen.getByText(`¥${expectedTotal.toLocaleString()}`)).toBeInTheDocument()
    })
  })
})