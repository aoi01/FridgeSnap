/**
 * 購入履歴管理カスタムフック
 *
 * 食材の購入履歴を管理し、更新・削除機能を提供
 */

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { STORAGE_KEYS } from '@/constants';

/**
 * 購入履歴を管理するカスタムフック
 *
 * @returns 状態と操作関数
 */
export const usePurchaseHistory = () => {
  const [purchaseHistory, setPurchaseHistory] = useState<FoodItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPurchaseHistory = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
    if (savedPurchaseHistory) {
      setPurchaseHistory(JSON.parse(savedPurchaseHistory));
    }
  }, []);

  // Sync purchase history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_HISTORY, JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  /**
   * 購入履歴に食材を追加
   */
  const addToPurchaseHistory = (item: FoodItem) => {
    setPurchaseHistory((prev) => [...prev, item]);
  };

  /**
   * 複数の食材を購入履歴に追加
   */
  const addMultipleToPurchaseHistory = (items: FoodItem[]) => {
    setPurchaseHistory((prev) => [...prev, ...items]);
  };

  /**
   * 購入履歴の食材を更新
   */
  const updatePurchaseHistory = (updatedItem: FoodItem) => {
    setPurchaseHistory((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  /**
   * 購入履歴の食材を削除
   */
  const deletePurchaseHistory = (itemId: string) => {
    setPurchaseHistory((prev) => prev.filter((item) => item.id !== itemId));
  };

  return {
    // State
    purchaseHistory,

    // Operations
    addToPurchaseHistory,
    addMultipleToPurchaseHistory,
    updatePurchaseHistory,
    deletePurchaseHistory,
  };
};
