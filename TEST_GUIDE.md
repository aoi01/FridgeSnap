# 🧪 Kitchen Sensei Go - テスト実行ガイド

## 📋 **セットアップ手順**

### 1. テスト環境の構築

```bash
# 1. テスト関連の依存関係をインストール
npm install @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui vitest jsdom msw @types/testing-library__jest-dom happy-dom --save-dev

# 2. package.jsonにテストスクリプトを追加
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:run="vitest run"
npm pkg set scripts.test:coverage="vitest run --coverage"
npm pkg set scripts.test:watch="vitest --watch"
```

### 2. 設定ファイルの確認

以下のファイルが正しく配置されていることを確認：

```
src/
├── test/
│   ├── setup.ts          # テストセットアップ
│   ├── utils.tsx         # テストユーティリティ
│   └── mocks/
│       ├── handlers.ts   # MSW ハンドラー
│       └── server.ts     # MSW サーバー
├── utils/
│   ├── foodUtils.ts      # ユーティリティ関数
│   └── foodUtils.test.ts # ユーティリティテスト
└── components/
    ├── FridgeItemEditor.test.tsx
    ├── TodayBasket.test.tsx
    └── ReceiptScanner.test.tsx

vitest.config.ts          # Vitest設定
TEST_GUIDE.md             # このファイル
```

## 🚀 **テスト実行コマンド**

### 基本的なテスト実行

```bash
# 全てのテストを実行
npm run test

# ウォッチモードでテスト実行（ファイル変更時に自動再実行）
npm run test:watch

# テストを一回だけ実行（CI用）
npm run test:run

# UIモードでテスト実行（ブラウザベースのテストランナー）
npm run test:ui

# カバレッジレポート付きでテスト実行
npm run test:coverage
```

### 特定のテストファイルを実行

```bash
# 特定のファイルのテストのみ実行
npm run test foodUtils.test.ts

# 特定のパターンにマッチするテストファイルを実行
npm run test components/

# 特定のテストケースのみ実行
npm run test -- --grep "食材編集"
```

### デバッグモード

```bash
# デバッグモードでテスト実行
npm run test -- --inspect

# Verbose出力でテスト実行
npm run test -- --reporter=verbose

# 失敗したテストのみ再実行
npm run test -- --retry=3
```

## 📊 **テストカバレッジの確認**

### カバレッジレポートの生成

```bash
# HTMLレポート付きでカバレッジを取得
npm run test:coverage

# 生成されたレポートを確認
open coverage/index.html
```

### カバレッジの目標値

```typescript
// vitest.config.ts で設定済み
coverage: {
  thresholds: {
    global: {
      branches: 70,    // 分岐カバレッジ 70%以上
      functions: 80,   // 関数カバレッジ 80%以上
      lines: 85,       // 行カバレッジ 85%以上
      statements: 85   // 文カバレッジ 85%以上
    }
  }
}
```

## 🔍 **テストの種類と実行方法**

### 1. ユニットテスト（Unit Tests）

```bash
# ユーティリティ関数のテスト
npm run test utils/

# 期待されるテスト内容:
# ✅ 日数計算の正確性
# ✅ 期限状態判定の正確性
# ✅ データ検証ロジック
# ✅ エラーハンドリング
```

### 2. コンポーネントテスト（Component Tests）

```bash
# 個別コンポーネントのテスト
npm run test FridgeItemEditor.test.tsx
npm run test TodayBasket.test.tsx

# 期待されるテスト内容:
# ✅ 正しいレンダリング
# ✅ ユーザーインタラクション
# ✅ プロップスの処理
# ✅ 状態変更の確認
```

### 3. API統合テスト（Integration Tests）

```bash
# API統合テスト（MSWを使用）
npm run test ReceiptScanner.test.tsx

# 期待されるテスト内容:
# ✅ APIリクエストの送信
# ✅ レスポンスの処理
# ✅ エラーハンドリング
# ✅ ローディング状態
```

### 4. E2Eテスト（End-to-End Tests）

```bash
# E2Eテストのセットアップ（追加実装が必要）

# Playwright使用の場合:
npm install @playwright/test --save-dev
npx playwright install
npx playwright test

# Cypress使用の場合:
npm install cypress --save-dev
npx cypress open
```

## 🎯 **テストファイルの命名規則**

```
src/
├── utils/
│   ├── foodUtils.ts
│   └── foodUtils.test.ts        # ✅ ユーティリティテスト
├── components/
│   ├── FridgeView.tsx
│   └── FridgeView.test.tsx      # ✅ コンポーネントテスト
├── hooks/
│   ├── useFoodManagement.ts
│   └── useFoodManagement.test.ts # ✅ Hooksテスト
└── services/
    ├── geminiService.ts
    └── geminiService.test.ts     # ✅ サービステスト
```

## 🔧 **よく使用するテストパターン**

### 1. コンポーネントのレンダリングテスト

```typescript
test('コンポーネントが正しくレンダリングされる', () => {
  render(<MyComponent />)
  expect(screen.getByText('期待するテキスト')).toBeInTheDocument()
})
```

### 2. ユーザーインタラクションテスト

```typescript
test('ボタンクリックで適切な処理が実行される', async () => {
  const user = userEvent.setup()
  const mockHandler = vi.fn()
  
  render(<MyComponent onClick={mockHandler} />)
  
  await user.click(screen.getByRole('button'))
  expect(mockHandler).toHaveBeenCalledTimes(1)
})
```

### 3. 非同期処理のテスト

```typescript
test('非同期データの読み込み', async () => {
  render(<MyComponent />)
  
  expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('データ表示')).toBeInTheDocument()
  })
})
```

### 4. エラーハンドリングのテスト

```typescript
test('エラー状態の適切な表示', async () => {
  // エラーレスポンスをモック
  mockServer.use(
    http.get('/api/data', () => {
      return HttpResponse.error()
    })
  )
  
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText(/エラー/)).toBeInTheDocument()
  })
})
```

## 🐛 **トラブルシューティング**

### 1. テストが失敗する場合

```bash
# 詳細なエラー情報を取得
npm run test -- --reporter=verbose

# 特定のテストのみ実行してデバッグ
npm run test -- --grep "失敗するテスト名"

# ブラウザベースのデバッグ
npm run test:ui
```

### 2. モックが動作しない場合

```bash
# MSWサーバーの状態確認
npm run test -- --grep "API" --reporter=verbose

# モックハンドラーのログ確認
# src/test/mocks/server.ts で enableRequestLogging() を呼び出す
```

### 3. カバレッジが低い場合

```bash
# 詳細なカバレッジレポートを確認
npm run test:coverage

# 未テストファイルの確認
npx vitest --coverage --reporter=verbose
```

### 4. パフォーマンス問題

```bash
# テスト実行時間の確認
npm run test -- --reporter=verbose

# 並列実行の調整（vitest.config.tsで設定）
# pool: 'threads' または 'forks'
```

## 📈 **CI/CD での実行**

### GitHub Actions の例

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🎯 **ベストプラクティス**

### 1. テストの書き方

- **AAA パターン**: Arrange（準備）→ Act（実行）→ Assert（検証）
- **意味のあるテスト名**: 何をテストしているかが明確に分かる名前
- **独立性**: 各テストは他のテストに依存しない
- **再現性**: 同じ結果が得られることを保証

### 2. モックの使用

- **必要最小限**: 本当に必要な部分のみモック
- **現実的なデータ**: 実際のデータ構造に近いモックデータ
- **エラーケース**: 正常系だけでなく異常系もテスト

### 3. パフォーマンス

- **並列実行**: テストの独立性を保って並列実行
- **選択的実行**: 変更に関連するテストのみ実行
- **キャッシュ活用**: 依存関係のキャッシュを有効活用


### ドキュメント

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library公式ドキュメント](https://testing-library.com/)
- [MSW公式ドキュメント](https://mswjs.io/)

### よくある質問

**Q: テストが遅い**
A: 並列実行の設定、不要なモックの削除、テストの粒度調整を検討

**Q: モックが効かない**
A: setup.tsの設定確認、MSWハンドラーの順序確認

**Q: E2Eテストの導入方法**
A: Playwright または Cypress の導入を検討（別途セットアップが必要）

---

このガイドに従って、Kitchen Sensei Goプロジェクトの包括的なテストスイートを構築・運用できます。テストは継続的な品質向上の要であり、定期的な実行とメンテナンスが重要です。