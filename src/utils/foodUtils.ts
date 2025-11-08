/**
 * 食材関連のユーティリティ関数モジュール（互換性レイヤー）
 *
 * このファイルは後方互換性のために維持されています。
 * 新しいコードでは、以下の個別モジュールを直接インポートすることを推奨します：
 *
 * - @/utils/food/expiryUtils - 賞味期限関連
 * - @/utils/food/searchSortUtils - 検索・ソート
 * - @/utils/food/validationUtils - バリデーション
 * - @/utils/food/calculationUtils - 集計・グルーピング
 */

// 賞味期限関連の関数
export {
  calculateDaysUntilExpiry,
  getExpiryStatus,
  getExpiringItems,
} from './food/expiryUtils';

// 検索・ソート関連の関数
export {
  normalizeItemName,
  searchItems,
  sortItems,
} from './food/searchSortUtils';

// バリデーション関連の関数
export {
  validateFoodItem,
} from './food/validationUtils';

// 集計・グルーピング関連の関数
export {
  groupItemsByCategory,
  calculateTotalPrice,
} from './food/calculationUtils';

/**
 * カテゴリに対応する絵文字アイコンを取得する
 *
 * @deprecated この関数は非推奨です。代わりに categoryUtils.ts の getCategoryIcon を使用してください。
 *
 * @param category - 食材カテゴリ
 * @returns カテゴリに対応する絵文字
 *
 * @example
 * ```typescript
 * const icon = getCategoryIcon('野菜'); // => '🥬'
 * ```
 */
export const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    '野菜': '🥬',
    '肉類': '🥩',
    '魚類': '🐟',
    '乳製品': '🥛',
    '調味料': '🧂',
    'パン・米類': '🍞',
    '冷凍食品': '🧊',
    'その他': '📦',
  };

  return iconMap[category] || iconMap['その他'];
};
