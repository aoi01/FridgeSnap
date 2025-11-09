# 🚀 GitHub Actions CI/CD ガイド

## 概要

このドキュメントは、Fridge Snap プロジェクトの **GitHub Actions CI/CD パイプライン** について、詳しく解説します。

GitHub Actions は、GitHub が提供する **自動化ツール** で、コードの品質チェック、テスト実行、ビルド検証などを **自動的に実行** できます。

---

## 📚 目次

1. [GitHub Actions とは](#github-actions-とは)
2. [ワークフロー構成](#ワークフロー構成)
3. [各ジョブの詳細説明](#各ジョブの詳細説明)
4. [実行フロー図](#実行フロー図)
5. [ローカルでの動作確認](#ローカルでの動作確認)
6. [トラブルシューティング](#トラブルシューティング)
7. [カスタマイズ方法](#カスタマイズ方法)

---

## GitHub Actions とは

### 🎯 GitHub Actions の役割

GitHub Actions は、以下のような **自動化タスク** を実行します：

```
コード変更 → 静的解析 → テスト実行 → ビルド検証 → 結果報告
  ↓
 各ステップが失敗したら即座に開発者に通知
```

### ✨ メリット

| メリット | 説明 |
|---------|------|
| **自動化** | 手動での実行が不要。プッシュで自動実行 |
| **早期発見** | バグやスタイル違反を開発段階で検出 |
| **品質保証** | すべてのコードが統一されたチェックを通過 |
| **並列実行** | 複数のジョブを同時実行して時間短縮 |
| **無料** | GitHub 付属（一定の制限内） |

---

## ワークフロー構成

### 📂 ファイル構成

```
.github/
└── workflows/
    └── test-and-build.yml         # ← CI/CD ワークフロー定義
```

### 🔄 ワークフローの実行タイミング

このワークフローは以下の場合に **自動実行** されます：

```yaml
on:
  push:           # メインブランチにプッシュされた時
    branches:
      - main

  pull_request:   # プルリクエストが作成・更新された時
    branches:
      - main

  workflow_dispatch:  # GitHub UI から手動実行時
```

---

## 各ジョブの詳細説明

### 1️⃣ ESLint - コード品質チェック

#### 🎯 目的

```
JavaScriptのコード品質をチェック
    ↓
スタイル違反を検出
    ↓
バグの可能性を検出
```

#### 実行内容

| ステップ | 説明 |
|---------|------|
| **リポジトリチェックアウト** | GitHub Actions 環境にコードをコピー |
| **Node.js セットアップ** | npm コマンドが実行可能に |
| **パッケージインストール** | 依存ライブラリをダウンロード |
| **ESLint 実行** | ルール違反を検査 |

#### 失敗例

```javascript
// ❌ ESLint で検出されるエラー例：

// 未使用の変数
const unusedVar = 123;

// セミコロン欠落
const name = "John"

// スペース不足
const obj = {a:1,b:2}

// var の使用（古い構文）
var oldStyle = "使わない方がいい";
```

#### チェック方法

1. **GitHub UI で確認：**
   ```
   リポジトリ → Actions → CI/CD Pipeline → lint → ログを表示
   ```

2. **ローカルで先に実行（推奨）：**
   ```bash
   npm run lint
   ```

---

### 2️⃣ ユニットテスト - Vitest 実行

#### 🎯 目的

```
すべてのテストを実行
    ↓
機能が正常に動作することを確認
    ↓
テストカバレッジを計測
    ↓
カバレッジレポートを生成
```

#### 実行内容

| ステップ | 説明 |
|---------|------|
| **テスト実行** | Vitest で全テストを実行 |
| **カバレッジ計測** | テスト対象の割合を計算 |
| **レポート生成** | HTML形式で可視化 |
| **Codecov 送信** | 外部サービスに結果を報告 |

#### テストカバレッジについて

```
カバレッジ = テストされたコード量 / 全体のコード量

例：
- 関数が10個ある
- うち8個がテストされている
- → カバレッジ 80%
```

##### カバレッジ目標値

```yaml
thresholds:
  global:
    branches: 70%      # 分岐（if文など）
    functions: 80%     # 関数
    lines: 85%         # 行数
    statements: 85%    # ステートメント
```

#### カバレッジレポートの確認

1. **HTML レポートをダウンロード：**
   ```
   Actions → CI/CD Pipeline → test → Artifacts → coverage-report.zip
   ```

2. **ローカルで生成（推奨）：**
   ```bash
   npm run test:coverage:report
   # → coverage/index.html をブラウザで開く
   ```

---

### 3️⃣ ビルド検証 - Vite ビルド実行

#### 🎯 目的

```
プロダクション用ビルドが成功することを確認
    ↓
JavaScriptファイルが最適化される
    ↓
エラーなくデプロイ可能な状態を検証
```

#### 実行内容

| ステップ | 説明 |
|---------|------|
| **TypeScript チェック** | 型エラーがないか確認 |
| **Vite ビルド** | 本番環境用にアプリをビルド |
| **ファイル確認** | dist/ ディレクトリが生成されたか確認 |
| **成果物アップロード** | 後のデプロイのため保存 |

#### ビルドが失敗する主な原因

```typescript
// ❌ 例1: 型エラー
const name: string = 123;  // string 型なのに number を代入

// ❌ 例2: 存在しないモジュール
import { something } from '@/modules/notexist';

// ❌ 例3: JSX 記号なし
const component = <div>Hello</div>;  // React import がない
```

---

### 4️⃣ E2E テスト - Playwright 実行（準備中）

#### 🎯 目的

```
実際のブラウザでアプリを操作
    ↓
ユーザーのシナリオをテスト
    ↓
UI が正常に動作することを確認
```

#### 実行予定内容

| ステップ | 説明 |
|---------|------|
| **ブラウザ起動** | Chrome, Firefox, Safari を制御 |
| **ナビゲーション** | アプリを開く |
| **操作実行** | ボタンをクリック、テキストを入力 |
| **アサーション** | 期待される結果を確認 |

#### テスト対象（Phase 3 で実装予定）

- 冷蔵庫の食材表示・追加・削除
- レシート スキャンと AI 解析
- 今日のバスケット機能
- 予算管理
- 賞味期限警告

---

## 実行フロー図

### ⏱️ 実行順序

```
┌─────────────────────────────────────────────────────┐
│ GitHub にプッシュ / PR 作成                          │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  ESLint チェック │ (コード品質)
         └───────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
  ┌───▼──────┐      ┌──────▼─────┐
  │ テスト実行  │      │ ビルド検証   │ (並列実行)
  │(Vitest)   │      │(TypeScript) │
  └───┬──────┘      └──────┬─────┘
      │                    │
      │       ┌────────────┘
      │       │
  ┌───▼───────▼────┐
  │ E2E テスト準備中 │
  │(Playwright)    │
  └────────┬───────┘
           │
      ┌────▼─────┐
      │ 完了報告   │
      └──────────┘
```

### ⏱️ 予想実行時間

| ジョブ | 時間 |
|------|------|
| ESLint | ~2分 |
| テスト | ~3分 |
| ビルド | ~2分 |
| **合計** | **~7分** |

---

## ローカルでの動作確認

### 🔧 CI と同じ環境でテスト

GitHub Actions に送信する前に、ローカルで同じチェックを実行できます：

#### 1. ESLint を実行

```bash
npm run lint
```

**出力例：**
```
  src/components/FridgeView.tsx
    42:5  warning  Unused variable 'temp'  no-unused-vars

  ✖ 1 problem (0 errors, 1 warning)
```

#### 2. ユニットテストを実行

```bash
npm run test:coverage
```

**出力例：**
```
✓ src/hooks/useExpiryStatus.test.ts (35)
✓ src/utils/foodUtils.test.ts (8)

Test Files  2 passed (2)
Tests      43 passed (43)

Coverage
  branches:    72%
  functions:   85%
  lines:       88%
  statements:  88%
```

#### 3. ビルドを実行

```bash
npm run build
```

**出力例：**
```
vite v5.4.1 building for production...
✓ 2589 modules transformed.
dist/index.html              2.45 kB │ gzip:  1.00 kB
dist/assets/index-abc123.js  456.78 kB │ gzip:  145.23 kB

✓ build complete in 8.52s
```

### ✅ すべて通過したら PR へ

すべてのチェックがローカルで成功したら、自信を持って GitHub に送信できます。

---

## トラブルシューティング

### ❌ ESLint が失敗する場合

**症状：** ESLint ジョブが失敗

**原因と対策：**

```bash
# 1. ローカルで確認
npm run lint

# 2. 自動修正（多くは自動修正可能）
npx eslint . --fix

# 3. 手動修正（自動修正できない場合）
npm run lint  # → エラー行を確認して修正
```

### ❌ テストが失敗する場合

**症状：** test ジョブが失敗

**確認手順：**

```bash
# 1. ローカルで実行
npm run test

# 2. 失敗したテストを確認
npm run test -- --reporter=verbose

# 3. 特定テストだけ実行
npm run test -- FridgeView

# 4. テストをデバッグモードで実行
npm run test -- --inspect-brk
```

### ❌ ビルドが失敗する場合

**症状：** build ジョブが失敗

**確認手順：**

```bash
# 1. TypeScript コンパイルエラー確認
npx tsc --noEmit

# 2. ビルド実行
npm run build

# 3. 詳細なエラーメッセージで型を確認
npx tsc --listFiles
```

### 🔍 GitHub Actions でログを確認

1. **リポジトリを開く**
2. **Actions タブをクリック**
3. **失敗したワークフローを選択**
4. **該当ジョブをクリック**
5. **Step のログを展開して確認**

---

## カスタマイズ方法

### 🔧 Node.js バージョンを変更

```yaml
env:
  NODE_VERSION: '22.x'  # ← この行を変更
```

### 🔧 実行タイミングを追加

```yaml
on:
  push:
    branches:
      - main
      - develop        # ← develop ブランチも対象に
```

### 🔧 スケジュール実行（定期実行）

```yaml
on:
  schedule:
    # 毎日午前9時（UTC）に実行
    - cron: '0 9 * * *'
```

### 🔧 E2E テストを有効化

```yaml
e2e:
  # ...
  if: false        # ← これを削除
```

### 🔧 通知を追加

Slack や RocketChat への通知機能も追加可能です：

```yaml
- name: Slack 通知
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "CI パイプライン: ${{ job.status }}"
      }
```

---

## 📊 カバレッジの改善方法

### 目標：テストカバレッジを 80% 以上に

#### 1. カバレッジレポートを生成

```bash
npm run test:coverage:report
```

#### 2. coverage/index.html をブラウザで開く

#### 3. テストされていない行を確認

```
赤色 = テストされていない
黄色 = 部分的にテスト
緑色 = テストされている
```

#### 4. 新しいテストを追加

```typescript
// 例：テストされていない関数
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// テストを追加
it('合計を計算できる', () => {
  const items = [{ price: 100 }, { price: 200 }];
  expect(calculateTotal(items)).toBe(300);
});
```

---

## 🎯 ベストプラクティス

### ✅ やるべきこと

```bash
# ローカルでテストしてから PR
npm run lint && npm run test && npm run build

# 意味のあるコミットメッセージ
git commit -m "feat: 新機能を追加"

# PR には詳細な説明を含める
```

### ❌ やらないこと

```bash
# テストを無視するコミット
git commit -m "WIP: とりあえずコミット"

# GitHub Actions の失敗を無視
# → 必ずローカルで修正してから PR

# 大量のファイルを一度にコミット
# → 小分けにして、レビュアーの負担を減らす
```

---

## 🔗 参考リンク

- [GitHub Actions 公式ドキュメント](https://docs.github.com/en/actions)
- [Vitest 公式ドキュメント](https://vitest.dev/)
- [Playwright 公式ドキュメント](https://playwright.dev/)
- [ESLint 公式ドキュメント](https://eslint.org/)

---

## 📝 まとめ

GitHub Actions CI/CD パイプラインは、以下の役割を果たします：

```
✅ コード品質を自動チェック
✅ すべてのテストを自動実行
✅ ビルドが成功することを確認
✅ 問題を早期に検出
✅ チームの品質基準を維持
```

**重要:** ローカルで `npm run lint && npm run test && npm run build` が成功してから、PR を作成してください！

