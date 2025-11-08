/**
 * 予算計算カスタムフック
 *
 * 食費、生活費、エンゲル係数の計算ロジック
 */

import { useMemo } from 'react';
import { FoodItem } from '@/types/food';

export interface MonthlyData {
  month: string;
  year: number;
  monthNumber: number;
  foodExpense: number;
  livingExpense: number;
  engelCoefficient: number;
}

export interface BudgetData {
  thisMonthTotal: number;
  currentEngelCoefficient: number;
  currentLivingExpense: number;
  monthlyData: MonthlyData[];
  purchaseHistory: FoodItem[];
  currentMonthKey: string;
}

/**
 * 予算データを計算
 *
 * @param foodItems - 食材リスト
 * @param monthlyLivingExpenses - 月別生活費
 * @returns 計算された予算データ
 */
export const useBudgetCalculations = (
  foodItems: FoodItem[],
  monthlyLivingExpenses: Record<string, number>
): BudgetData => {
  return useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 今月の食費を計算
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthItems = foodItems.filter(item => new Date(item.purchaseDate) >= thisMonth);
    const thisMonthTotal = thisMonthItems.reduce((sum, item) => sum + item.price, 0);

    // 月別データを計算（過去6ヶ月）
    const monthlyData: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const monthItems = foodItems.filter(item => {
        const itemDate = new Date(item.purchaseDate);
        return itemDate >= targetDate && itemDate < nextMonth;
      });

      const foodExpense = monthItems.reduce((sum, item) => sum + item.price, 0);
      const livingExpense = monthlyLivingExpenses[monthKey] || 0;
      const engelCoefficient = livingExpense > 0 ? (foodExpense / livingExpense) * 100 : 0;

      monthlyData.push({
        month: targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
        year: targetDate.getFullYear(),
        monthNumber: targetDate.getMonth() + 1,
        foodExpense,
        livingExpense,
        engelCoefficient: Math.round(engelCoefficient * 10) / 10
      });
    }

    // 今月のエンゲル係数
    const currentLivingExpense = monthlyLivingExpenses[currentMonthKey] || 0;
    const currentEngelCoefficient = currentLivingExpense > 0 && thisMonthTotal >= 0
      ? (thisMonthTotal / currentLivingExpense) * 100
      : 0;

    // 購入履歴（今月分）
    const purchaseHistory = thisMonthItems
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 15);

    return {
      thisMonthTotal,
      currentEngelCoefficient: Math.round(currentEngelCoefficient * 10) / 10,
      currentLivingExpense,
      monthlyData,
      purchaseHistory,
      currentMonthKey
    };
  }, [foodItems, monthlyLivingExpenses]);
};
