/**
 * 食材関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - 有効期限の計算と判定
 * - 食材のグループ化とフィルタリング
 * - 検索とソート機能
 * - データの検証
 */

import { FoodItem, ExpiryStatusResult } from '@/types/food';
import { EXPIRY_STATUS_CONFIG, UI_CONFIG } from '@/constants';

/**
 * 有効期限までの日数を計算する
 *
 * この関数は現在日と有効期限の差を日数で返します。
 * 時間部分は無視され、日付のみで比較されます。
 *
 * @param expiryDate - 有効期限（ISO 8601形式: YYYY-MM-DD）
 * @returns 有効期限までの日数（負の値は期限切れを示す）
 *
 * @example
 * ```typescript
 * // 明日が期限の場合
 * calculateDaysUntilExpiry('2024-01-02'); // => 1
 *
 * // 昨日が期限の場合
 * calculateDaysUntilExpiry('2023-12-31'); // => -1
 * ```
 */
export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);

  // 時間を0に設定して日付のみで比較
  // これにより、時刻に関係なく日付単位での正確な比較が可能
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  // Math.ceilを使用して、時刻の違いによる誤差を回避
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 有効期限のステータスを判定する
 *
 * この関数は有効期限までの日数に基づいて、食材の状態を判定します。
 * 判定基準はEXPIRY_STATUS_CONFIGで定義されています。
 *
 * @param expiryDate - 有効期限（ISO 8601形式: YYYY-MM-DD）
 * @returns 有効期限ステータスの詳細情報
 *
 * @example
 * ```typescript
 * const status = getExpiryStatus('2024-01-15');
 * console.log(status.status); // => 'safe'
 * console.log(status.urgency); // => 'none'
 * console.log(status.label); // => '安全'
 * ```
 */
export const getExpiryStatus = (expiryDate: string): ExpiryStatusResult => {
  const days = calculateDaysUntilExpiry(expiryDate);

  // EXPIRY_STATUS_CONFIGを参照して適切なステータスを判定
  // 期限切れ（負の日数）
  if (days < 0) {
    const config = EXPIRY_STATUS_CONFIG.expired;
    return {
      status: 'expired',
      daysUntilExpiry: days,
      color: config.colorClass,
      urgency: config.urgency,
      label: config.label,
    };
  }

  // 本日期限切れ
  if (days === 0) {
    const config = EXPIRY_STATUS_CONFIG.today;
    return {
      status: 'today',
      daysUntilExpiry: days,
      color: config.colorClass,
      urgency: config.urgency,
      label: config.label,
    };
  }

  // 明日期限切れ
  if (days === 1) {
    const config = EXPIRY_STATUS_CONFIG.tomorrow;
    return {
      status: 'tomorrow',
      daysUntilExpiry: days,
      color: config.colorClass,
      urgency: config.urgency,
      label: config.label,
    };
  }

  // 数日以内に期限切れ（2-3日）
  if (days <= UI_CONFIG.EXPIRING_DAYS_THRESHOLD) {
    const config = EXPIRY_STATUS_CONFIG.soon;
    return {
      status: 'soon',
      daysUntilExpiry: days,
      color: config.colorClass,
      urgency: config.urgency,
      label: `${days}日後`,
    };
  }

  // 安全な期間
  const config = EXPIRY_STATUS_CONFIG.safe;
  return {
    status: 'safe',
    daysUntilExpiry: days,
    color: config.colorClass,
    urgency: config.urgency,
    label: `${days}日後`,
  };
};

/**
 * 期限切れ間近の食材をフィルタリングする
 *
 * この関数は指定された日数以内に期限切れとなる食材を抽出します。
 * デフォルトでは3日以内（UI_CONFIG.EXPIRING_DAYS_THRESHOLD）の食材を抽出します。
 *
 * @param items - フィルタリング対象の食材リスト
 * @param withinDays - 期限までの日数の閾値（デフォルト: 3日）
 * @returns 期限切れ間近の食材リスト
 *
 * @example
 * ```typescript
 * const allItems = [...];
 * const expiringItems = getExpiringItems(allItems, 5); // 5日以内
 * ```
 */
export const getExpiringItems = (
  items: FoodItem[],
  withinDays: number = UI_CONFIG.EXPIRING_DAYS_THRESHOLD
): FoodItem[] => {
  return items.filter((item) => {
    const days = calculateDaysUntilExpiry(item.expiryDate);
    return days <= withinDays && days >= 0; // 期限切れは除外
  });
};

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