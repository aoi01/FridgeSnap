# Fridge Snap - アーキテクチャ概要

## 🎯 1行要約

**AI駆動型の食材管理アプリケーション**: Gemini APIで画像解析 + React Hooksで状態管理 + LocalStorageで永続化

---

## 🏢 システムアーキテクチャ

```
┌─────────────────────────────────────────────┐
│         React UI Layer                      │
│  ┌─────────────────────────────────────┐   │
│  │  Index.tsx (統合ページ)              │   │
│  │  ├─ FridgeView (冷蔵庫)             │   │
│  │  ├─ TodayBasket (献立)             │   │
│  │  ├─ RecipesSuggestion (レシピ)     │   │
│  │  ├─ BudgetOverview (家計簿)        │   │
│  │  └─ ReceiptScanner (画像)          │   │
│  └─────────────────────────────────────┘   │
└────────────┬────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│     Custom Hooks Layer (状態管理)           │
│  ┌─────────────────────────────────────┐   │
│  │ useFridgeState (統合)               │   │
│  │  ├─ useFridgeItems                 │   │
│  │  ├─ useTodayBasket                 │   │
│  │  └─ usePurchaseHistory             │   │
│  │                                     │   │
│  │ useGeminiRecipes (レシピAI)        │   │
│  │ useGeminiReceiptAnalysis (画像AI)  │   │
│  └─────────────────────────────────────┘   │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│   Data Persistence Layer                     │
│  ┌──────────────────────────────────────┐   │
│  │  LocalStorage                        │   │
│  │  - foodItems[]                      │   │
│  │  - todayBasket[]                    │   │
│  │  - purchaseHistory[]                │   │
│  │  - monthlyData{}                    │   │
│  └──────────────────────────────────────┘   │
└────────────┬───────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│    External APIs                               │
│  ┌──────────────────────────────────────────┐  │
│  │  Gemini API                              │  │
│  │  ├─ Vision: 画像解析 (レシート)        │  │
│  │  └─ Generative: テキスト生成 (レシピ)  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 データフロー図

### シーケンスA: レシート登録

```
ユーザー
  │
  └─ 📸 レシート撮影
       │
       ▼
   ReceiptScanner (コンポーネント)
       │
       ├─ 画像をBase64エンコード
       │
       ▼
   useGeminiReceiptAnalysis (Hook)
       │
       ├─ Gemini API に送信
       ├─ 画像から食材抽出
       │
       ▼
   useFridgeState.handleReceiptScanned()
       │
       ├─ useFridgeItems.addFridgeItem()
       │   └─ 冷蔵庫に複数食材を追加
       │
       ├─ usePurchaseHistory.addToPurchaseHistory()
       │   └─ 購入履歴に記録
       │
       ▼
   LocalStorage 保存
       │
       ▼
   ✅ 完了 (UI更新)
```

### シーケンスB: レシピ提案

```
ユーザー
  │
  └─ 🍽️「レシピ検索」クリック
       │
       ▼
   RecipesSuggestion (コンポーネント)
       │
       ├─ useFridgeState.foodItems から食材リスト取得
       │
       ▼
   useGeminiRecipes.generateRecipesWithGemini()
       │
       ├─ 食材をプロンプトに変換
       ├─ Gemini API に送信
       ├─ JSON 形式でレシピを取得
       │
       ▼
   GeminiRecipe[] に変換
       │
       ▼
   RecipeCard で表示
       │
       ▼
   ✅ レシピ一覧表示
```

### シーケンスC: 献立管理

```
ユーザー
  │
  └─ 冷蔵庫から食材を「今日の献立」に追加
       │
       ▼
   useTodayBasket.moveToBasket(item)
       │
       ├─ todayBasket State に追加
       ├─ FoodItem.isInBasket = true に更新
       │
       ▼
   LocalStorage 同期
       │
       ├─ FridgeView と TodayBasket が同時更新
       │
       ▼
   ユーザーが献立を完成させる
       │
       └─ ✅「献立完了」クリック
             │
             ▼
         useFridgeState.clearTodayBasket()
             │
             ├─ 献立内の食材を冷蔵庫から削除
             ├─ 献立をリセット
             │
             ▼
         購入履歴に記録（月次計算用）
             │
             ▼
         ✅ 完了
```

---

## 📦 技術スタック

### フロントエンド

| 層 | 技術 | 用途 |
|-----|------|------|
| UI Framework | React 18 | コンポーネント開発 |
| Language | TypeScript | 型安全性 |
| Styling | Tailwind CSS | ユーティリティ CSS |
| UI Components | shadcn/ui | アクセシビリティ重視 |
| Bundler | Vite | 高速ビルド |
| Router | React Router v6 | SPA ルーティング |

### 状態・データ

| 技術 | 用途 |
|------|------|
| useState / useEffect | 状態管理 |
| Custom Hooks | ロジック抽象化 |
| LocalStorage | データ永続化 |
| JSON | データシリアライズ |

### 外部API

| API | 用途 | 認証 |
|-----|------|------|
| Gemini 2.5-flash-lite | レシピ生成 | APIキー |
| Gemini 2.0-flash-lite | 画像解析 | APIキー |

### テスト

| ツール | 用途 |
|--------|------|
| Vitest | ユニットテスト |
| React Testing Library | コンポーネントテスト |
| Playwright | E2E テスト |
| MSW | API モック |

---

## 🎯 設計パターン

### 1. Custom Hook パターン

```typescript
// ビジネスロジックをカプセル化
const useXxx = () => {
  const [state, setState] = useState();

  const action = () => {
    // ロジック処理
    setState(newValue);
  };

  return { state, action };
};
```

**メリット**: ロジック再利用、テスト容易性

### 2. Composition パターン

```typescript
// 小さいコンポーネントを組み合わせる
<FridgeView>
  <FridgeAddForm />
  <CategorySection />
  <FridgeItemEditor />
</FridgeView>
```

**メリット**: 保守性、再利用性

### 3. Props Drilling 代替

```typescript
// 中間層を通さずに深いコンポーネントへ渡す
const fridgeState = useFridgeState();

// 直接利用
<FridgeView {...fridgeState} />
```

**メリット**: Props の階層を減らす

---

## 🔐 セキュリティ設計

### 3層防御

```
1️⃣ Input Validation (入力検証)
   ├─ 画像ファイルタイプチェック
   ├─ ファイルサイズ制限
   └─ 解像度チェック

2️⃣ API Security (APIセキュリティ)
   ├─ APIキー検証
   ├─ レート制限
   └─ セキュリティヘッダー

3️⃣ Output Sanitization (出力サニタイゼーション)
   ├─ JSON パース安全化
   └─ DOM エスケープ
```

---

## 📈 パフォーマンス

### 最適化手法

| 方法 | 効果 |
|------|------|
| Code Splitting | バンドルサイズ削減 |
| React.memo | 不要レンダリング防止 |
| LocalStorage Cache | API 呼び出し削減 |
| Lazy Loading | 初期ロード高速化 |

### メトリクス

```
Build Size: 829.46 kB (gzipped: 248.47 kB)
Time to Interactive: ~2-3秒
Lighthouse Score: 85+
```

---

## 🧪 テスト戦略

### テストピラミッド

```
         E2E Tests (Playwright)
           /        |        \
          /          |         \
   Integration Tests (MSW)
        /            |           \
      /              |            \
Unit Tests (Vitest)
```

### カバレッジ目標

- **Unit Tests**: 85%
- **Integration Tests**: 70%
- **E2E Tests**: 主要フロー全網羅

---

## 🚀 デプロイメント

### ビルドプロセス

```bash
npm run build
# Vite がバンドル生成
```

### 推奨ホスティング

- **静的ホスティング**: Vercel, Netlify
- **ストレージ**: Google Cloud Storage（画像）
- **監視**: Sentry（エラートラッキング）

---

## 💡 設計の工夫

### 1. 責任分離

```typescript
// 3つのHookで責任を明確に分離
useFridgeItems      // 冷蔵庫のCRUD
useTodayBasket      // 献立のCRUD
usePurchaseHistory  // 履歴のCRUD
useFridgeState      // 統合・ビジネスロジック
```

### 2. 非同期処理の最小化

```typescript
// API呼び出しは必要時のみ
// レシピは生成時、画像は撮影時のみ
```

### 3. エラーハンドリング

```typescript
// 段階的なフォールバック
try {
  // Gemini API 呼び出し
} catch (error) {
  if (error.retryable) {
    // 指数バックオフ再試行
  } else {
    // ユーザーに通知
  }
}
```

---

## 📊 今後の拡張性

### Phase 2: バックエンド化

```
React FE        Node.js BE        DB
    │               │            │
    └─ REST API ────┼────────────┘
    └─ WebSocket ───┼─ リアルタイム同期
```

### Phase 3: モバイル化

```
Web App  →  React Native App
  │              │
  └─ Shared Logic Layer ─┘
```

### Phase 4: 国際化・多言語対応

```
i18n + Localization
- 日本語、英語、中国語
- 地域別のレシピ推奨
```

---

## 📚 主要なファイル構成

```
src/
├── components/           # UI コンポーネント
│   ├── FridgeView.tsx   # 冷蔵庫管理
│   ├── TodayBasket.tsx  # 献立管理
│   ├── ReceiptScanner.tsx # 画像解析
│   └── RecipesSuggestion.tsx # レシピ提案
├── hooks/               # Custom Hooks
│   ├── useFridgeState.ts
│   ├── useFridgeItems.ts
│   ├── useTodayBasket.ts
│   ├── useGeminiRecipes.ts
│   └── useGeminiReceiptAnalysis.ts
├── lib/                # ユーティリティ
│   └── apiSecurity.ts   # APIセキュリティ
├── types/              # TypeScript型定義
│   └── food.ts
└── pages/
    └── Index.tsx       # メインページ
```

---

## ✅ チェックリスト（実装済み）

- [x] React + TypeScript セットアップ
- [x] Tailwind CSS + shadcn/ui
- [x] Custom Hooks 実装（責任分離）
- [x] Gemini API 統合（画像解析・レシピ生成）
- [x] LocalStorage 永続化
- [x] API セキュリティ（検証・レート制限）
- [x] E2E テスト（Playwright）
- [x] ビルド最適化（829KB）
- [x] エラーハンドリング（ユーザーフレンドリー）
- [x] レスポンシブデザイン

---

## 🎓 技術面接での説明ポイント

1. **アーキテクチャ**: レイヤー分離とDataflow
2. **状態管理**: Hooks による責任分離
3. **API 設計**: Gemini API の2つの用途
4. **セキュリティ**: 3層防御とレート制限
5. **テスト戦略**: ピラミッド型アプローチ
6. **拡張性**: バックエンド化への道筋

---

**作成日**: 2025年12月10日
**バージョン**: 1.0
