// 🥗 食材関連のユーティリティ関数
import { FoodItem } from '@/types/food'

export interface ExpiryStatusResult {
  status: 'expired' | 'today' | 'tomorrow' | 'soon' | 'safe'
  daysUntilExpiry: number
  color: string
  urgency: 'high' | 'medium' | 'low' | 'none'
}

/**
 * 賞味期限までの日数を計算
 */
export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  
  // 時間を0に設定して日付のみで比較
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 賞味期限の状態を判定
 */
export const getExpiryStatus = (expiryDate: string): ExpiryStatusResult => {
  const days = calculateDaysUntilExpiry(expiryDate)
  
  if (days < 0) {
    return {
      status: 'expired',
      daysUntilExpiry: days,
      color: 'danger',
      urgency: 'high'
    }
  }
  
  if (days === 0) {
    return {
      status: 'today',
      daysUntilExpiry: days,
      color: 'warning',
      urgency: 'high'
    }
  }
  
  if (days === 1) {
    return {
      status: 'tomorrow',
      daysUntilExpiry: days,
      color: 'warning',
      urgency: 'medium'
    }
  }
  
  if (days <= 3) {
    return {
      status: 'soon',
      daysUntilExpiry: days,
      color: 'warning',
      urgency: 'medium'
    }
  }
  
  return {
    status: 'safe',
    daysUntilExpiry: days,
    color: 'success',
    urgency: 'none'
  }
}

/**
 * 期限切れ間近の食材をフィルタリング
 */
export const getExpiringItems = (
  items: FoodItem[], 
  withinDays: number = 3
): FoodItem[] => {
  return items.filter(item => {
    const days = calculateDaysUntilExpiry(item.expiryDate)
    return days <= withinDays
  })
}

/**
 * カテゴリ別に食材をグループ化
 */
export const groupItemsByCategory = (items: FoodItem[]): Record<string, FoodItem[]> => {
  return items.reduce((groups, item) => {
    const category = item.category || 'その他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, FoodItem[]>)
}

/**
 * 食材の合計価格を計算
 */
export const calculateTotalPrice = (items: FoodItem[]): number => {
  return items.reduce((total, item) => total + (item.price || 0), 0)
}

/**
 * 食材名の正規化（検索用）
 */
export const normalizeItemName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // 連続する空白を1つに
    .replace(/[（）()]/g, '') // 括弧を削除
}

/**
 * 食材の検索フィルタリング
 */
export const searchItems = (items: FoodItem[], query: string): FoodItem[] => {
  if (!query.trim()) return items
  
  const normalizedQuery = normalizeItemName(query)
  
  return items.filter(item => {
    const normalizedName = normalizeItemName(item.name)
    const normalizedCategory = normalizeItemName(item.category)
    
    return normalizedName.includes(normalizedQuery) || 
           normalizedCategory.includes(normalizedQuery)
  })
}

/**
 * 食材のソート
 */
export const sortItems = (
  items: FoodItem[], 
  sortBy: 'name' | 'expiryDate' | 'purchaseDate' | 'price',
  direction: 'asc' | 'desc' = 'asc'
): FoodItem[] => {
  return [...items].sort((a, b) => {
    let aValue: string | number | Date
    let bValue: string | number | Date
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'expiryDate':
      case 'purchaseDate':
        aValue = new Date(a[sortBy])
        bValue = new Date(b[sortBy])
        break
      case 'price':
        aValue = a.price || 0
        bValue = b.price || 0
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 食材データの検証
 */
export const validateFoodItem = (item: Partial<FoodItem>): string[] => {
  const errors: string[] = []
  
  if (!item.name?.trim()) {
    errors.push('食材名は必須です')
  }
  
  if (!item.category?.trim()) {
    errors.push('カテゴリは必須です')
  }
  
  if (!item.purchaseDate) {
    errors.push('購入日は必須です')
  }
  
  if (!item.expiryDate) {
    errors.push('賞味期限は必須です')
  }
  
  if (item.quantity !== undefined && item.quantity <= 0) {
    errors.push('数量は1以上である必要があります')
  }
  
  if (item.price !== undefined && item.price < 0) {
    errors.push('価格は0以上である必要があります')
  }
  
  // 日付の妥当性チェック
  if (item.purchaseDate && item.expiryDate) {
    const purchaseDate = new Date(item.purchaseDate)
    const expiryDate = new Date(item.expiryDate)
    
    if (purchaseDate > expiryDate) {
      errors.push('賞味期限は購入日より後の日付である必要があります')
    }
  }
  
  return errors
}

/**
 * カテゴリアイコンの取得
 */
export const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    '野菜': '🥬',
    '肉類': '🥩',
    '魚類': '🐟',
    '乳製品': '🥛',
    '調味料': '🧂',
    'パン・米類': '🍞',
    '冷凍食品': '🧊',
    'その他': '📦'
  }
  
  return iconMap[category] || iconMap['その他']
}