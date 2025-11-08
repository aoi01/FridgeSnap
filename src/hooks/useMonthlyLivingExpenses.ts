/**
 * 月別生活費管理カスタムフック
 *
 * LocalStorage と同期された月別生活費の管理
 */

import { useState, useEffect } from 'react';

/**
 * 月別生活費の状態を管理するカスタムフック
 *
 * @returns [monthlyLivingExpenses, setMonthlyLivingExpenses]
 */
export const useMonthlyLivingExpenses = () => {
  const [monthlyLivingExpenses, setMonthlyLivingExpenses] = useState<Record<string, number>>({});

  // LocalStorage から生活費データを読み込み
  useEffect(() => {
    const saved = localStorage.getItem('monthlyLivingExpenses');
    if (saved) {
      setMonthlyLivingExpenses(JSON.parse(saved));
    }
  }, []);

  // 生活費データを LocalStorage に保存
  useEffect(() => {
    localStorage.setItem('monthlyLivingExpenses', JSON.stringify(monthlyLivingExpenses));
  }, [monthlyLivingExpenses]);

  return { monthlyLivingExpenses, setMonthlyLivingExpenses };
};
