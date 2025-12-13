# API 設計仕様書 - Fridge Snap

## 📌 ドキュメント概要

本ドキュメントは、Fridge Snap アプリケーションで使用する外部API（Gemini）の詳細な設計仕様、リクエスト・レスポンス形式、エラーハンドリング戦略を記載しています。

---

## 1️⃣ Gemini API - レシート画像解析

### 1.1 エンドポイント

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=YOUR_API_KEY
```

### 1.2 認証

```typescript
// 環境変数から取得
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 検証ロジック
if (!GEMINI_API_KEY?.startsWith('AIza')) {
  throw new Error('Invalid Gemini API key');
}
```

### 1.3 リクエスト形式

#### マルチモーダル入力（テキスト + 画像）

```typescript
interface GeminiReceiptRequest {
  contents: {
    parts: {
      inlineData?: {
        mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
        data: string;  // Base64 エンコード済み
      };
      text?: string;  // 指示テキスト
    }[];
  }[];
  generationConfig: {
    temperature: 0.1;           // 精度重視（0～1）
    topP?: number;              // 核サンプリング
    topK?: number;              // 選択肢の数
    maxOutputTokens: number;    // 最大出力トークン
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}
```

#### 実装例

```typescript
// src/hooks/useGeminiReceiptAnalysis.ts

const analyzeReceiptWithGemini = async (imageData: string) => {
  const prompt = `以下のレシート画像から食材情報を抽出してください。

JSON形式で以下のスキーマで回答：
{
  "items": [
    {
      "name": "食材名",
      "category": "野菜|肉|乳製品|調味料|その他",
      "quantity": 数値,
      "unit": "個|g|ml|kg|本",
      "estimatedPrice": 推定価格,
      "estimatedExpiryDays": 推定日数
    }
  ]
}`;

  const request: GeminiReceiptRequest = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData  // Base64形式の画像データ
          }
        },
        {
          text: prompt
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2000
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }
  );

  return response.json();
};
```

### 1.4 レスポンス形式

#### 成功レスポンス (200 OK)

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"items\": [{\"name\": \"トマト\", \"category\": \"野菜\", ...}]}"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 450,
    "candidatesTokenCount": 180,
    "totalTokenCount": 630
  }
}
```

#### レスポンス処理

```typescript
interface GeminiReceiptResponse {
  candidates: {
    content: {
      parts: {
        text: string;  // JSONが含まれている
      }[];
      role: 'model';
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION';
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const parseReceiptResponse = (response: GeminiReceiptResponse): FoodItem[] => {
  const text = response.candidates[0]?.content?.parts[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  // JSON抽出（```json ... ``` 形式対応）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return parsed.items.map((item: any, index: number) => ({
    id: `receipt-${Date.now()}-${index}`,
    name: item.name,
    category: mapCategoryToFoodCategory(item.category),
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: calculateExpiryDate(item.estimatedExpiryDays),
    quantity: item.quantity,
    price: item.estimatedPrice,
    isInBasket: false
  }));
};
```

### 1.5 エラーハンドリング

#### HTTP ステータスコード

| コード | 原因 | 対応 |
|--------|------|------|
| 400 | リクエスト形式エラー | 入力検証を厳格化 |
| 401 | APIキー無効 | 環境変数確認 |
| 403 | クォータ超過 | レート制限チェック |
| 429 | Rate Limited | 指数バックオフ再試行 |
| 500 | サーバーエラー | 再試行 |

#### 実装例

```typescript
class GeminiApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

const handleGeminiError = (status: number, body: string): GeminiApiError => {
  switch (status) {
    case 400:
      return new GeminiApiError(400, 'リクエスト形式が正しくありません', false);

    case 401:
      return new GeminiApiError(401, 'APIキーが無効です', false);

    case 429:
      return new GeminiApiError(429, 'レート制限に達しました', true);

    case 500:
    case 502:
    case 503:
      return new GeminiApiError(status, 'APIサーバーエラー', true);

    default:
      return new GeminiApiError(status, 'APIリクエスト失敗', true);
  }
};

// 指数バックオフ再試行
const makeRetryableRequest = async (
  request: () => Promise<Response>,
  maxRetries: number = 3
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await request();

      if (response.ok) {
        return response;
      }

      const error = handleGeminiError(
        response.status,
        await response.text()
      );

      if (!error.retryable || i === maxRetries - 1) {
        throw error;
      }

      // 指数バックオフ: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }

  throw new Error('Max retries exceeded');
};
```

---

## 2️⃣ Gemini API - レシピ生成

### 2.1 エンドポイント

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY
```

### 2.2 リクエスト形式

```typescript
interface GeminiRecipeRequest {
  contents: {
    parts: {
      text: string;  // プロンプト
    }[];
  }[];
  generationConfig: {
    temperature: 0.7;        // 創造性重視
    maxOutputTokens: 3000;
  };
  systemInstruction?: {     // システムレベルの指示
    parts: {
      text: string;
    }[];
  };
}

const generateRecipes = async (ingredients: string[]): Promise<GeminiRecipe[]> => {
  const prompt = `以下の食材で3つのレシピを提案してください：${ingredients.join(', ')}

要件：
1. 調理時間は30分以内
2. 材料は提示された食材を使う
3. 日本人向けの味付け

JSON形式で回答：
{
  "recipes": [
    {
      "name": "料理名",
      "description": "説明文",
      "ingredients": ["食材1", "食材2"],
      "instructions": [
        "手順1",
        "手順2"
      ],
      "cookingTime": "15分",
      "difficulty": "簡単|普通|難しい",
      "servings": "2人分"
    }
  ]
}`;

  const request: GeminiRecipeRequest = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    },
    systemInstruction: {
      parts: [{
        text: 'あなたは経験豊富な日本の家庭料理シェフです。シンプルで美味しいレシピを提案してください。'
      }]
    }
  };

  // リクエスト実行
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }
  );

  return parseRecipeResponse(await response.json());
};
```

### 2.3 レスポンス処理

```typescript
interface GeminiRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
  servings: string;
}

const parseRecipeResponse = (response: GeminiReceiptResponse): GeminiRecipe[] => {
  const rawText = response.candidates[0]?.content?.parts[0]?.text || '';

  // JSON抽出（複数フォーマット対応）
  const jsonString = extractJsonFromText(rawText);
  const parsed = safeJsonParse<{ recipes: any[] }>(jsonString);

  return (parsed.recipes || []).map((recipe, index) => ({
    id: `gemini-recipe-${index + 1}`,
    name: recipe.name || '',
    description: recipe.description || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
    cookingTime: recipe.cookingTime || '',
    difficulty: recipe.difficulty || '普通',
    servings: recipe.servings || '2人分'
  }));
};

// JSON抽出ユーティリティ
const extractJsonFromText = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSON not found in response');
  }
  return jsonMatch[0];
};

// 安全なJSON パース
const safeJsonParse = <T>(jsonString: string): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error('Invalid JSON format');
  }
};
```

---

## 3️⃣ レート制限・使用量管理

### 3.1 レート制限戦略

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private timeWindow: number = 60000  // 1分
  ) {}

  /**
   * リクエスト可能か判定
   * @param apiName API名
   * @returns 可能：true、超過：false
   */
  canMakeRequest(apiName: string): boolean {
    const now = Date.now();
    const apiRequests = this.requests.get(apiName) || [];

    // タイムウィンドウ外の古いリクエストを削除
    const recentRequests = apiRequests.filter(
      time => now - time < this.timeWindow
    );

    // 制限チェック
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // リクエストを記録
    recentRequests.push(now);
    this.requests.set(apiName, recentRequests);

    return true;
  }

  getRemainingRequests(apiName: string): number {
    const now = Date.now();
    const requests = this.requests.get(apiName) || [];
    const recentRequests = requests.filter(
      time => now - time < this.timeWindow
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// 使用例
const limiter = new RateLimiter(10, 60000);  // 1分間に10リクエスト

if (!limiter.canMakeRequest('gemini')) {
  toast.error('レート制限に達しました。お待ちください。');
  return;
}

const remaining = limiter.getRemainingRequests('gemini');
console.log(`残りリクエスト数: ${remaining}`);
```

### 3.2 使用量監視

```typescript
class ApiUsageMonitor {
  private static instance: ApiUsageMonitor;
  private usage: Map<string, { count: number; cost: number }> = new Map();

  static getInstance(): ApiUsageMonitor {
    if (!this.instance) {
      this.instance = new ApiUsageMonitor();
    }
    return this.instance;
  }

  recordUsage(apiName: string, cost: number = 1): void {
    const today = new Date().toDateString();
    const key = `${apiName}_${today}`;
    const current = this.usage.get(key) || { count: 0, cost: 0 };

    const updated = {
      count: current.count + 1,
      cost: current.cost + cost
    };

    this.usage.set(key, updated);

    // 日次制限: 1000リクエスト
    const usagePercentage = (updated.count / 1000) * 100;

    if (usagePercentage >= 80) {
      toast.warning(
        `${apiName} API 使用量警告`,
        `本日の使用量: ${updated.count}/1000 (${usagePercentage.toFixed(1)}%)`
      );
    }
  }

  getUsageStats(apiName: string) {
    const today = new Date().toDateString();
    const key = `${apiName}_${today}`;
    const usage = this.usage.get(key) || { count: 0, cost: 0 };

    return {
      count: usage.count,
      cost: usage.cost,
      percentage: (usage.count / 1000) * 100
    };
  }
}
```

---

## 4️⃣ セキュリティ実装

### 4.1 APIキー管理

```typescript
// ❌ アンチパターン：コードにキーを埋め込む
const API_KEY = 'AIza...';

// ✅ 推奨：環境変数で管理
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 検証
if (!API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is not set');
}

if (!API_KEY.startsWith('AIza')) {
  throw new Error('Invalid API key format');
}
```

### 4.2 セキュリティヘッダー

```typescript
const secureHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',  // CSRF対策
  'Cache-Control': 'no-cache',           // キャッシュ防止
  'X-Content-Type-Options': 'nosniff'    // MIME type sniffing対策
};

const response = await fetch(url, {
  method: 'POST',
  headers: secureHeaders,
  body: JSON.stringify(payload)
});
```

### 4.3 入力検証

```typescript
interface ValidateImageResult {
  valid: boolean;
  errors: string[];
}

const validateImage = (file: File): ValidateImageResult => {
  const errors: string[] = [];

  // ファイルタイプチェック
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validMimeTypes.includes(file.type)) {
    errors.push('対応形式: JPEG, PNG, WebP');
  }

  // ファイルサイズチェック（最大5MB）
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    errors.push('ファイルサイズは5MB以下');
  }

  // 解像度チェック
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 400 || img.height < 400) {
          errors.push('最小解像度: 400x400px');
        }
        resolve({ valid: errors.length === 0, errors });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

---

## 5️⃣ パフォーマンス考慮事項

### 5.1 キャッシング戦略

```typescript
// ローカルストレージ キャッシュ
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;  // Time to Live (ms)
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // TTLチェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    return !entry || Date.now() - entry.timestamp > entry.ttl;
  }
}

// 使用例
const cache = new ApiCache();

const generateRecipesWithCache = async (ingredients: string[]) => {
  const cacheKey = `recipes_${ingredients.sort().join('_')}`;

  // キャッシュから取得試行
  const cached = cache.get<GeminiRecipe[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // キャッシュなし → API呼び出し
  const recipes = await generateRecipes(ingredients);

  // 1時間キャッシュ
  cache.set(cacheKey, recipes, 3600000);

  return recipes;
};
```

### 5.2 バッチ処理

```typescript
// 複数リクエストを効率化
const batchRecipeGeneration = async (
  ingredientSets: string[][]
): Promise<GeminiRecipe[][]> => {
  // 並列実行（3つまで同時）
  const results: GeminiRecipe[][] = [];
  const batchSize = 3;

  for (let i = 0; i < ingredientSets.length; i += batchSize) {
    const batch = ingredientSets.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(ingredients => generateRecipes(ingredients))
    );
    results.push(...batchResults);
  }

  return results;
};
```

---

## 6️⃣ テスト可能性設計

### 6.1 Dependency Injection

```typescript
// テスト時に Mock API を注入可能
interface ApiClientConfig {
  fetch?: typeof fetch;
  apiKey?: string;
  maxRetries?: number;
}

class GeminiApiClient {
  constructor(private config: ApiClientConfig = {}) {}

  async generateRecipes(ingredients: string[]): Promise<GeminiRecipe[]> {
    const fetchFn = this.config.fetch || fetch;
    const apiKey = this.config.apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    const response = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      { /* ... */ }
    );

    return parseRecipeResponse(await response.json());
  }
}

// テスト時
const mockFetch = vi.fn(() => Promise.resolve({
  ok: true,
  json: () => ({ candidates: [/* ... */] })
}));

const client = new GeminiApiClient({ fetch: mockFetch });
```

### 6.2 MSW (Mock Service Worker)

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    async ({ request }) => {
      const body = await request.json();

      return HttpResponse.json({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                recipes: [
                  {
                    name: 'テストレシピ',
                    description: 'テスト',
                    ingredients: ['食材1'],
                    instructions: ['手順1'],
                    cookingTime: '10分',
                    difficulty: '簡単'
                  }
                ]
              })
            }]
          }
        }]
      });
    }
  )
];
```

---

## 📊 API 使用量の目安

| 機能 | トークン数 | 推定コスト |
|------|-----------|----------|
| 画像解析（レシート） | 400-800 | 無料〜低コスト |
| レシピ生成 | 800-1200 | 無料〜低コスト |
| 1日全機能使用（20回） | 10,000-20,000 | 無料〜低コスト |

*注: Gemini は無料枠が充実しており、ほとんどの個人利用ユーザーは無料で使用可能

---

## 🎯 まとめ

- **APIキー**: 環境変数で安全に管理
- **エラーハンドリング**: ステータスコード別の適切な対応
- **レート制限**: 1分10リクエスト制限で安定性確保
- **リトライ戦略**: 指数バックオフで一時的エラーに対応
- **テスト可能性**: DI とモックで容易にテスト実装可能

