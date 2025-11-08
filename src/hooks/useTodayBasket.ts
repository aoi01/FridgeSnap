/**
 * 今日の献立（バスケット）管理カスタムフック
 *
 * 今日の献立に追加された食材を管理
 */

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { STORAGE_KEYS } from '@/constants';
import { toast } from 'sonner';

/**
 * 今日の献立を管理するカスタムフック
 *
 * @returns 状態と操作関数
 */
export const useTodayBasket = () => {
  const [todayBasket, setTodayBasket] = useState<FoodItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedBasket = localStorage.getItem(STORAGE_KEYS.TODAY_BASKET);
    if (savedBasket) {
      setTodayBasket(JSON.parse(savedBasket));
    }
  }, []);

  // Sync today's basket to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TODAY_BASKET, JSON.stringify(todayBasket));
  }, [todayBasket]);

  /**
   * 食材を今日の献立に移動
   */
  const moveToBasket = (item: FoodItem) => {
    setTodayBasket((prev) => [...prev, { ...item, isInBasket: true }]);
    toast.success(`${item.name}を今日の献立に追加しました`);
  };

  /**
   * 今日の献立から食材を削除
   */
  const removeFromBasket = (itemId: string) => {
    setTodayBasket((prev) => prev.filter((item) => item.id !== itemId));
  };

  /**
   * 今日の献立を完了（全て削除）
   */
  const clearTodayBasket = () => {
    setTodayBasket([]);
    toast.success('今日の献立を完了しました！');
  };

  /**
   * 今日の献立の食材を更新
   */
  const updateBasketItem = (updatedItem: FoodItem) => {
    setTodayBasket((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  /**
   * 複数の食材をバスケットから一括削除
   */
  const removeMultipleFromBasket = (itemIds: string[]) => {
    setTodayBasket((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  return {
    // State
    todayBasket,

    // Operations
    moveToBasket,
    removeFromBasket,
    clearTodayBasket,
    updateBasketItem,
    removeMultipleFromBasket,
  };
};
