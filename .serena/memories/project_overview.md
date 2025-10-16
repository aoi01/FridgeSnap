# Kitchen Sensei Go - プロジェクト概要

## プロジェクト目的
AI統合型の食材管理・レシピ提案アプリケーション「Kitchen Sensei Go」。レシート画像解析、賞味期限管理、AI基盤のレシピ提案、家計簿機能を備えた包括的な食生活支援ツール。

## 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: React Hooks (useState, useEffect) + LocalStorage
- **ルーティング**: React Router v6
- **API統合**: Gemini AI API（レシート解析）、楽天レシピAPI
- **テスト**: Vitest + React Testing Library + MSW
- **開発ツール**: ESLint, PostCSS, Autoprefixer

## プロジェクト構造
```
src/
├── components/          # Reactコンポーネント
│   ├── ui/             # shadcn/ui再利用可能コンポーネント
│   ├── FridgeView.tsx  # 冷蔵庫表示・管理
│   ├── ReceiptScanner.tsx # AI画像解析
│   ├── RecipesSuggestion.tsx # レシピ提案
│   ├── BudgetOverview.tsx # 家計簿機能
│   └── TodayBasket.tsx # 今日の献立
├── pages/              # ページコンポーネント
│   ├── Index.tsx       # メインページ（状態管理中心）
│   └── NotFound.tsx    # 404ページ
├── lib/                # ライブラリ・ユーティリティ
│   ├── utils.ts        # Tailwind CSS統合
│   └── apiSecurity.ts  # API セキュリティ・レート制限
├── types/              # TypeScript型定義
├── utils/              # 汎用ユーティリティ
├── test/               # テスト設定・モック
└── hooks/              # カスタムHooks
```

## アーキテクチャ特徴
- **単一ページアプリケーション(SPA)**: React Routerによるクライアントサイドルーティング
- **props流し込み型状態管理**: Index.tsxが状態管理の中心
- **外部API統合**: Gemini AI、楽天レシピAPIとの統合
- **LocalStorage永続化**: ブラウザローカルストレージでデータ保存