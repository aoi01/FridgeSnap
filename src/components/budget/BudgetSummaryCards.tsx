/**
 * 予算サマリーカードコンポーネント
 *
 * 今月の食費、生活費、エンゲル係数を表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IoWalletOutline, IoReceiptOutline, IoCalculatorOutline } from 'react-icons/io5';

interface BudgetSummaryCardsProps {
  thisMonthTotal: number;
  currentLivingExpense: number;
  currentEngelCoefficient: number;
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
  thisMonthTotal,
  currentLivingExpense,
  currentEngelCoefficient
}) => {
  const getEngelStatus = (coefficient: number) => {
    if (coefficient < 25) return { color: 'bg-success-500', label: '理想的' };
    if (coefficient < 30) return { color: 'bg-warning-500', label: '標準' };
    return { color: 'bg-danger-500', label: '高い' };
  };

  const engelStatus = getEngelStatus(currentEngelCoefficient);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 今月の食費 */}
      <Card className="p-6 bg-gradient-to-br from-brand-50 to-white border-brand-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-brand-600 rounded-lg">
            <IoReceiptOutline className="text-2xl text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-600">今月の食費</p>
          <p className="text-3xl font-bold text-brand-700">
            ¥{thisMonthTotal.toLocaleString()}
          </p>
        </div>
      </Card>

      {/* 今月の生活費 */}
      <Card className="p-6 bg-gradient-to-br from-success-50 to-white border-success-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-success-600 rounded-lg">
            <IoWalletOutline className="text-2xl text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-600">今月の生活費</p>
          <p className="text-3xl font-bold text-success-700">
            {currentLivingExpense > 0
              ? `¥${currentLivingExpense.toLocaleString()}`
              : '未設定'}
          </p>
        </div>
      </Card>

      {/* エンゲル係数 */}
      <Card className="p-6 bg-gradient-to-br from-neutral-50 to-white border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 bg-neutral-700 rounded-lg">
            <IoCalculatorOutline className="text-2xl text-white" />
          </div>
          {currentEngelCoefficient > 0 && (
            <Badge className={`${engelStatus.color} text-white border-none`}>
              {engelStatus.label}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-600">エンゲル係数</p>
          <p className="text-3xl font-bold text-neutral-900">
            {currentEngelCoefficient > 0
              ? `${currentEngelCoefficient.toFixed(1)}%`
              : '-'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default BudgetSummaryCards;
