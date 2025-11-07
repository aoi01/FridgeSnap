/**
 * 食材管理アプリケーションの型定義モジュール
 *
 * このファイルは以下の型を定義します：
 * - FoodItem: 食材アイテムの完全な情報
 * - Recipe: レシピ情報
 * - MonthlyData: 月次予算データ
 * - ExpiryStatus: 有効期限ステータス
 * - その他関連する型
 */

import { FoodCategory } from '@/constants';

/**
 * 食材アイテムの完全な型定義
 *
 * @property id - 一意識別子（UUID推奨）
 * @property name - 食材名（例: "キャベツ", "牛乳"）
 * @property category - 食材カテゴリ（FOOD_CATEGORIESの値）
 * @property purchaseDate - 購入日（ISO 8601形式: YYYY-MM-DD）
 * @property expiryDate - 有効期限（ISO 8601形式: YYYY-MM-DD）
 * @property quantity - 数量（個数や重量など）
 * @property price - 価格（円）
 * @property isInBasket - 今日の献立に追加されているかどうか
 * @property image - 食材画像のURL（オプション）
 * @property appliedStorageTips - 適用済みの保存Tipsのタイトルリスト（オプション）
 */
export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  price: number;
  isInBasket: boolean;
  image?: string;
  appliedStorageTips?: string[];
}

/**
 * 新規食材作成用のDTO（Data Transfer Object）
 * idを除いた全てのプロパティが必要
 */
export type CreateFoodItemDTO = Omit<FoodItem, 'id'>;

/**
 * 食材更新用のDTO
 * idを除いた全てのプロパティがオプショナル
 */
export type UpdateFoodItemDTO = Partial<Omit<FoodItem, 'id'>>;

/**
 * レシピ情報の型定義（楽天レシピAPI等からの取得データ）
 *
 * @property recipeId - レシピの一意識別子
 * @property recipeTitle - レシピのタイトル
 * @property recipeUrl - レシピの詳細ページURL
 * @property foodImageUrl - 料理の画像URL
 * @property recipeMaterial - 必要な材料のリスト
 * @property recipeIndication - 調理方法の説明
 * @property recipeCost - 概算コスト（文字列表現）
 * @property recipePublishday - レシピの公開日
 * @property rank - レシピのランキング
 * @property matchScore - 手持ち食材とのマッチスコア（0-100）
 * @property availableIngredients - 手持ちの材料リスト
 * @property missingIngredients - 不足している材料リスト
 */
export interface Recipe {
  recipeId: string;
  recipeTitle: string;
  recipeUrl: string;
  foodImageUrl: string;
  recipeMaterial: string[];
  recipeIndication: string;
  recipeCost: string;
  recipePublishday: string;
  rank: string;
  matchScore?: number;
  availableIngredients?: string[];
  missingIngredients?: string[];
}

/**
 * 月次予算データの型定義
 *
 * @property month - 月の表示名（例: "2024年1月"）
 * @property year - 年（例: 2024）
 * @property monthNumber - 月番号（1-12）
 * @property foodExpense - 食費の合計（円）
 * @property livingExpense - 生活費の合計（円）
 * @property engelCoefficient - エンゲル係数（食費/生活費 * 100）
 */
export interface MonthlyData {
  month: string;
  year: number;
  monthNumber: number;
  foodExpense: number;
  livingExpense: number;
  engelCoefficient: number;
}

/**
 * カテゴリマッピング情報（将来の拡張用）
 */
export interface CategoryMap {
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string;
}

/**
 * 有効期限ステータスの型
 * - expired: 期限切れ
 * - today: 本日期限切れ
 * - tomorrow: 明日期限切れ
 * - soon: 数日以内に期限切れ
 * - safe: 安全な期間
 */
export type ExpiryStatus = 'expired' | 'today' | 'tomorrow' | 'soon' | 'safe';

/**
 * 有効期限ステータスの詳細情報
 *
 * @property status - ステータス（expired, today, tomorrow, soon, safe）
 * @property daysUntilExpiry - 期限までの日数（負の値は期限切れを示す）
 * @property color - UIで使用する色（TailwindクラスまたはCSS値）
 * @property urgency - 緊急度（high, medium, low, none）
 * @property label - 表示用ラベル（例: "期限切れ", "明日まで"）
 */
export interface ExpiryStatusResult {
  status: ExpiryStatus;
  daysUntilExpiry: number;
  color: string;
  urgency: 'high' | 'medium' | 'low' | 'none';
  label?: string;
}

/**
 * タブの種類
 * - fridge: 冷蔵庫ビュー
 * - basket: 今日の献立
 * - recipes: レシピ提案
 * - budget: 家計簿
 */
export type TabType = 'fridge' | 'basket' | 'recipes' | 'budget';