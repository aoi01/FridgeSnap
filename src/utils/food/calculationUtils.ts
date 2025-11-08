/**
 * 集計・グルーピング関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - カテゴリ別グループ化
 * - 合計価格計算
 */

import { FoodItem } from '@/types/food';

/**
 * カテゴリ別に食材をグループ化する
 *
 * この関数は食材リストをカテゴリごとにグループ化します。
 * カテゴリが指定されていない食材は「その他」として扱われます。
 *
 * @param items - グループ化する食材リスト
 * @returns カテゴリ名をキーとした食材配列のマップ
 *
 * @example
 * ```typescript
 * const grouped = groupItemsByCategory(foodItems);
 * console.log(grouped['野菜']); // => [野菜の食材配列]
 * ```
 */
export const groupItemsByCategory = (items: FoodItem[]): Record<string, FoodItem[]> => {
  return items.reduce((groups, item) => {
    const category = item.category || 'その他';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, FoodItem[]>);
};

/**
 * 食材の合計価格を計算する
 *
 * 指定された食材リストの価格を合計します。
 * 価格が未設定の食材は0円として扱われます。
 *
 * @param items - 合計を計算する食材リスト
 * @returns 合計価格（円）
 *
 * @example
 * ```typescript
 * const total = calculateTotalPrice(basketItems);
 * console.log(`合計: ${total}円`);
 * ```
 */
export const calculateTotalPrice = (items: FoodItem[]): number => {
  return items.reduce((total, item) => total + (item.price || 0), 0);
};
