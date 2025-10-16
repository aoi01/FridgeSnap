// 🎭 API モックハンドラー定義
import { http, HttpResponse } from 'msw'

// 🤖 Gemini API のモックレスポンス
const createGeminiResponse = (items: any[]) => ({
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify(items)
      }]
    }
  }]
})

// 🍳 楽天レシピAPI のモックレスポンス
const createRakutenRecipeResponse = (recipes: any[]) => ({
  result: recipes.map((recipe, index) => ({
    recipeId: `recipe-${index + 1}`,
    recipeTitle: recipe.title,
    recipeUrl: `https://recipe.rakuten.co.jp/recipe/${index + 1}`,
    foodImageUrl: `https://image.recipe.rakuten.co.jp/${index + 1}.jpg`,
    recipeMaterial: recipe.materials || ['材料1', '材料2'],
    recipeIndication: recipe.indication || '約30分',
    recipeCost: recipe.cost || '300円前後',
    recipePublishday: '2023-12-01',
    rank: '1'
  }))
})

// 📝 モックデータ
const mockFoodItems = [
  {
    id: 'mock-1',
    name: 'にんじん',
    category: '野菜',
    purchaseDate: '2023-11-01',
    expiryDate: '2023-11-15',
    quantity: 2,
    price: 150,
    isInBasket: false
  },
  {
    id: 'mock-2',
    name: '牛肉',
    category: '肉類',
    purchaseDate: '2023-11-01',
    expiryDate: '2023-11-10',
    quantity: 1,
    price: 800,
    isInBasket: false
  }
]

const mockRecipes = [
  {
    title: '肉じゃが',
    materials: ['じゃがいも', 'にんじん', '牛肉', '玉ねぎ'],
    indication: '約45分',
    cost: '500円前後'
  },
  {
    title: 'カレー',
    materials: ['じゃがいも', 'にんじん', '牛肉', '玉ねぎ', 'カレールー'],
    indication: '約60分',
    cost: '600円前後'
  }
]

export const handlers = [
  // 🤖 Gemini API - レシート解析
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', 
    async ({ request }) => {
      const url = new URL(request.url)
      const apiKey = url.searchParams.get('key')
      
      // APIキーの検証
      if (!apiKey || apiKey === 'invalid-key') {
        return HttpResponse.json(
          { error: { code: 401, message: 'Invalid API key' } },
          { status: 401 }
        )
      }

      // リクエストボディの解析
      const body = await request.json() as any
      const prompt = body.contents?.[0]?.parts?.[0]?.text || ''

      // レシート解析の場合
      if (prompt.includes('レシート') || prompt.includes('食品')) {
        return HttpResponse.json(
          createGeminiResponse(mockFoodItems),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // 食材名最適化の場合
      if (prompt.includes('食材名') || prompt.includes('最適化')) {
        const optimizedNames = ['人参', '牛肉', '玉ねぎ']
        return HttpResponse.json(
          createGeminiResponse({ optimizedNames }),
          { status: 200 }
        )
      }

      // カテゴリ選択の場合
      if (prompt.includes('カテゴリ') || prompt.includes('選択')) {
        const selectedCategories = ['10', '14'] // 野菜、肉類のカテゴリID
        return HttpResponse.json(
          createGeminiResponse({ selectedCategories }),
          { status: 200 }
        )
      }

      // デフォルトレスポンス
      return HttpResponse.json(
        createGeminiResponse([]),
        { status: 200 }
      )
    }
  ),

  // 🤖 Gemini API - レート制限エラー
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    () => {
      return HttpResponse.json(
        { error: { code: 429, message: 'Rate limit exceeded' } },
        { status: 429 }
      )
    },
    { once: false } // 特定のテスト用
  ),

  // 🍳 楽天レシピAPI - カテゴリ一覧
  http.get('https://app.rakuten.co.jp/services/api/Recipe/CategoryList/20170426', 
    ({ request }) => {
      const url = new URL(request.url)
      const applicationId = url.searchParams.get('applicationId')
      
      if (!applicationId) {
        return HttpResponse.json(
          { error: 'Application ID is required' },
          { status: 400 }
        )
      }

      return HttpResponse.json({
        result: {
          large: [
            { categoryId: '10', categoryName: '野菜' },
            { categoryId: '11', categoryName: '肉' },
            { categoryId: '12', categoryName: '魚' },
            { categoryId: '13', categoryName: '米・パン' },
            { categoryId: '14', categoryName: '調味料' }
          ],
          medium: [
            { categoryId: '101', categoryName: '根菜類', parentCategoryId: '10' },
            { categoryId: '102', categoryName: '葉野菜', parentCategoryId: '10' },
            { categoryId: '111', categoryName: '牛肉', parentCategoryId: '11' },
            { categoryId: '112', categoryName: '豚肉', parentCategoryId: '11' }
          ],
          small: []
        }
      })
    }
  ),

  // 🍳 楽天レシピAPI - レシピランキング
  http.get('https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426',
    ({ request }) => {
      const url = new URL(request.url)
      const applicationId = url.searchParams.get('applicationId')
      const categoryId = url.searchParams.get('categoryId')
      
      if (!applicationId) {
        return HttpResponse.json(
          { error: 'Application ID is required' },
          { status: 400 }
        )
      }

      // カテゴリに応じたレシピを返す
      const filteredRecipes = categoryId === '10' 
        ? [mockRecipes[0]] // 野菜カテゴリ
        : mockRecipes

      return HttpResponse.json(
        createRakutenRecipeResponse(filteredRecipes)
      )
    }
  ),

  // 🚫 ネットワークエラーのシミュレーション
  http.get('https://app.rakuten.co.jp/services/api/Recipe/CategoryList/network-error',
    () => {
      return HttpResponse.error()
    }
  ),

  // 🔄 タイムアウトのシミュレーション
  http.get('https://app.rakuten.co.jp/services/api/Recipe/CategoryList/timeout',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 30000)) // 30秒待機
      return HttpResponse.json({ result: [] })
    }
  )
]

// 🎯 特定のテスト用のハンドラー
export const errorHandlers = [
  // Gemini API エラー
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    () => {
      return HttpResponse.json(
        { error: { code: 500, message: 'Internal server error' } },
        { status: 500 }
      )
    }
  ),

  // 楽天API エラー
  http.get('https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426',
    () => {
      return HttpResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      )
    }
  )
]

// 🌐 成功レスポンス用のハンドラー
export const successHandlers = handlers