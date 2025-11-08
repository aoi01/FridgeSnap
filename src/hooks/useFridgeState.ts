/**
 * 冷蔵庫状態管理カスタムフック（統合）
 *
 * 3つの責任別ホック（useFridgeItems, useTodayBasket, usePurchaseHistory）を統合
 * 既存の使用箇所との互換性を保つため、このエクスポートを提供
 *
 * @deprecated 新規使用時は useFridgeItems, useTodayBasket, usePurchaseHistory を個別に使用してください
 */

import { useFridgeItems } from './useFridgeItems';
import { useTodayBasket } from './useTodayBasket';
import { usePurchaseHistory } from './usePurchaseHistory';
import { FoodItem } from '@/types/food';

/**
 * 冷蔵庫状態管理フック（統合版）
 *
 * 3つのホックを統合して返す互換性レイヤー
 *
 * @returns 状態と操作関数（従来の構造）
 */
export const useFridgeState = () => {
  const fridgeItems = useFridgeItems();
  const todayBasket = useTodayBasket();
  const purchaseHistory = usePurchaseHistory();

  /**
   * レシート登録時のビジネスロジック
   * 冷蔵庫と購入履歴の両方に追加
   */
  const handleReceiptScanned = (newItems: FoodItem[]) => {
    fridgeItems.handleReceiptScanned(newItems);
    purchaseHistory.addMultipleToPurchaseHistory(newItems);
  };

  /**
   * 食材追加時のビジネスロジック
   * 冷蔵庫と購入履歴の両方に追加
   */
  const addFridgeItem = (newItem: FoodItem) => {
    fridgeItems.addFridgeItem(newItem);
    purchaseHistory.addToPurchaseHistory(newItem);
  };

  /**
   * 冷蔵庫から削除時のビジネスロジック
   * 冷蔵庫とバスケットの両方から削除
   */
  const removeFromFridge = (itemId: string) => {
    fridgeItems.removeFromFridge(itemId);
    todayBasket.removeFromBasket(itemId);
  };

  /**
   * 献立完了時のビジネスロジック
   * バスケット内の食材を冷蔵庫からも削除
   */
  const clearTodayBasket = () => {
    const basketItemIds = todayBasket.todayBasket.map((item) => item.id);
    fridgeItems.handleBulkDeleteExpiring(basketItemIds);
    todayBasket.clearTodayBasket();
  };

  /**
   * バスケット内の食材更新時のビジネスロジック
   * バスケットと冷蔵庫の両方を更新
   */
  const updateBasketItem = (updatedItem: FoodItem) => {
    todayBasket.updateBasketItem(updatedItem);
    fridgeItems.updateFridgeItem(updatedItem);
  };

  return {
    // States
    foodItems: fridgeItems.foodItems,
    todayBasket: todayBasket.todayBasket,
    purchaseHistory: purchaseHistory.purchaseHistory,

    // Food operations
    handleReceiptScanned,
    removeFromFridge,
    updateFridgeItem: fridgeItems.updateFridgeItem,
    addFridgeItem,
    getExpiringItems: fridgeItems.getExpiringItems,
    getExpiringCount: fridgeItems.getExpiringCount,
    handleBulkDeleteExpiring: fridgeItems.handleBulkDeleteExpiring,

    // Basket operations
    moveToBasket: todayBasket.moveToBasket,
    removeFromBasket: todayBasket.removeFromBasket,
    clearTodayBasket,
    updateBasketItem,

    // Purchase history operations
    updatePurchaseHistory: purchaseHistory.updatePurchaseHistory,
    deletePurchaseHistory: purchaseHistory.deletePurchaseHistory,
  };
};
