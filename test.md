```mermaid
  graph TD
      %% フロントエンド層
      subgraph "Frontend Layer"
          A[App.tsx] --> B[Index.tsx - Main Controller]
          B --> C[FridgeView - 冷蔵庫管理]
          B --> D[TodayBasket - 今日の献立]
          B --> E[ReceiptScanner - レシート解析]
          B --> F[RecipesSuggestion - レシピ提案]
          B --> G[BudgetOverview - 家計簿]
          B --> H[ExpiringItemsModal - 期限切れ管理]
          C --> I[FridgeItemEditor - 食材編集]
      end

      %% データ層
      subgraph "Data Layer"
          J[LocalStorage - クライアント側ストレージ]
          K[FoodItem - データモデル]
          L[Recipe - レシピデータ]
          M[MonthlyData - 月次データ]
      end

      %% 外部API層
      subgraph "External APIs"
          N[Gemini API - AI画像解析]
          O[楽天レシピAPI - レシピ検索]
      end

      %% セキュリティ・ユーティリティ層
      subgraph "Security & Utils Layer"
          P[ApiSecurity - API管理・認証]
          Q[FoodUtils - 食材関連ユーティリティ]
          R[UI Components - 共通UIコンポーネント]
      end

      %% テスト層
      subgraph "Testing Layer"
          S[Component Tests - コンポーネントテスト]
          T[E2E Tests - エンドツーエンドテスト]
          U[Mock Services - モックサービス]
      end

      %% データフロー
      B -.-> J
      E -.-> N
      F -.-> O
      C -.-> K
      D -.-> K
      G -.-> M
      F -.-> L

      %% セキュリティ連携
      E --> P
      F --> P
      P --> N
      P --> O

      %% ユーティリティ使用
      C --> Q
      D --> Q
      G --> Q

      %% UI連携
      C --> R
      D --> R
      E --> R
      F --> R
      G --> R
      H --> R
      I --> R

      %% テスト対象
      S -.-> C
      S -.-> D
      S -.-> E
      S -.-> I
      T -.-> B
      U -.-> N
      U -.-> O
  
````