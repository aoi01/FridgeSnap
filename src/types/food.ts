// 🥗 食材関連の型定義
export interface FoodItem {
  id: string
  name: string
  category: string
  purchaseDate: string
  expiryDate: string
  quantity: number
  price: number
  isInBasket: boolean
  image?: string
}

export interface Recipe {
  recipeId: string
  recipeTitle: string
  recipeUrl: string
  foodImageUrl: string
  recipeMaterial: string[]
  recipeIndication: string
  recipeCost: string
  recipePublishday: string
  rank: string
  matchScore?: number
  availableIngredients?: string[]
  missingIngredients?: string[]
}

export interface MonthlyData {
  month: string
  year: number
  monthNumber: number
  foodExpense: number
  livingExpense: number
  engelCoefficient: number
}

export interface CategoryMap {
  categoryId: string
  categoryName: string
  parentCategoryId?: string
}

export type ExpiryStatus = 'expired' | 'today' | 'tomorrow' | 'soon' | 'safe'
export type FoodCategory = '野菜' | '肉類' | '魚類' | '乳製品' | '調味料' | 'パン・米類' | '冷凍食品' | 'その他'
export type TabType = 'fridge' | 'basket' | 'recipes' | 'budget'