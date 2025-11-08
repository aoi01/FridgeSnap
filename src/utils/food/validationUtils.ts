/**
 * バリデーション関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - 食材データのバリデーション
 * - エラーメッセージの生成
 */

import { FoodItem } from '@/types/food';

/**
 * 食材データのバリデーションを行う
 *
 * この関数は食材データの妥当性をチェックし、エラーメッセージの配列を返します。
 * エラーがない場合は空の配列が返されます。
 *
 * 検証項目：
 * - 食材名、カテゴリ、購入日、有効期限が必須
 * - 数量は1以上
 * - 価格は0以上
 * - 有効期限は購入日より後
 *
 * @param item - 検証する食材データ（部分的でも可）
 * @returns エラーメッセージの配列（エラーがなければ空配列）
 *
 * @example
 * ```typescript
 * const errors = validateFoodItem(newItem);
 * if (errors.length > 0) {
 *   console.error('バリデーションエラー:', errors.join(', '));
 * }
 * ```
 */
export const validateFoodItem = (item: Partial<FoodItem>): string[] => {
  const errors: string[] = [];

  // 必須項目のチェック
  if (!item.name?.trim()) {
    errors.push('食材名は必須です');
  }

  if (!item.category?.trim()) {
    errors.push('カテゴリは必須です');
  }

  if (!item.purchaseDate) {
    errors.push('購入日は必須です');
  }

  if (!item.expiryDate) {
    errors.push('賞味期限は必須です');
  }

  // 数値の範囲チェック
  if (item.quantity !== undefined && item.quantity <= 0) {
    errors.push('数量は1以上である必要があります');
  }

  if (item.price !== undefined && item.price < 0) {
    errors.push('価格は0以上である必要があります');
  }

  // 日付の妥当性チェック
  if (item.purchaseDate && item.expiryDate) {
    const purchaseDate = new Date(item.purchaseDate);
    const expiryDate = new Date(item.expiryDate);

    if (purchaseDate > expiryDate) {
      errors.push('賞味期限は購入日より後の日付である必要があります');
    }
  }

  return errors;
};
