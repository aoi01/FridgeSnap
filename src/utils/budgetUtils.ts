/**
 * 家計簿・予算管理のユーティリティ関数
 */

/**
 * エンゲル係数のステータスと色を取得
 *
 * @param engelCoefficient - エンゲル係数（%）
 * @returns { status, color, label }
 */
export const getEngelCoefficientStatus = (engelCoefficient: number) => {
  if (isNaN(engelCoefficient) || engelCoefficient === 0) {
    return {
      status: 'no-data',
      color: 'bg-neutral-50 text-neutral-600 border-neutral-200',
      label: 'データなし'
    };
  }

  if (engelCoefficient > 25) {
    return {
      status: 'high',
      color: 'bg-danger-50 text-danger-600 border-danger-200',
      label: '高め'
    };
  }

  if (engelCoefficient > 20) {
    return {
      status: 'standard',
      color: 'bg-warning-50 text-warning-600 border-warning-200',
      label: '標準'
    };
  }

  return {
    status: 'ideal',
    color: 'bg-success-50 text-success-600 border-success-200',
    label: '理想的'
  };
};

/**
 * 現在の年月キーを取得（YYYY-MM形式）
 *
 * @returns YYYY-MM形式の年月文字列
 */
export const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * 金額をフォーマットして表示（¥で区切り文字対応）
 *
 * @param amount - 金額
 * @returns フォーマットされた金額文字列
 */
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString()}`;
};

/**
 * エンゲル係数をパーセンテージ表示でフォーマット
 *
 * @param coefficient - エンゲル係数
 * @returns フォーマットされたパーセンテージ文字列
 */
export const formatEngelCoefficient = (coefficient: number): string => {
  if (isNaN(coefficient)) return '0';
  return coefficient.toFixed(1);
};
