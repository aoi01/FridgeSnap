# Fridge Snap アプリケーション設計ガイド

わかりやすく、このアプリケーションの全体設計とAPI設計について説明します。

---

## 📱 アプリケーション全体の目的

**Fridge Snap** は、以下を実現する食材管理アプリケーションです：

1. **レシート撮影** → 画像AIで食材を自動抽出
2. **冷蔵庫管理** → 購入した食材の一覧管理・賞味期限管理
3. **献立計画** → 今日の献立に食材を追加
4. **家計簿** → 月ごとの食費追跡

### ユーザーのワークフロー

```
レシート撮影
    ↓
Gemini AIで食材抽出
    ↓
冷蔵庫に追加 + 購入履歴に記録
    ↓
献立に追加するか決定
    ↓
月の食費をまとめる
```

---

## 🏗️ システムアーキテクチャ（3層構造）

アプリケーションは **3つの層** に分かれています：

### 1️⃣ UI層（表示レイヤー）

**責任**: ユーザーに情報を表示し、入力を受け取る

```
┌─────────────────────────────────────┐
│       React Components              │
├─────────────────────────────────────┤
│ Index.tsx (メインページ)             │
│  ├─ ReceiptScanner (撮影モーダル)   │
│  ├─ FridgeView (冷蔵庫ビュー)       │
│  ├─ TodayBasket (献立管理)          │
│  └─ BudgetView (家計簿)             │
└─────────────────────────────────────┘
```

**主要コンポーネント**：
- `ReceiptScanner.tsx` - レシート撮影UI
- `CameraCapture.tsx` - カメラ操作
- `FileUploadSection.tsx` - ファイルアップロード

### 2️⃣ ロジック層（カスタムフック）

**責任**: ビジネスロジック・状態管理・データ処理

```
┌─────────────────────────────────────┐
│    Custom Hooks (状態管理)          │
├─────────────────────────────────────┤
│ useFridgeState (統合フック)         │
│  ├─ useFridgeItems                  │
│  ├─ useTodayBasket                  │
│  └─ usePurchaseHistory              │
└─────────────────────────────────────┘
```

**各フックの役割**（詳細は後述）：
- `useFridgeItems` - 冷蔵庫データのCRUD
- `useTodayBasket` - 献立用一時バスケット管理
- `usePurchaseHistory` - 購入履歴の永続記録
- `useFridgeState` - 上記3つを統合

### 3️⃣ 外部API層

**責任**: 外部サービスとの通信

```
┌─────────────────────────────────────┐
│      External APIs                  │
├─────────────────────────────────────┤
│ Gemini Vision API                   │
│  └─ レシート画像の解析              │
└─────────────────────────────────────┘
```

---

## 🔄 データフロー（レシート撮影から食材追加まで）

### ステップバイステップの流れ

```
1. ユーザーが「レシートをスキャン」をクリック
        ↓
2. Modal表示 (ReceiptScanner.tsx)
        ↓
3. カメラまたはファイルで画像を選択
        ↓
4. 画像 → Base64エンコード (receiptProcessor.ts)
        ↓
5. Base64 → Gemini API送信 (useGeminiReceiptAnalysis.ts)
        ↓
6. Gemini AIが食材を抽出して JSON返却
        ↓
7. JSON解析 (jsonParser.ts)
        ↓
8. FoodItem[]に変換
        ↓
9. useFridgeState.handleReceiptScanned()に渡す
        ↓
10. 冷蔵庫 + 購入履歴に同時追加 (localStorage自動保存)
```

### 具体例：レシートから「牛乳」「卵」を抽出する場合

```json
// 3. ユーザーが撮影
撮影画像 (JPEG形式)

// 4. Base64に変換
"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."

// 5. Gemini APIへ送信
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=YOUR_KEY
{
  "contents": [{
    "parts": [
      { "text": "レシートから食品を抽出してください..." },
      { "inline_data": { "mime_type": "image/jpeg", "data": "..." } }
    ]
  }],
  "generationConfig": { "temperature": 0.2 }
}

// 6. Gemini AIの応答
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "```json\n{\n  \"items\": [\n    {\n      \"name\": \"牛乳 1L\",\n      \"category\": \"乳製品\",\n      \"quantity\": 1,\n      \"price\": 200,\n      \"estimatedExpiryDays\": 7\n    },\n    {\n      \"name\": \"卵 10個\",\n      \"category\": \"乳製品\",\n      \"quantity\": 10,\n      \"price\": 300,\n      \"estimatedExpiryDays\": 14\n    }\n  ]\n}\n```"
      }]
    }
  }]
}

// 7-8. JSON抽出・解析

// 9-10. 冷蔵庫に追加
const foodItems = [
  {
    id: "1234567890",
    name: "牛乳 1L",
    category: "乳製品",
    purchaseDate: "2024-12-10",
    expiryDate: "2024-12-17",
    quantity: 1,
    price: 200,
    isInBasket: false
  },
  {
    id: "1234567891",
    name: "卵 10個",
    category: "乳製品",
    purchaseDate: "2024-12-10",
    expiryDate: "2024-12-24",
    quantity: 10,
    price: 300,
    isInBasket: false
  }
]
```

---

## 🪝 カスタムフック詳細説明

### 1. `useFridgeItems` - 冷蔵庫データ管理

**何をするか**: 冷蔵庫に入っている食材すべてを管理

**使用場面**:
- ユーザーが「冷蔵庫」タブを表示する
- 冷蔵庫から食材を削除する
- 期限切れアラートを表示する

**主なメソッド**:
```typescript
// 冷蔵庫に食材を追加
addFridgeItem(item: FoodItem): void

// 冷蔵庫から食材を削除
removeFromFridge(itemId: string): void

// 食材情報を更新（例：数量変更）
updateFridgeItem(item: FoodItem): void

// 期限切れ3日以内の食材を取得
getExpiringItems(): FoodItem[]

// 期限切れまでの日数を取得
getExpiryStatus(item: FoodItem): ExpiryStatusResult
```

**データ保存**:
- `localStorage` の `FRIDGE_ITEMS` に自動保存
- ページをリロードしても保持される

**状態例**:
```typescript
const {
  foodItems,        // [ { id, name, category, ... }, ... ]
  getExpiringItems, // () => 期限3日以内のアイテム
  addFridgeItem     // (item) => 冷蔵庫に追加
} = useFridgeItems();
```

---

### 2. `useTodayBasket` - 献立管理（一時バスケット）

**何をするか**: 今日の献立に入れる食材を一時的に管理

**使用場面**:
- ユーザーが冷蔵庫から「今日の献立に追加」をクリック
- 献立を変更・削除する
- 献立を完了（削除）する

**主なメソッド**:
```typescript
// 冷蔵庫から献立に移動
moveToBasket(item: FoodItem): void

// 献立から削除
removeFromBasket(itemId: string): void

// 献立を完了（全削除）
clearTodayBasket(): void

// 献立アイテムを更新
updateBasketItem(item: FoodItem): void
```

**重要なポイント**:
- 🔄 **一時的なデータ** - ページを閉じると消える可能性
- 📱 **localStorage同期** - 同じブラウザなら保持される
- ❌ **削除時に冷蔵庫には影響しない** - 献立から外すだけで、冷蔵庫の食材は残る

**状態例**:
```typescript
const {
  todayBasket,       // [ 今日追加した食材 ]
  moveToBasket,      // (item) => 献立に追加
  removeFromBasket   // (itemId) => 献立から削除
} = useTodayBasket();
```

---

### 3. `usePurchaseHistory` - 購入履歴管理

**何をするか**: すべての購入履歴を永続的に記録

**使用場面**:
- 家計簿で「今月の合計」を計算
- 月ごとの食費をグラフ化
- エンゲル係数（食費比率）を計算

**主なメソッド**:
```typescript
// 購入履歴に追加
addToPurchaseHistory(item: FoodItem): void

// 複数の食材を一括追加
addMultipleToPurchaseHistory(items: FoodItem[]): void

// 購入履歴を更新
updatePurchaseHistory(item: FoodItem): void

// 購入履歴から削除
deletePurchaseHistory(itemId: string): void
```

**データ保存**:
- `localStorage` の `PURCHASE_HISTORY` に永続保存
- **削除されても復元できない**（本当の購入履歴なので）

**使用例**:
```typescript
// 月ごとの食費合計を計算
const monthlyExpense = purchaseHistory
  .filter(item => item.purchaseDate.startsWith('2024-12'))
  .reduce((sum, item) => sum + item.price, 0);

// 結果: 5,000円 (12月の食費)
```

---

### 4. `useFridgeState` - 統合フック（全部まとめたもの）

**何をするか**: 上記3つのフックをまとめて提供

**使用場面**: ほぼすべてのページ（`Index.tsx`）で使用

**重要なメソッド**:

```typescript
// レシート解析後、冷蔵庫 + 購入履歴に同時追加
handleReceiptScanned(items: FoodItem[]): void
// 内部的には：
//   1. useFridgeItems.addFridgeItem() で冷蔵庫に追加
//   2. usePurchaseHistory.addMultipleToPurchaseHistory() で履歴に追加

// 献立完了時に、冷蔵庫から削除＆献立をクリア
clearTodayBasket(): void
// 内部的には：
//   1. todayBasket の各アイテムを冷蔵庫から削除
//   2. useTodayBasket.clearTodayBasket() で献立をクリア
```

**設計パターン**: **Facade Pattern（ファサードパターン）**
- 複数のフックの複雑な操作を1つのインターフェースで統一

---

## 📊 API設計（Gemini Vision API）

### リクエスト構造

```
エンドポイント:
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={API_KEY}

ヘッダー:
Content-Type: application/json

ボディ:
{
  "contents": [
    {
      "parts": [
        {
          "text": "プロンプト（AIへの指示）"
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "Base64エンコードされた画像データ"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.2,           // 回答のランダム性（低いほど安定）
    "maxOutputTokens": 4096,      // 最大出力トークン数
    "topP": 0.95,                 // 単語選択の多様性
    "topK": 40                    // トップK件から選択
  }
}
```

### プロンプト戦略

AIに正確に食材を抽出させるためのプロンプト：

```text
あなたはレシート画像から食品情報を抽出する専門AIです。

1. 食品のみ抽出（日用品、医薬品は除外）
2. 正確に読み取る（商品名と価格）
3. カテゴリを分類（野菜、肉類、魚類など9カテゴリ）
4. 数量を抽出（「トマト 2個」→ quantity: 2）

出力形式（必ずこの形式）:
```json
{
  "items": [
    {
      "name": "商品名",
      "category": "カテゴリ",
      "quantity": 数量,
      "price": 価格,
      "estimatedExpiryDays": 推定日数
    }
  ]
}
```
```

### レスポンス構造

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "```json\n{ \"items\": [...] }\n```"
          }
        ]
      }
    }
  ]
}
```

### エラーハンドリング

```typescript
// ネットワークエラー（401 Unauthorized）
if (response.status === 401) {
  throw new Error('APIキーが無効です');
}

// レート制限（429 Too Many Requests）
if (response.status === 429) {
  throw new Error('API呼び出し回数の上限に達しました');
  // → 数秒待機してリトライ
}

// サーバーエラー（5xx）
if (response.status >= 500) {
  throw new Error('Gemini APIが一時的に利用できません');
  // → 指数バックオフでリトライ
}
```

---

## 💾 データ永続化戦略

### localStorage の使い分け

```typescript
// 冷蔵庫（永続）
localStorage['FRIDGE_ITEMS']
= [
    { id: "123", name: "牛乳", expiryDate: "2024-12-17" },
    { id: "124", name: "卵", expiryDate: "2024-12-24" }
  ]

// 献立（一時）
localStorage['TODAY_BASKET']
= [
    { id: "123", name: "牛乳", isInBasket: true }
  ]

// 購入履歴（永続）
localStorage['PURCHASE_HISTORY']
= [
    { id: "123", name: "牛乳", purchaseDate: "2024-12-10", price: 200 },
    { id: "124", name: "卵", purchaseDate: "2024-12-10", price: 300 }
  ]
```

### 自動同期メカニズム

```typescript
// 冷蔵庫の場合
useEffect(() => {
  // foodItems が変わるたびに自動保存
  localStorage.setItem(STORAGE_KEYS.FRIDGE_ITEMS, JSON.stringify(foodItems));
}, [foodItems]); // ← 依存配列に foodItems が入っている
```

---

## 🏗️ コンポーネント階層

```
Index.tsx (メインページ)
├── ReceiptScanner
│   ├── CameraCapture
│   │   └── Webcam (react-webcam)
│   └── FileUploadSection
├── FridgeView
│   ├── FoodItemCard
│   └── ExpiryAlert
├── TodayBasket
│   └── BasketItem
└── BudgetView
    ├── MonthlyStats
    └── ExpenseChart
```

---

## 🔐 セキュリティ考慮事項

### 1. APIキー管理
```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// ✅ .env.local に保存（Gitに含めない）
// ❌ ハードコード禁止
```

### 2. 入力検証
```typescript
// ファイルサイズチェック
validateFileSize(file, 10); // 最大10MB

// ファイル形式チェック
validateImageFormat(file); // jpeg, jpg, png, webp のみ

// JSON解析エラー処理
safeJsonParse(jsonString); // エラーをキャッチ
```

### 3. XSS対策
```typescript
// React は自動的にエスケープ
<p>{item.name}</p> // ✅ 安全

// 注意：dangerouslySetInnerHTML は使わない
<p dangerouslySetInnerHTML={{__html: item.name}} /> // ❌ 危険
```

---

## ⚡ パフォーマンス最適化

### 1. 画像処理
```typescript
// 大きな画像をBase64に変換する場合
// → 圧縮して使用量を削減

// Canvas API で圧縮例
const canvas = document.createElement('canvas');
canvas.width = 800;  // リサイズ
canvas.height = 600;
// 描画して圧縮
```

### 2. API呼び出し
```typescript
// 同一画像への連続呼び出しを防止
const [isLoading, setIsLoading] = useState(false);

const handleAnalyze = async () => {
  if (isLoading) return; // 二重呼び出し防止
  setIsLoading(true);
  try {
    // API呼び出し
  } finally {
    setIsLoading(false);
  }
};
```

### 3. LocalStorage の効率化
```typescript
// 毎回フルデータを保存するのではなく、変更分だけ更新
// → useEffect の依存配列を適切に指定

useEffect(() => {
  localStorage.setItem(key, JSON.stringify(value));
}, [value]); // value が本当に変わった時だけ実行
```

---

## 🧪 テスト戦略

### E2E テスト（Playwright）

```typescript
// 撮影からレシート解析までのフロー
test('user can scan receipt and add items to fridge', async ({ page }) => {
  // 1. ページロード
  await page.goto('/');

  // 2. 「レシートをスキャン」ボタンクリック
  await page.click('button:has-text("レシートをスキャン")');

  // 3. ファイルをアップロード
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('receipt-sample.jpg');

  // 4. Gemini APIが呼ばれるのを待つ
  await page.waitForLoadState('domcontentloaded');

  // 5. 食材が追加されたことを確認
  const items = page.locator('button:has-text("牛乳")');
  await expect(items).toBeVisible();
});
```

### ユニットテスト

```typescript
// カスタムフックのテスト
describe('useFridgeItems', () => {
  it('should add item to fridge', () => {
    const { result } = renderHook(() => useFridgeItems());

    act(() => {
      result.current.addFridgeItem({
        id: '123',
        name: '牛乳',
        category: '乳製品',
        // ...
      });
    });

    expect(result.current.foodItems).toHaveLength(1);
  });
});
```

---

## 📈 拡張性とスケーリング

### 今後追加可能な機能

1. **バックエンド連携**
   ```typescript
   // 現在: localStorage のみ
   // 将来: Firebase/Supabase と同期
   ```

2. **複数ユーザー対応**
   ```typescript
   // 現在: ブラウザのみ
   // 将来: クラウドDB＋認証
   ```

3. **更新画像処理**
   ```typescript
   // 現在: Gemini Vision API
   // 将来: OCR + 独自モデル の組み合わせ
   ```

---

## 🎯 まとめ

### アーキテクチャの特徴

| 層 | 技術 | 役割 |
|---|---|---|
| **UI層** | React + TypeScript | ユーザーインターフェース |
| **ロジック層** | Custom Hooks | 状態管理・ビジネスロジック |
| **データ層** | localStorage | ローカル永続化 |
| **外部層** | Gemini Vision API | AI解析 |

### 設計原則

1. **単一責任の原則（SRP）**
   - `useFridgeItems` = 冷蔵庫管理
   - `useTodayBasket` = 献立管理
   - `usePurchaseHistory` = 購入履歴管理

2. **関心の分離**
   - UIロジック ≠ ビジネスロジック
   - API呼び出し ≠ データ処理

3. **再利用性**
   - カスタムフックは複数のコンポーネントから使用可能

### このアプリケーションが実現すること

✅ **簡単レシート管理** - 撮影で自動抽出
✅ **食材管理** - 賞味期限アラート
✅ **献立計画** - 今日の食材を選択
✅ **家計簿** - 食費の追跡

これらすべてが **1つのシンプルなアーキテクチャ** で実現されています。
