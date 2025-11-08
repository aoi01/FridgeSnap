# Fridge Snap - プロジェクト概要

## プロジェクトについて

**Fridge Snap**は、レシートをOCRで読み取ることで冷蔵庫の中身を簡単に管理できるアプリです。また、レシートには金額が記載されているのでそれを利用した家計簿をつけることができ、エンゲル係数も算出することができます。

## 主要機能

### 1.レシート読み取り機能
- Google Gemini 2.5 Flash APIを使用したレシート画像解析
- レシートから食品のみを自動識別・抽出
- 野菜、肉類、魚類、乳製品、調味料、パン・米類、冷凍食品などに自動分類
- 食品種類に基づく現実的な消費期限の自動算出
- 購入価格の読み取りと保存

### 2.冷蔵庫管理
- カテゴリー別に整理された食材一覧表示（絵文字アイコン付き）
- 期限状況に応じた色分け表示
- 個別食材の編集、今日のバスケットへの移動、削除機能

### 3. 今日の料理計画
- 今日使用予定の食材を集める専用スペース
-「料理完了」ボタンで使用済み食材の一括削除

### 4.レシピ提案（今後改善予定）
- 楽天レシピAPIを使って実装したが、楽天レシピAPIでは食材を直接検索できず、
 「食材のカテゴリマップを取得（例　212：肉　212－10：豚肉）」→「カテゴリを指定するとその食材の上位5件のレシピを取得」
　という流れだったので使い勝手が悪く、処理にも時間がかかるため今後はGeminiAPIに献立の食材を使った料理を提案してもらうようなプロンプトを作って実装しなおす予定

### 5. 予算・支出管理
- レシートから読み取った価格から月ごとの食費をグラフ化
- 生活費を入力することでエンゲル係数も可視化される
- 購入履歴の表示
- （今後）今月の栄養バランスを購入履歴から算出、改善の提案をする機能を実装予定

## 技術スタック

- **フロントエンドフレームワーク**: React with TypeScript
- **スタイリング**: レスポンシブデザイン対応のTailwind CSS
- **状態管理**: React hooks (useState, useEffect)
- **データ管理**: クライアントサイドデータ保存用localStorage
- **外部API**: AI処理用Google Gemini 1.5 Flash、楽天レシピAPI
- **ルーティング**: ナビゲーション用React Router
- **ビルドツール**: Vite


## 開発・実行環境

### 必要な環境
- Node.js (v18以上推奨)
- npm または yarn

### セットアップ手順

1. リポジトリのクローン:
```bash
git clone <YOUR_GIT_URL>
```

2. 依存関係のインストール:
```bash
npm install
```

3. 開発サーバーの起動:
```bash
npm run dev
```

4. ビルド:
```bash
npm run build
```

### その他の利用可能なコマンド
- `npm run lint` - ESLintによるコード品質チェック
- `npm run preview` - ビルド済みアプリケーションのプレビュー

## プロジェクト構造

### リファクタリング前の構成

```
src/
├── components/          # Reactコンポーネント
│   ├── ui/             # 再利用可能なUIコンポーネント（shadcn/ui）
│   ├── BudgetOverview.tsx      # 予算管理コンポーネント
│   ├── FridgeView.tsx          # 冷蔵庫管理コンポーネント（687行）
│   ├── ReceiptScanner.tsx      # レシートスキャナーコンポーネント
│   ├── RecipesSuggestion.tsx   # レシピ提案コンポーネント
│   └── TodayBasket.tsx         # 今日のバスケットコンポーネント
├── hooks/              # カスタムReactフック
├── lib/                # ユーティリティ関数
├── pages/              # ページコンポーネント
│   └── Index.tsx       # メインページ（305行、状態管理が集約）
├── App.tsx             # メインアプリケーションコンポーネント
└── main.tsx            # アプリケーションエントリーポイント
```

**主な課題:**
- FridgeView が 687 行で責務が多い
- Index.tsx が 305 行で状態管理ロジックが集約
- フォーム管理ロジックが各所に散在
- 日付計算ロジックが重複している
- カラー定義がハードコードされている

### リファクタリング後の構成

```
src/
├── components/
│   ├── ui/                      # 再利用可能なUIコンポーネント（shadcn/ui）
│   ├── budget/                  # 予算管理関連コンポーネント
│   │   ├── BudgetChart.tsx
│   │   └── BudgetSummaryCards.tsx
│   ├── fridge/                  # 冷蔵庫管理関連コンポーネント（新規）
│   │   ├── FridgeAddForm.tsx           # 手動追加フォーム（新規・100行）
│   │   ├── CategorySection.tsx         # カテゴリ別セクション（新規・150行）
│   │   └── FridgeItemCard.tsx          # 食材カード（新規・100行）
│   ├── receipt/                 # レシート関連コンポーネント
│   │   ├── CameraCapture.tsx
│   │   └── FileUploadSection.tsx
│   ├── recipes/                 # レシピ関連コンポーネント
│   │   ├── RecipeCard.tsx
│   │   └── RecipesHeader.tsx
│   ├── BudgetOverview.tsx       # 予算管理コンポーネント（メインコンポーネント）
│   ├── FridgeView.tsx           # 冷蔵庫管理コンポーネント（145行・78.9%削減）
│   ├── ReceiptScanner.tsx       # レシートスキャナーコンポーネント
│   ├── RecipesSuggestion.tsx    # レシピ提案コンポーネント
│   ├── TodayBasket.tsx          # 今日のバスケットコンポーネント
│   ├── FridgeItemEditor.tsx     # 食材編集コンポーネント
│   ├── ExpiringItemsModal.tsx   # 期限切れ食材モーダル
│   └── StorageTipsModal.tsx     # 保存方法ヒントモーダル
│
├── hooks/                       # カスタムReactフック
│   ├── useFridgeForm.ts         # フォーム状態管理フック（新規）
│   ├── useFridgeState.ts        # 冷蔵庫状態管理フック（新規・一元管理）
│   ├── useBudgetCalculations.ts # 予算計算フック
│   ├── useExpiryStatus.ts       # 期限切れステータスフック
│   ├── useGeminiReceiptAnalysis.ts # Gemini API連携フック
│   ├── useGeminiRecipes.ts      # Gemini レシピ提案フック
│   ├── useLocalStorage.ts       # localStorage管理フック
│   ├── useStorageTips.ts        # 保存方法ヒントフック
│   ├── use-mobile.tsx           # モバイル判定フック
│   └── use-toast.ts             # トースト通知フック
│
├── lib/                         # ユーティリティ関数
│   ├── apiSecurity.ts           # API セキュリティ・レート制限
│   └── utils.ts                 # Tailwind CSS統合
│
├── types/                       # TypeScript型定義
│   └── food.ts                  # 食品関連の型定義
│
├── utils/                       # 汎用ユーティリティ
│   ├── categoryUtils.ts         # カテゴリ関連のユーティリティ
│   ├── dateUtils.ts             # 日付計算ユーティリティ（拡張）
│   ├── foodUtils.ts             # 食品関連のユーティリティ
│   ├── food/                    # 食品処理モジュール
│   │   ├── calculationUtils.ts  # 計算ユーティリティ
│   │   ├── expiryUtils.ts       # 期限管理ユーティリティ
│   │   ├── searchSortUtils.ts   # 検索・ソートユーティリティ
│   │   └── validationUtils.ts   # バリデーションユーティリティ
│   ├── receipt/                 # レシート処理モジュール
│   │   ├── jsonParser.ts        # JSON解析ユーティリティ
│   │   └── receiptProcessor.ts  # レシート処理ユーティリティ
│   └── recipes/                 # レシピ処理モジュール
│       └── recipeUtils.ts       # レシピユーティリティ
│
├── constants/                   # 定数管理
│   └── index.ts                 # 定数定義（CATEGORY_COLORS 追加）
│
├── styles/                      # スタイルファイル
│   └── atlassian-colors.css     # Atlassian カラーパレット
│
├── pages/                       # ページコンポーネント
│   ├── Index.tsx                # メインページ（187行・38.7%削減）
│   └── NotFound.tsx             # 404ページ
│
├── test/                        # テスト関連
│   ├── mocks/
│   │   ├── handlers.ts          # MSW ハンドラー
│   │   └── server.ts            # MSW サーバー
│   ├── setup.ts                 # テストセットアップ
│   └── utils.tsx                # テストユーティリティ
│
├── App.tsx                      # メインアプリケーションコンポーネント
├── main.tsx                     # アプリケーションエントリーポイント
├── index.css                    # グローバルスタイル
├── vite-env.d.ts                # Vite環境型定義
└── App.css                      # アプリケーション固有スタイル
```

**リファクタリングの改善:**

| 項目 | 削減前 | 削減後 | 改善度 |
|------|--------|--------|--------|
| **FridgeView** | 687行 | 145行 | **78.9%削減** ✨ |
| **Index.tsx** | 305行 | 187行 | **38.7%削減** |
| **合計削減** | 992行 | 332行 | **66.6%削減** |
| **FridgeView useState** | 7個 | 3個 | **57%削減** |
| **コンポーネント分割** | - | 4個追加 | コンポーネント数 +4 |
| **フック追加** | - | 2個追加 | フック数 +2 |

**改善のメリット:**
- ✅ 単一責務の原則（SRP）に準拠
- ✅ テスト容易性の向上
- ✅ コンポーネント再利用性の向上
- ✅ 保守性の向上（バグ削減）
- ✅ 関心の分離により読みやすさ向上
- ✅ 状態管理の一元化で予測可能性向上