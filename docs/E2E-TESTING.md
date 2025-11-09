# 🌐 E2E テスト完全ガイド

## 📌 概要

E2E（End-to-End）テストは、実際のブラウザを使用してユーザーのシナリオをテストします。

```
従来のユニットテスト：関数単体
    ↓
E2E テスト：ユーザーの実際の行動をテスト
```

---

## 🎯 E2E テストの目的

### ユーザーのシナリオをテスト

```
1. ページを開く
2. 「追加」ボタンをクリック
3. フォームに入力
4. 「保存」をクリック
5. 食材がリストに表示される

↑ この一連の流れをテスト
```

### 複数ブラウザで動作確認

```
Chrome (Chromium)
Firefox
Safari (WebKit)

すべてで同じテストを実行
```

---

## 🚀 E2E テスト実行方法

### 前提条件

```bash
# ローカル開発サーバーが起動していること
npm run dev
```

### テスト実行（全ブラウザ）

```bash
npm run test:e2e
```

### 特定ブラウザのみ実行

```bash
# Chrome のみ
npm run test:e2e -- --project=chromium

# Firefox のみ
npm run test:e2e -- --project=firefox

# Safari のみ
npm run test:e2e -- --project=webkit
```

### UI モード（ビジュアル実行）

```bash
npm run test:e2e:ui
```

**特徴：**
- ブラウザ操作をリアルタイムで見える
- 各ステップを手動で進められる
- デバッグに最適

### デバッグモード

```bash
npm run test:e2e:debug
```

**特徴：**
- Playwright Inspector が開く
- ステップバイステップで実行
- 各時点で状態を確認可能

---

## 📊 テスト構成

### 冷蔵庫管理機能 テスト（実装済み）

**ファイル:** `tests/e2e/fridge-management.spec.ts`

#### テストケース一覧

```
✅ 基本機能テスト
  - 冷蔵庫ビューが表示される

✅ 食材追加テスト
  - 新しい食材を追加できる

✅ 食材編集テスト
  - 食材を編集できる

✅ 食材削除テスト
  - 食材を削除できる

✅ カテゴリ表示テスト
  - カテゴリが表示される

✅ 賞味期限表示テスト
  - 賞味期限が表示される

✅ パフォーマンステスト
  - ページが 3 秒以内に読み込まれる

✅ レスポンシブテスト
  - モバイル、デスクトップ画面での動作確認
```

### 準備中のテスト

以下は実装予定です：

- `receipt-scanner.spec.ts` - レシートスキャン機能
- `basket-management.spec.ts` - バスケット機能
- `budget.spec.ts` - 予算管理機能
- `expiring-items.spec.ts` - 賞味期限管理機能

---

## 🎨 テスト技術の説明

### Locator（要素の検索）

```typescript
// テキストで検索
page.locator('text=追加')

// ボタンで検索
page.locator('button:has-text("追加")')

// クラスで検索
page.locator('.submit-button')

// ID で検索
page.locator('#food-input')

// Type で検索
page.locator('input[type="text"]')
```

### ユーザー操作

```typescript
// クリック
await element.click()

// テキスト入力
await input.fill('テスト食材')

// テキスト追加入力
await input.type('追加')

// テキスト消去
await input.clear()

// キーボード操作
await page.keyboard.press('Enter')

// スクロール
await element.scrollIntoViewIfNeeded()
```

### 待機

```typescript
// ネットワーク完了まで待機
await page.waitForLoadState('networkidle')

// 要素が表示されるまで待機
await expect(element).toBeVisible({ timeout: 5000 })

// 時間待機
await page.waitForTimeout(1000)  // 1秒待機
```

### アサーション（確認）

```typescript
// 要素が表示されている
await expect(element).toBeVisible()

// テキストを含む
await expect(element).toContainText('期限切れ')

// 要素の個数
expect(await elements.count()).toBe(3)

// 時間計測
expect(loadTime).toBeLessThan(3000)  // 3秒以内
```

---

## 🐛 E2E テストのデバッグ

### 失敗時の確認

1. **ログを確認**
   ```bash
   npm run test:e2e -- --headed
   ```
   `--headed` フラグでブラウザを見える状態で実行

2. **UI モードで実行**
   ```bash
   npm run test:e2e:ui
   ```
   ビジュアルで操作状況を確認

3. **スクリーンショット確認**
   ```
   テスト失敗時に自動保存される
   → playwright-report/ に保存
   ```

4. **ビデオ確認**
   ```
   失敗時にビデオが記録される
   → playwright-report/ に保存
   ```

### 一般的な失敗原因

| 原因 | 対応方法 |
|------|---------|
| **要素が見つからない** | Locator を修正（button, input の名前確認） |
| **タイムアウト** | `waitForTimeout` を増やす |
| **レイアウト変更** | レスポンシブ対応の確認 |
| **API が遅い** | `waitForLoadState('networkidle')` を追加 |

---

## 📝 E2E テスト書き方（パターン）

### パターン 1: 単純なクリック

```typescript
test('ボタンをクリックできる', async ({ page }) => {
  const button = page.locator('button:has-text("追加")');
  await button.click();
});
```

### パターン 2: フォーム入力

```typescript
test('フォームに入力できる', async ({ page }) => {
  const input = page.locator('input[type="text"]');
  await input.fill('テスト');

  const button = page.locator('button:has-text("保存")');
  await button.click();
});
```

### パターン 3: 要素の確認

```typescript
test('要素が表示される', async ({ page }) => {
  const element = page.locator('text=テスト');
  await expect(element).toBeVisible({ timeout: 5000 });
});
```

### パターン 4: 複数ステップ

```typescript
test('複数のステップを実行', async ({ page }) => {
  // ステップ 1: ページにアクセス
  await page.goto('/');

  // ステップ 2: ボタンをクリック
  const button = page.locator('button:has-text("追加")');
  await button.click();

  // ステップ 3: フォーム入力
  const input = page.locator('input[type="text"]');
  await input.fill('テスト');

  // ステップ 4: 確認
  const saveButton = page.locator('button:has-text("保存")');
  await saveButton.click();

  // ステップ 5: 結果確認
  const result = page.locator('text=テスト');
  await expect(result).toBeVisible();
});
```

---

## ✅ チェックリスト（E2E テスト作成時）

```
□ beforeEach で初期設定（ページ移動など）
□ ユーザーのシナリオを段階的に実装
□ 各操作後に待機処理を入れる
□ 最終的な結果を assertする
□ レスポンシブ対応をテスト
□ エラーケースもテスト
□ テストコメント（日本語）を充実
```

---

## 📊 パフォーマンステスト

### ロード時間計測

```typescript
test('ページが 3 秒以内に読み込まれる', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);  // 3秒以内
});
```

### リソース使用量

```typescript
test('メモリ使用量を確認', async ({ page }) => {
  const metrics = await page.metrics();

  // JSHeapSize: JavaScript メモリ使用量
  expect(metrics.JSHeapSize).toBeLessThan(50 * 1024 * 1024);  // 50MB以下
});
```

---

## 🔒 E2E テストのベストプラクティス

### ✅ やるべきこと

```typescript
// ✅ 明確なテスト名
test('食材を追加できる', async ({ page }) => { ... })

// ✅ 待機を適切に
await page.waitForLoadState('networkidle')

// ✅ エラーハンドリング
if (await button.count() > 0) {
  await button.click()
}

// ✅ 日本語コメント
// ボタンをクリック
await button.click()
```

### ❌ やらないこと

```typescript
// ❌ テスト名が曖昧
test('test1', async ({ page }) => { ... })

// ❌ 待機なし
await page.goto('/');  // すぐに操作

// ❌ エラーハンドリングなし
const button = page.locator('button')  // ない可能性
await button.click()  // エラーになる

// ❌ コメントなし
await page.locator('button:has-text("追加")').click()
```

---

## 🚀 CI/CD との連携

### GitHub Actions で自動実行

```yaml
# .github/workflows/test-and-build.yml

e2e:
  name: 🌐 E2E テスト
  runs-on: ubuntu-latest

  steps:
    - npm run test:e2e
    - アーティファクト保存（失敗時）
```

### 成功/失敗の判定

```
✅ すべてのテスト成功
   → PR マージ可能

❌ テスト失敗
   → playwright-report/ をダウンロード
   → スクリーンショット・ビデオを確認
```

---

## 📈 テストカバレッジ（Phase 3）

| 機能 | テスト | ステータス |
|------|-------|----------|
| **冷蔵庫表示** | fridge-management.spec.ts | ✅ 実装中 |
| **レシート** | receipt-scanner.spec.ts | ⏳ 予定 |
| **バスケット** | basket-management.spec.ts | ⏳ 予定 |
| **予算** | budget.spec.ts | ⏳ 予定 |
| **賞味期限** | expiring-items.spec.ts | ⏳ 予定 |

---

## 🎓 Playwright の主要機能

### ブラウザ制御

```typescript
// ページにアクセス
await page.goto('https://example.com')

// ページをリロード
await page.reload()

// 戻る/進む
await page.goBack()
await page.goForward()
```

### スクリーンショット

```typescript
// スクリーンショット撮影
await page.screenshot({ path: 'screenshot.png' })

// 要素のみ
await element.screenshot({ path: 'element.png' })
```

### PDF エクスポート

```typescript
// PDF 出力
await page.pdf({ path: 'page.pdf' })
```

### ネットワーク監視

```typescript
// ネットワークリクエストを監視
page.on('request', request => {
  console.log(request.url())
})
```

---

## 💡 トラブルシューティング

### テストが遅い

```bash
# 原因: ブラウザの起動が遅い
# 対応: workers を増やす
npm run test:e2e -- --workers=4
```

### 要素が見つからない

```typescript
// 原因: Locator が間違っている
// 対応: デバッグモードで確認
npm run test:e2e:debug

// または UI モード
npm run test:e2e:ui
```

### タイムアウト

```typescript
// 原因: 処理に時間がかかる
// 対応: タイムアウトを増やす
await expect(element).toBeVisible({ timeout: 10000 })  // 10秒
```

---

## 📚 参考資料

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/css-selectors)

---

**次は Phase 4 でカバレッジを 80% 以上に改善します！** 🚀

