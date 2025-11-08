/**
 * 賞味期限関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - 有効期限までの日数計算
 * - 有効期限ステータスの判定
 * - 期限切れ間近の食材フィルタリング
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
