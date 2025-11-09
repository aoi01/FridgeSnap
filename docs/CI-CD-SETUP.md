# 🚀 CI/CD セットアップ手順

## 📌 概要

Fridge Snap プロジェクトの CI/CD パイプラインを GitHub Actions で構築しました。

このドキュメントは、セットアップ後の初期設定手順を説明します。

---

## 🔧 セットアップ手順

### ✅ ステップ 1: GitHub リポジトリ設定

#### 1-1. ブランチ保護ルールの設定

GitHub で主要ブランチを保護します：

1. **リポジトリを開く**
2. **Settings → Branches をクリック**
3. **Add rule ボタンをクリック**
4. **Branch name pattern:** `main` と入力
5. **以下の項目にチェック：**
   ```
   ✅ Require a pull request before merging
   ✅ Require approvals (数値: 1)
   ✅ Require status checks to pass before merging
       - lint
       - test
       - build
   ✅ Require branches to be up to date before merging
   ✅ Include administrators
   ```

#### 理由：

これにより、**以下が保証されます**：

```
main ブランチへの直接プッシュ ❌ 禁止
    ↓
PR 作成が必須
    ↓
自動テストを実行（GitHub Actions）
    ↓
すべてのテストが成功した場合のみマージ可能
```

### ✅ ステップ 2: Codecov 統合（オプション）

#### 2-1. Codecov サイトでリポジトリを登録

1. **https://codecov.io にアクセス**
2. **GitHub でサインイン**
3. **リポジトリを選択**
4. **Upload token をコピー**

#### 2-2. GitHub Secrets に登録

1. **リポジトリの Settings → Secrets → New repository secret**
2. **Name:** `CODECOV_TOKEN`
3. **Value:** コピーしたトークンを貼付け
4. **Add secret ボタンをクリック**

#### 2-3. workflow ファイルの修正（オプション）

`.github/workflows/test-and-build.yml` で Codecov の失敗時の動作を設定：

```yaml
- name: Codecov にカバレッジを送信
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}  # ← トークンを使用
    fail_ci_if_error: false              # エラーでも CI を続行
```

### ✅ ステップ 3: Slack 通知（オプション）

#### 3-1. Slack App を作成

1. **https://api.slack.com/apps にアクセス**
2. **"Create New App" → "From scratch"**
3. **App Name:** `Fridge Snap CI`
4. **Workspace:** 通知先ワークスペース選択

#### 3-2. Webhook を生成

1. **"Incoming Webhooks" をクリック**
2. **"Add New Webhook to Workspace"**
3. **通知先チャンネルを選択（例：#deployments）**
4. **Webhook URL をコピー**

#### 3-3. GitHub Secrets に登録

1. **Settings → Secrets → New repository secret**
2. **Name:** `SLACK_WEBHOOK_URL`
3. **Value:** Webhook URL を貼付け

#### 3-4. workflow に通知を追加

`.github/workflows/test-and-build.yml` の最後に追加：

```yaml
- name: Slack に通知
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "🚀 CI パイプライン",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Fridge Snap CI 結果*\n状態: ${{ job.status }}"
            }
          }
        ]
      }
```

---

## 🧪 動作確認

### ✅ 手順 1: テスト実行

#### ローカルで実行

```bash
# すべてのチェックを実行
npm run lint && npm run test:coverage && npm run build

# または個別に
npm run lint              # ESLint
npm run test             # テスト
npm run test:coverage    # カバレッジ付きテスト
npm run build            # ビルド
```

#### GitHub Actions で実行

1. **何かコミットして main ブランチにプッシュ**
2. **リポジトリの Actions タブを開く**
3. **"CI/CD Pipeline" ワークフローをクリック**
4. **各ジョブのログを確認**

### ✅ 手順 2: PR でテスト

1. **新しいブランチを作成**
   ```bash
   git checkout -b test/github-actions
   ```

2. **何か変更してコミット**
   ```bash
   git add .
   git commit -m "test: GitHub Actions テスト"
   ```

3. **GitHub にプッシュ**
   ```bash
   git push origin test/github-actions
   ```

4. **PR を作成**
   ```
   Create Pull Request ボタンをクリック
   ```

5. **GitHub Actions が自動実行される**
   ```
   PR ページで "Checks" セクションをチェック
   ```

6. **すべてのチェックが成功したら**
   ```
   "Merge pull request" ボタンが有効化
   ```

---

## 📊 ワークフローの監視

### 📈 定期的に確認すべき項目

| 項目 | 確認頻度 | 目標 |
|------|---------|------|
| **テスト成功率** | 毎日 | 100% |
| **カバレッジ率** | 週1回 | 80% 以上 |
| **ビルド時間** | 月1回 | 5分以下 |
| **ESLint 警告** | 毎日 | 0件 |

### 🔍 ダッシュボードの見方

#### GitHub Actions ダッシュボード

```
リポジトリ → Actions
    ↓
最新のワークフロー実行が表示
    ↓
緑色 ✅ = 成功
赤色 ❌ = 失敗
黄色 ⚠️ = 実行中
```

#### Codecov ダッシュボード

```
https://codecov.io/gh/your-username/fridge-snap
    ↓
- カバレッジの推移グラフ
- ファイル別のカバレッジ
- 低下したファイルのアラート
```

---

## 🚨 失敗時の対応

### ❌ ESLint が失敗した場合

```bash
# 1. ローカルで確認
npm run lint

# 2. 自動修正を試す
npx eslint . --fix

# 3. 修正をコミット
git add .
git commit -m "style: ESLint 違反を修正"

# 4. プッシュ
git push origin your-branch-name
```

### ❌ テストが失敗した場合

```bash
# 1. ローカルで実行
npm run test

# 2. 失敗したテストを確認
npm run test -- --reporter=verbose

# 3. テストを修正
# (src/components/FridgeView.test.tsx など)

# 4. テスト成功を確認
npm run test

# 5. コミット
git add .
git commit -m "test: テストを修正"

# 6. プッシュ
git push origin your-branch-name
```

### ❌ ビルドが失敗した場合

```bash
# 1. TypeScript エラーを確認
npx tsc --noEmit

# 2. ローカルでビルド
npm run build

# 3. エラー内容を確認
# ファイルを修正

# 4. ビルド成功を確認
npm run build

# 5. コミット
git add .
git commit -m "fix: ビルドエラーを修正"

# 6. プッシュ
git push origin your-branch-name
```

---

## 📝 よくある質問

### Q1: GitHub Actions の使用量に制限はあるか？

**A:** GitHub の無料プランでは月に 2,000 分無料です。

```
Fridge Snap の CI パイプライン：
- 実行時間：約 7 分
- 月の PR 数：30 回
- 月の使用量：7 × 30 = 210 分

→ 十分に無料枠内！
```

### Q2: 開発中は CI を無視できるか？

**A:** いいえ。以下のため避けてください：

```
- ブランチ保護ルールに違反
- PR がマージできない
- チームの品質基準が低下
```

**代わりに：**

```bash
# ローカルで先に実行
npm run lint && npm run test && npm run build

# 成功したら PR を作成
```

### Q3: CI 設定を変更したい

**A:** `.github/workflows/test-and-build.yml` を編集：

```yaml
# 例：実行タイミングを追加
on:
  push:
    branches:
      - main
      - develop  # ← 追加
```

その後、commit & push すれば新設定が適用されます。

### Q4: カバレッジ目標を変更したい

**A:** `codecov.yml` を編集：

```yaml
status:
  project:
    default:
      target: 80    # ← ここを変更
```

---

## 🎯 次のステップ

### Phase 3: E2E テスト実装

現在 E2E テストは無効化されています。以下の作業が完了したら有効化します：

1. **Playwright テストを実装**
   ```bash
   npm run test:e2e
   ```

2. **テストが安定稼働することを確認**

3. **workflow ファイルで有効化**
   ```yaml
   e2e:
     if: true  # ← false から true に変更
   ```

### Phase 4: カバレッジ改善

テストカバレッジを 70% から 80% 以上に改善：

```bash
# 1. カバレッジレポートを確認
npm run test:coverage:report

# 2. テストされていない行を特定

# 3. テストを追加

# 4. カバレッジが改善されたか確認
npm run test:coverage
```

---

## 📚 参考資料

- [GitHub Actions ガイド](./github-actions-guide.md) ← 詳細説明
- [GitHub Actions 公式ドキュメント](https://docs.github.com/en/actions)
- [Codecov 公式ドキュメント](https://docs.codecov.io/)
- [Slack GitHub Action](https://github.com/slackapi/slack-github-action)

---

## ✅ チェックリスト

セットアップ完了チェック：

```
□ GitHub Actions workflow ファイルが作成されている
□ ブランチ保護ルールが設定されている
□ Codecov トークンが登録されている（オプション）
□ Slack 通知が設定されている（オプション）
□ ローカルで npm run lint && npm run test が成功
□ PR を作成して自動テストが実行されることを確認
□ すべてのテストが成功した PR がマージ可能
```

**チェック完了：CI/CD パイプライン導入完了！ 🎉**

