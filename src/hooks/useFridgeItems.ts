/**
 * 冷蔵庫アイテム管理カスタムフック
 *
 * 冷蔵庫の食材リストを管理し、追加・更新・削除機能を提供
 */

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { STORAGE_KEYS } from '@/constants';
import { toast } from 'sonner';

/**
 * 冷蔵庫アイテムを管理するカスタムフック
 *
 * @returns 状態と操作関数
 */
export const useFridgeItems = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEYS.FRIDGE_ITEMS);
    if (savedItems) {
      setFoodItems(JSON.parse(savedItems));
    }
  }, []);

  // Sync food items to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIDGE_ITEMS, JSON.stringify(foodItems));
  }, [foodItems]);

  // Check for expiring items
  useEffect(() => {
    const checkExpiringItems = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expiringItems = foodItems.filter((item) => {
        const expiryDate = new Date(item.expiryDate);
        return expiryDate <= tomorrow && expiryDate >= today;
      });

      if (expiringItems.length > 0) {
        toast.error(`${expiringItems.length}つの食材が期限切れ間近です！`, {
          description: expiringItems.map((item) => item.name).join(', '),
        });
      }
    };

    if (foodItems.length > 0) {
      checkExpiringItems();
    }
  }, [foodItems]);

  /**
   * レシートからスキャンされたアイテムを追加
   */
  const handleReceiptScanned = (newItems: FoodItem[]) => {
    setFoodItems((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length}つの食材を冷蔵庫に追加しました！`);
  };

  /**
   * 冷蔵庫から食材を削除
   */
  const removeFromFridge = (itemId: string) => {
    setFoodItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success('食材を削除しました');
  };

  /**
   * 冷蔵庫の食材を更新
   */
  const updateFridgeItem = (updatedItem: FoodItem) => {
    setFoodItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  /**
   * 冷蔵庫に食材を追加
   */
  const addFridgeItem = (newItem: FoodItem) => {
    setFoodItems((prev) => [...prev, newItem]);
  };

  /**
   * 期限切れ間近の食材を取得（3日以内）
   */
  const getExpiringItems = () => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return foodItems.filter((item) => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysLater;
    });
  };

  /**
   * 期限切れ間近の食材数を取得
   */
  const getExpiringCount = () => {
    return getExpiringItems().length;
  };

  /**
   * 期限切れ食材を複数削除
   */
  const handleBulkDeleteExpiring = (itemIds: string[]) => {
    setFoodItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  return {
    // State
    foodItems,

    // Operations
    handleReceiptScanned,
    removeFromFridge,
    updateFridgeItem,
    addFridgeItem,
    getExpiringItems,
    getExpiringCount,
    handleBulkDeleteExpiring,
  };
};
