/**
 * 家計簿オーバービューコンポーネント
 *
 * 食費管理とエンゲル係数分析を行う統合コンポーネント
 * 各機能は責任別のサブコンポーネントに分割
 */

import React from 'react';
import { FoodItem } from '@/types/food';
import { useMonthlyLivingExpenses } from '@/hooks/useMonthlyLivingExpenses';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import BudgetHeader from './budget/BudgetHeader';
import BudgetSummaryCards from './budget/BudgetSummaryCards';
import LivingExpenseInput from './budget/LivingExpenseInput';
import MonthlyTrendChart from './budget/MonthlyTrendChart';
import PurchaseHistoryList from './budget/PurchaseHistoryList';

interface BudgetOverviewProps {
  /** 食材リスト */
  foodItems: FoodItem[];
  /** 購入履歴編集用のコールバック関数 */
  onUpdatePurchaseHistory?: (updatedItem: FoodItem) => void;
  /** 購入履歴削除用のコールバック関数 */
  onDeletePurchaseHistory?: (itemId: string) => void;
}

/**
 * 家計簿オーバービューコンポーネント
 *
 * 以下の機能を提供:
 * - 月別生活費の入力・管理
 * - 食費とエンゲル係数の計算と表示
 * - 月別支出推移のグラフ化
 * - 購入履歴の表示
 */
const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  foodItems,
  onUpdatePurchaseHistory,
  onDeletePurchaseHistory
}) => {
  const { monthlyLivingExpenses, setMonthlyLivingExpenses } = useMonthlyLivingExpenses();
  const budgetData = useBudgetCalculations(foodItems, monthlyLivingExpenses);

  /**
   * 生活費を保存するハンドラー
   */
  const handleSaveLivingExpense = (monthKey: string, amount: number) => {
    setMonthlyLivingExpenses(prev => ({
      ...prev,
      [monthKey]: amount
    }));
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <BudgetHeader />

      {/* サマリーカード */}
      <BudgetSummaryCards
        thisMonthTotal={budgetData.thisMonthTotal}
        currentLivingExpense={budgetData.currentLivingExpense}
        currentEngelCoefficient={budgetData.currentEngelCoefficient}
      />

      {/* 生活費入力フォーム */}
      <LivingExpenseInput
        currentMonthKey={budgetData.currentMonthKey}
        onSave={handleSaveLivingExpense}
      />

      {/* 月別支出推移グラフ */}
      <MonthlyTrendChart monthlyData={budgetData.monthlyData} />

      {/* 購入履歴リスト */}
      <PurchaseHistoryList items={budgetData.purchaseHistory} />
    </div>
  );
};

export default BudgetOverview;
