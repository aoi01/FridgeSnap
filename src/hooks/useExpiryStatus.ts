/**
 * 賞味期限ステータス管理ユーティリティ
 *
 * このモジュールは以下の機能を提供します：
 * - 賞味期限のステータス判定
 * - UI用の色とテキストの提供
 * - カードの背景色とボーダー色の提供
 */

import { calculateDaysUntilExpiry } from '@/utils/food/expiryUtils';

/**
 * 賞味期限ステータスの型定義
 */
export interface ExpiryStatusUI {
  status: 'expired' | 'today' | 'tomorrow' | 'soon' | 'safe';
  badgeColor: string;
  cardBg: string;
  cardBorder: string;
  text: string;
}

/**
 * 賞味期限のステータスを取得する関数
 *
 * @param expiryDate - 賞味期限（YYYY-MM-DD形式）
 * @returns 賞味期限ステータスとUI情報
 *
 * @example
 * ```typescript
 * const status = getExpiryStatusUI('2024-01-20');
 * <Badge className={status.badgeColor}>{status.text}</Badge>
 * <Card className={`${status.cardBg} ${status.cardBorder}`}>...</Card>
 * ```
 */
export const getExpiryStatusUI = (expiryDate: string): ExpiryStatusUI => {
  const days = calculateDaysUntilExpiry(expiryDate);

  // 期限切れ
  if (days < 0) {
    return {
      status: 'expired',
      badgeColor: 'bg-red-500',
      cardBg: 'bg-red-100',
      cardBorder: 'border-red-300',
      text: '期限切れ'
    };
  }

  // 本日期限
  if (days === 0) {
    return {
      status: 'today',
      badgeColor: 'bg-red-400',
      cardBg: 'bg-red-100',
      cardBorder: 'border-red-300',
      text: '今日まで'
    };
  }

  // 明日期限
  if (days === 1) {
    return {
      status: 'tomorrow',
      badgeColor: 'bg-orange-400',
      cardBg: 'bg-orange-100',
      cardBorder: 'border-orange-300',
      text: '明日まで'
    };
  }

  // 数日以内（2-3日）
  if (days <= 3) {
    return {
      status: 'soon',
      badgeColor: 'bg-yellow-400',
      cardBg: 'bg-yellow-100',
      cardBorder: 'border-yellow-300',
      text: `${days}日後`
    };
  }

  // 安全
  return {
    status: 'safe',
    badgeColor: 'bg-green-400',
    cardBg: 'bg-green-100',
    cardBorder: 'border-green-300',
    text: `${days}日後`
  };
};

/**
 * 複数の食材の賞味期限ステータスを一括取得する関数
 *
 * @param expiryDates - 賞味期限の配列
 * @returns 賞味期限ステータスの配列
 *
 * @example
 * ```typescript
 * const statuses = getBulkExpiryStatusUI(items.map(item => item.expiryDate));
 * ```
 */
export const getBulkExpiryStatusUI = (expiryDates: string[]): ExpiryStatusUI[] => {
  return expiryDates.map(date => getExpiryStatusUI(date));
};
