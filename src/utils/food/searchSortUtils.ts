/**
 * 検索・ソート関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - 食材名の正規化
 * - 検索機能
 * - ソート機能
 */

import { FoodItem } from '@/types/food';

/**
 * 食材名を検索用に正規化する
 *
 * この関数は食材名を検索に適した形式に正規化します：
 * - 小文字に変換
 * - 前後の空白を削除
 * - 連続する空白を1つに統一
 * - 括弧を削除
 *
 * @param name - 正規化する食材名
 * @returns 正規化された食材名
 *
 * @example
 * ```typescript
 * normalizeItemName('  キャベツ（国産）  '); // => 'きゃべつ国産'
 * ```
 */
export const normalizeItemName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // 連続する空白を1つに
    .replace(/[（）()]/g, ''); // 括弧を削除
};

/**
 * 食材を検索クエリでフィルタリングする
 *
 * この関数は食材名とカテゴリ名を対象に部分一致検索を行います。
 * 検索は大文字小文字を区別せず、空白や括弧も無視されます。
 *
 * @param items - 検索対象の食材リスト
 * @param query - 検索クエリ文字列
 * @returns フィルタリングされた食材リスト
 *
 * @example
 * ```typescript
 * const results = searchItems(allItems, 'キャベツ');
 * // => キャベツを含む食材のリスト
 * ```
 */
export const searchItems = (items: FoodItem[], query: string): FoodItem[] => {
  // クエリが空の場合は全アイテムを返す
  if (!query.trim()) return items;

  const normalizedQuery = normalizeItemName(query);

  return items.filter((item) => {
    const normalizedName = normalizeItemName(item.name);
    const normalizedCategory = normalizeItemName(item.category);

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery)
    );
  });
};

/**
 * 食材をソートする
 *
 * 指定されたプロパティで食材リストをソートします。
 * 元の配列は変更されず、新しい配列が返されます。
 *
 * @param items - ソートする食材リスト
 * @param sortBy - ソート基準（name, expiryDate, purchaseDate, price）
 * @param direction - ソート方向（asc: 昇順, desc: 降順）
 * @returns ソートされた食材リストの新しい配列
 *
 * @example
 * ```typescript
 * // 有効期限の古い順にソート
 * const sorted = sortItems(items, 'expiryDate', 'asc');
 *
 * // 価格の高い順にソート
 * const sorted = sortItems(items, 'price', 'desc');
 * ```
 */
export const sortItems = (
  items: FoodItem[],
  sortBy: 'name' | 'expiryDate' | 'purchaseDate' | 'price',
  direction: 'asc' | 'desc' = 'asc'
): FoodItem[] => {
  // 元の配列を変更しないようにコピーを作成
  return [...items].sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    switch (sortBy) {
      case 'name':
        // 名前の比較は大文字小文字を区別しない
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'expiryDate':
      case 'purchaseDate':
        // 日付の比較
        aValue = new Date(a[sortBy]);
        bValue = new Date(b[sortBy]);
        break;
      case 'price':
        // 価格の比較（未設定は0として扱う）
        aValue = a.price || 0;
        bValue = b.price || 0;
        break;
      default:
        return 0;
    }

    // ソート方向に応じて比較結果を返す
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
