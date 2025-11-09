# ⚡ GitHub Actions クイックスタートガイド

**対象:** CI/CD パイプラインを最短で理解したい開発者向け

---

## 🚀 30秒で分かる GitHub Actions

### What（何か）
```
GitHub がコード自動テスト・ビルド・デプロイを行う
```

### Why（なぜか）
```
手動でテストするのは面倒で、バグも増える
→ 自動化で品質を保証！
```

### How（どのように）
```
コードを push → 自動でテスト実行 → 成功/失敗を通知
```

---

## 📋 ワークフロー実行タイミング

```bash
# ① main ブランチに push
git push origin main
  ↓
# ② GitHub Actions が自動開始
# ③ 4つのチェックを順に実行
# ④ 成功なら「✅ All checks passed」
# ④ 失敗なら「❌ Some checks failed」を PR に表示
```

---

## ✅ ローカル実行（推奨）

PR を作成する前に、必ずこれを実行：

```bash
# 1行で全チェック実行
npm run lint && npm run test && npm run build
```

**出力例（成功時）：**
```
✨ ESLint チェック... ✓ OK
✨ テスト実行... ✓ 43 tests passed
✨ TypeScript チェック... ✓ OK
✨ ビルド... ✓ dist/ 生成完了

🎉 すべてのチェック成功！PR を作成できます
```

**出力例（失敗時）：**
```
❌ ESLint エラー：
  src/components/Foo.tsx:42 - セミコロン欠落

修正してから再度実行してください
```

---

## 🔍 GitHub UI での確認

### Pull Request を作成した場合

```
PR ページ
  ↓
Checks セクション
  ├─ 📋 lint (ESLint)
  ├─ 🧪 test (Vitest)
  ├─ 🔨 build (Vite)
  └─ 🌐 e2e (Playwright - 準備中)
```

### Actions タブで詳細を確認

```
リポジトリ
  → Actions タブ
    → 「CI/CD Pipeline」
      → 最新の実行を選択
        → 失敗したジョブのログを確認
```

---

## 🛠️ 各チェックの手動実行

### ESLint（コード品質チェック）

```bash
npm run lint

# 自動修正可能なエラーを自動修正
npx eslint . --fix
```

**失敗例：**
```javascript
// ❌ セミコロン欠落
const name = "John"

// ❌ 未使用変数
const unused = 123

// ❌ スペース不足
const obj={a:1}
```

### Vitest（テスト実行）

```bash
# すべてのテストを実行
npm run test

# カバレッジ付きで実行
npm run test:coverage

# 特定のテストだけ実行
npm run test -- FridgeView

# UI で実行（ビジュアル表示）
npm run test:ui
```

### ビルド検証

```bash
# TypeScript チェック
npx tsc --noEmit

# ビルド実行
npm run build

# ビルド成果物を確認
ls -lh dist/
```

---

## ❌ 失敗時の対応（フローチャート）

```
❌ チェック失敗
  │
  ├─ ESLint エラー？
  │  └─ npx eslint . --fix で修正
  │
  ├─ テスト失敗？
  │  └─ npm run test で確認 → テスト修正
  │
  ├─ ビルド失敗？
  │  └─ npx tsc --noEmit で確認 → ソース修正
  │
  └─ 何度やっても失敗？
     └─ docs/github-actions-guide.md のトラブルシューティングを参照
```

---

## 📊 よくある失敗パターンと対応

### パターン① セミコロン欠落

```javascript
// ❌ ESLint が怒る
const name = "John"

// ✅ 修正
const name = "John";
```

**対応:**
```bash
npx eslint . --fix  # 自動修正
```

### パターン② 未使用変数

```javascript
// ❌ 変数を定義したが使わない
const temp = 123;

// ✅ 使うか削除
console.log(temp);
```

**対応:**
```bash
npx eslint . --fix  # 自動修正
```

### パターン③ テスト失敗

```bash
❌ Expected "Updated" to be called
  at src/components/FridgeView.test.tsx:42
```

**対応:**
```bash
npm run test  # ログで詳細確認

# テストファイルを修正
# src/components/FridgeView.test.tsx の該当行を修正

npm run test  # 成功確認
```

### パターン④ 型エラー

```typescript
// ❌ string 型なのに number を代入
const name: string = 123;
```

**対応:**
```bash
npx tsc --noEmit  # エラー箇所確認

# ソースを修正
// ✅ 型を合わせる
const name: string = "John";
```

---

## 🎯 ベストプラクティス

### ✅ やるべきこと

```bash
# 開発終了時
1. ローカルで全チェック実行
npm run lint && npm run test && npm run build

# すべて成功したら
2. PR を作成
3. レビューを依頼
```

### ❌ やらないこと

```
# テストも実行せずに PR 作成
→ CI が失敗 → 時間の無駄

# GitHub Actions の失敗を無視
→ main ブランチが壊れる

# 大量のファイルを一度に変更
→ レビュアーの負担が大きい
```

---

## 🔗 詳しく知りたい場合

| 内容 | 参照先 |
|------|--------|
| **詳細な説明が欲しい** | `docs/github-actions-guide.md` |
| **セットアップが必要** | `docs/CI-CD-SETUP.md` |
| **Phase 2 の完全なサマリー** | `PHASE2-SUMMARY.md` |

---

## 💡 Tips

### 📊 カバレッジレポートを見たい

```bash
npm run test:coverage:report

# → coverage/index.html がブラウザで開く
# → 赤 = テストされていない部分が視覚的に分かる
```

### 🧪 特定のテストだけ実行したい

```bash
npm run test -- FridgeView  # FridgeView に関するテストのみ
npm run test -- --grep="削除"  # 「削除」を含むテストのみ
```

### 🎨 ESLint ルールを一括修正

```bash
npx eslint . --fix
# 多くの問題が自動修正される
# 修正できない問題だけ手動修正
```

### 📝 コミットメッセージのフォーマット

```bash
# ✅ 良い例
git commit -m "feat: 新しい機能を追加"
git commit -m "fix: バグを修正"
git commit -m "test: テストを追加"

# ❌ 悪い例
git commit -m "update"
git commit -m "bugfix"
git commit -m "てすと"
```

---

## ⏱️ 実行時間の目安

| チェック | 実行時間 | 説明 |
|---------|---------|------|
| **ESLint** | ~2秒 | 高速 |
| **テスト** | ~10秒 | 普通 |
| **ビルド** | ~5秒 | 普通 |
| **合計** | ~17秒 | 素早い |

**GitHub Actions での実行時間は 2-3倍遅い（環境起動のため）**

---

## 🎯 最小限の手順

**急いでいる場合：**

```bash
# 1. 変更を確認
git status

# 2. ローカルでテスト
npm run lint && npm run test && npm run build

# 3. 成功なら PR 作成
git push origin your-branch-name
# → GitHub で PR を作成

# 4. GitHub Actions 実行中...
# → すべて成功したら マージ可能！
```

---

## 📞 困ったときは

1. **ローカルで再現する**
   ```bash
   npm run lint && npm run test && npm run build
   ```

2. **詳細なログを確認する**
   ```bash
   npm run lint  # ESLint のエラー内容確認
   npm run test  # テストのエラー内容確認
   ```

3. **ドキュメントを参照**
   - `docs/github-actions-guide.md` → トラブルシューティング
   - `docs/CI-CD-SETUP.md` → よくある質問

4. **チームに相談**
   - Slack でメッセージ
   - 議論は PR コメントで

---

## 🎉 成功の確認

**GitHub Actions が成功すると：**

```
PR ページに
  ✅ lint (PASSED)
  ✅ test (PASSED)
  ✅ build (PASSED)

と表示される
  ↓
「Merge pull request」ボタンが有効化
  ↓
クリックして main にマージ完了！
```

---

**次回開発時のチェックリスト：**

```
□ 開発完了
□ npm run lint && npm run test && npm run build を実行
□ すべて成功
□ PR を作成
□ GitHub Actions が自動実行
□ すべてのチェックが成功
□ PR をマージ
```

**Happy Coding! 🚀**

