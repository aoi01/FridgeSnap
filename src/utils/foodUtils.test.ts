// 🧪 食材ユーティリティ関数のテスト
import { describe, test, expect, beforeEach } from 'vitest'
import { 
  calculateDaysUntilExpiry,
  getExpiryStatus,
  getExpiringItems,
  groupItemsByCategory,
  calculateTotalPrice,
  normalizeItemName,
  searchItems,
  sortItems,
  validateFoodItem,
  getCategoryIcon
} from './foodUtils'
import { createMockFoodItem, createMockFoodItems, formatDateForInput, addDays } from '@test/utils'

describe('🥗 Food Utils', () => {
  describe('calculateDaysUntilExpiry', () => {
    test('今日の日付の場合', () => {
      const today = formatDateForInput(new Date())
      expect(calculateDaysUntilExpiry(today)).toBe(0)
    })

    test('明日の日付の場合', () => {
      const tomorrow = formatDateForInput(addDays(new Date(), 1))
      expect(calculateDaysUntilExpiry(tomorrow)).toBe(1)
    })

    test('昨日の日付の場合（期限切れ）', () => {
      const yesterday = formatDateForInput(addDays(new Date(), -1))
      expect(calculateDaysUntilExpiry(yesterday)).toBe(-1)
    })

    test('1週間後の日付', () => {
      const nextWeek = formatDateForInput(addDays(new Date(), 7))
      expect(calculateDaysUntilExpiry(nextWeek)).toBe(7)
    })
  })

  describe('getExpiryStatus', () => {
    test('期限切れの食材', () => {
      const yesterday = formatDateForInput(addDays(new Date(), -1))
      const status = getExpiryStatus(yesterday)
      
      expect(status.status).toBe('expired')
      expect(status.urgency).toBe('high')
      expect(status.color).toBe('danger')
      expect(status.daysUntilExpiry).toBe(-1)
    })

    test('今日期限切れの食材', () => {
      const today = formatDateForInput(new Date())
      const status = getExpiryStatus(today)
      
      expect(status.status).toBe('today')
      expect(status.urgency).toBe('high')
      expect(status.color).toBe('warning')
    })

    test('明日期限切れの食材', () => {
      const tomorrow = formatDateForInput(addDays(new Date(), 1))
      const status = getExpiryStatus(tomorrow)
      
      expect(status.status).toBe('tomorrow')
      expect(status.urgency).toBe('medium')
      expect(status.color).toBe('warning')
    })

    test('3日後期限切れの食材（soon）', () => {
      const threeDays = formatDateForInput(addDays(new Date(), 3))
      const status = getExpiryStatus(threeDays)
      
      expect(status.status).toBe('soon')
      expect(status.urgency).toBe('medium')
    })

    test('1週間後期限切れの食材（safe）', () => {
      const nextWeek = formatDateForInput(addDays(new Date(), 7))
      const status = getExpiryStatus(nextWeek)
      
      expect(status.status).toBe('safe')
      expect(status.urgency).toBe('none')
      expect(status.color).toBe('success')
    })
  })

  describe('getExpiringItems', () => {
    let mockItems: any[]

    beforeEach(() => {
      mockItems = [
        createMockFoodItem({ 
          id: '1', 
          name: '期限切れ食材',
          expiryDate: formatDateForInput(addDays(new Date(), -1))
        }),
        createMockFoodItem({ 
          id: '2', 
          name: '今日期限切れ',
          expiryDate: formatDateForInput(new Date())
        }),
        createMockFoodItem({ 
          id: '3', 
          name: '明日期限切れ',
          expiryDate: formatDateForInput(addDays(new Date(), 1))
        }),
        createMockFoodItem({ 
          id: '4', 
          name: '3日後期限切れ',
          expiryDate: formatDateForInput(addDays(new Date(), 3))
        }),
        createMockFoodItem({ 
          id: '5', 
          name: '1週間後期限切れ',
          expiryDate: formatDateForInput(addDays(new Date(), 7))
        })
      ]
    })

    test('デフォルト（3日以内）の期限切れ間近食材を取得', () => {
      const expiringItems = getExpiringItems(mockItems)
      expect(expiringItems).toHaveLength(4) // -1, 0, 1, 3日
    })

    test('1日以内の期限切れ間近食材を取得', () => {
      const expiringItems = getExpiringItems(mockItems, 1)
      expect(expiringItems).toHaveLength(3) // -1, 0, 1日
    })

    test('期限切れ間近の食材がない場合', () => {
      const safeItems = [
        createMockFoodItem({ 
          expiryDate: formatDateForInput(addDays(new Date(), 7))
        })
      ]
      const expiringItems = getExpiringItems(safeItems)
      expect(expiringItems).toHaveLength(0)
    })
  })

  describe('groupItemsByCategory', () => {
    test('カテゴリ別にグループ化', () => {
      const items = [
        createMockFoodItem({ category: '野菜', name: 'にんじん' }),
        createMockFoodItem({ category: '野菜', name: 'たまねぎ' }),
        createMockFoodItem({ category: '肉類', name: '牛肉' }),
        createMockFoodItem({ category: '肉類', name: '豚肉' })
      ]

      const grouped = groupItemsByCategory(items)
      
      expect(grouped['野菜']).toHaveLength(2)
      expect(grouped['肉類']).toHaveLength(2)
      expect(grouped['野菜'][0].name).toBe('にんじん')
    })

    test('カテゴリが未設定の場合は「その他」に分類', () => {
      const items = [
        createMockFoodItem({ category: '', name: 'アイテム1' }),
        createMockFoodItem({ category: undefined as any, name: 'アイテム2' })
      ]

      const grouped = groupItemsByCategory(items)
      expect(grouped['その他']).toHaveLength(2)
    })
  })

  describe('calculateTotalPrice', () => {
    test('複数食材の合計価格を計算', () => {
      const items = [
        createMockFoodItem({ price: 100 }),
        createMockFoodItem({ price: 200 }),
        createMockFoodItem({ price: 300 })
      ]

      expect(calculateTotalPrice(items)).toBe(600)
    })

    test('価格が未設定の食材を含む場合', () => {
      const items = [
        createMockFoodItem({ price: 100 }),
        createMockFoodItem({ price: undefined as any }),
        createMockFoodItem({ price: 200 })
      ]

      expect(calculateTotalPrice(items)).toBe(300)
    })

    test('空の配列の場合', () => {
      expect(calculateTotalPrice([])).toBe(0)
    })
  })

  describe('normalizeItemName', () => {
    test('基本的な正規化', () => {
      expect(normalizeItemName('  テスト食材  ')).toBe('テスト食材')
      expect(normalizeItemName('APPLE')).toBe('apple')
    })

    test('括弧の削除', () => {
      expect(normalizeItemName('りんご（赤）')).toBe('りんご')
      expect(normalizeItemName('tomato(large)')).toBe('tomato')
    })

    test('連続する空白の処理', () => {
      expect(normalizeItemName('test   item')).toBe('test item')
    })
  })

  describe('searchItems', () => {
    let items: any[]

    beforeEach(() => {
      items = [
        createMockFoodItem({ name: 'りんご', category: '果物' }),
        createMockFoodItem({ name: 'にんじん', category: '野菜' }),
        createMockFoodItem({ name: 'Apple', category: 'Fruit' }),
        createMockFoodItem({ name: 'トマト（大）', category: '野菜' })
      ]
    })

    test('名前での検索', () => {
      const results = searchItems(items, 'りんご')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('りんご')
    })

    test('カテゴリでの検索', () => {
      const results = searchItems(items, '野菜')
      expect(results).toHaveLength(2)
    })

    test('大文字小文字を無視した検索', () => {
      const results = searchItems(items, 'apple')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Apple')
    })

    test('括弧を無視した検索', () => {
      const results = searchItems(items, 'トマト')
      expect(results).toHaveLength(1)
    })

    test('空のクエリの場合は全件返却', () => {
      const results = searchItems(items, '')
      expect(results).toHaveLength(4)
    })

    test('該当なしの場合', () => {
      const results = searchItems(items, '存在しない食材')
      expect(results).toHaveLength(0)
    })
  })

  describe('sortItems', () => {
    let items: any[]

    beforeEach(() => {
      items = [
        createMockFoodItem({ 
          name: 'C商品', 
          price: 300,
          purchaseDate: '2023-01-03',
          expiryDate: '2023-01-13'
        }),
        createMockFoodItem({ 
          name: 'A商品', 
          price: 100,
          purchaseDate: '2023-01-01',
          expiryDate: '2023-01-11'
        }),
        createMockFoodItem({ 
          name: 'B商品', 
          price: 200,
          purchaseDate: '2023-01-02',
          expiryDate: '2023-01-12'
        })
      ]
    })

    test('名前での昇順ソート', () => {
      const sorted = sortItems(items, 'name', 'asc')
      expect(sorted.map(item => item.name)).toEqual(['A商品', 'B商品', 'C商品'])
    })

    test('名前での降順ソート', () => {
      const sorted = sortItems(items, 'name', 'desc')
      expect(sorted.map(item => item.name)).toEqual(['C商品', 'B商品', 'A商品'])
    })

    test('価格での昇順ソート', () => {
      const sorted = sortItems(items, 'price', 'asc')
      expect(sorted.map(item => item.price)).toEqual([100, 200, 300])
    })

    test('購入日での昇順ソート', () => {
      const sorted = sortItems(items, 'purchaseDate', 'asc')
      expect(sorted.map(item => item.purchaseDate)).toEqual(['2023-01-01', '2023-01-02', '2023-01-03'])
    })

    test('賞味期限での昇順ソート', () => {
      const sorted = sortItems(items, 'expiryDate', 'asc')
      expect(sorted.map(item => item.expiryDate)).toEqual(['2023-01-11', '2023-01-12', '2023-01-13'])
    })

    test('元の配列は変更されない', () => {
      const originalOrder = items.map(item => item.name)
      sortItems(items, 'name', 'asc')
      expect(items.map(item => item.name)).toEqual(originalOrder)
    })
  })

  describe('validateFoodItem', () => {
    test('有効な食材データ', () => {
      const validItem = createMockFoodItem()
      const errors = validateFoodItem(validItem)
      expect(errors).toHaveLength(0)
    })

    test('必須項目の検証', () => {
      const invalidItem = {
        name: '',
        category: '',
        purchaseDate: '',
        expiryDate: ''
      }
      
      const errors = validateFoodItem(invalidItem)
      expect(errors).toContain('食材名は必須です')
      expect(errors).toContain('カテゴリは必須です')
      expect(errors).toContain('購入日は必須です')
      expect(errors).toContain('賞味期限は必須です')
    })

    test('数量の検証', () => {
      const itemWithInvalidQuantity = createMockFoodItem({ quantity: 0 })
      const errors = validateFoodItem(itemWithInvalidQuantity)
      expect(errors).toContain('数量は1以上である必要があります')
    })

    test('価格の検証', () => {
      const itemWithInvalidPrice = createMockFoodItem({ price: -100 })
      const errors = validateFoodItem(itemWithInvalidPrice)
      expect(errors).toContain('価格は0以上である必要があります')
    })

    test('日付の論理的妥当性検証', () => {
      const itemWithInvalidDates = createMockFoodItem({
        purchaseDate: '2023-01-10',
        expiryDate: '2023-01-05' // 購入日より前
      })
      
      const errors = validateFoodItem(itemWithInvalidDates)
      expect(errors).toContain('賞味期限は購入日より後の日付である必要があります')
    })
  })

  describe('getCategoryIcon', () => {
    test('既知のカテゴリのアイコン取得', () => {
      expect(getCategoryIcon('野菜')).toBe('🥬')
      expect(getCategoryIcon('肉類')).toBe('🥩')
      expect(getCategoryIcon('魚類')).toBe('🐟')
      expect(getCategoryIcon('乳製品')).toBe('🥛')
    })

    test('未知のカテゴリの場合はデフォルトアイコン', () => {
      expect(getCategoryIcon('未知のカテゴリ')).toBe('📦')
      expect(getCategoryIcon('')).toBe('📦')
    })
  })
})