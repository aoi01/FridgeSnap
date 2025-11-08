/**
 * 冷蔵庫状態管理カスタムフック
 *
 * foodItems, todayBasket, purchaseHistory の状態管理を一元化
 * ビジネスロジック関数を提供
 */

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/food';
import { STORAGE_KEYS } from '@/constants';
import { toast } from 'sonner';

/**
 * 冷蔵庫状態管理フック
 *
 * @returns 状態と操作関数
 */
export const useFridgeState = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [todayBasket, setTodayBasket] = useState<FoodItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<FoodItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem(STORAGE_KEYS.FRIDGE_ITEMS);
    const savedBasket = localStorage.getItem(STORAGE_KEYS.TODAY_BASKET);
    const savedPurchaseHistory = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);

    if (savedItems) {
      setFoodItems(JSON.parse(savedItems));
    }
    if (savedBasket) {
      setTodayBasket(JSON.parse(savedBasket));
    }
    if (savedPurchaseHistory) {
      setPurchaseHistory(JSON.parse(savedPurchaseHistory));
    }
  }, []);

  // Sync food items to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIDGE_ITEMS, JSON.stringify(foodItems));
  }, [foodItems]);

  // Sync today's basket to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TODAY_BASKET, JSON.stringify(todayBasket));
  }, [todayBasket]);

  // Sync purchase history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_HISTORY, JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

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
    // 新しい食材を購入履歴にも追加
    setPurchaseHistory((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length}つの食材を冷蔵庫に追加しました！`);
  };

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
    const basketItemIds = todayBasket.map((item) => item.id);
    setFoodItems((prev) => prev.filter((item) => !basketItemIds.includes(item.id)));
    setTodayBasket([]);
    toast.success('今日の献立を完了しました！');
  };

  /**
   * 冷蔵庫から食材を削除
   */
  const removeFromFridge = (itemId: string) => {
    setFoodItems((prev) => prev.filter((item) => item.id !== itemId));
    // 今日の献立にも入っていれば同時に削除
    setTodayBasket((prev) => prev.filter((item) => item.id !== itemId));
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
    // 新しい食材を購入履歴にも追加
    setPurchaseHistory((prev) => [...prev, newItem]);
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

  /**
   * 期限切れ食材を複数削除
   */
  const handleBulkDeleteExpiring = (itemIds: string[]) => {
    setFoodItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
    // 今日の献立からも該当アイテムを削除
    setTodayBasket((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  };

  /**
   * 今日の献立の食材を更新
   */
  const updateBasketItem = (updatedItem: FoodItem) => {
    setTodayBasket((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    // 冷蔵庫の同じアイテムも更新
    setFoodItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  return {
    // States
    foodItems,
    todayBasket,
    purchaseHistory,

    // Food operations
    handleReceiptScanned,
    removeFromFridge,
    updateFridgeItem,
    addFridgeItem,
    getExpiringItems,
    getExpiringCount,
    handleBulkDeleteExpiring,

    // Basket operations
    moveToBasket,
    removeFromBasket,
    clearTodayBasket,
    updateBasketItem,

    // Purchase history operations
    updatePurchaseHistory,
    deletePurchaseHistory,
  };
};
