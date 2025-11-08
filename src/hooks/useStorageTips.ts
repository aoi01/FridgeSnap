/**
 * 保存ヒント管理カスタムフック
 *
 * このフックは以下の機能を提供します：
 * - 保存ヒントの適用と賞味期限延長
 * - 重複適用の防止
 * - モーダル状態の管理
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { FoodItem } from '@/types/food';
import { STORAGE_TIPS } from '@/constants';

/**
 * 保存ヒント管理フック
 *
 * @param onUpdateItem - 食材更新コールバック
 * @returns 保存ヒント管理機能一式
 */
export const useStorageTips = (
  foodItems: FoodItem[],
  onUpdateItem: (item: FoodItem) => void
) => {
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedItemForTips, setSelectedItemForTips] = useState<FoodItem | null>(null);

  /**
   * 保存Tipsを適用して賞味期限を延長する
   */
  const handleExtendExpiry = (itemId: string, days: number, tipTitle: string) => {
    const item = foodItems.find(i => i.id === itemId);
    if (!item) return;

    // 既に適用済みのTipsかチェック
    if (item.appliedStorageTips?.includes(tipTitle)) {
      toast.warning('このTipsは既に適用済みです');
      return;
    }

    const currentExpiry = new Date(item.expiryDate);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    const updatedItem = {
      ...item,
      expiryDate: newExpiry.toISOString().split('T')[0],
      appliedStorageTips: [...(item.appliedStorageTips || []), tipTitle]
    };

    onUpdateItem(updatedItem);
  };

  /**
   * 保存Tipsモーダルを開く
   */
  const openTipsModal = (item: FoodItem) => {
    const tips = STORAGE_TIPS[item.category];
    if (!tips || tips.length === 0) {
      toast.info('このカテゴリの保存Tipsは現在準備中です');
      return;
    }
    setSelectedItemForTips(item);
    setShowTipsModal(true);
  };

  /**
   * 保存Tipsモーダルを閉じる
   */
  const closeTipsModal = () => {
    setShowTipsModal(false);
    setSelectedItemForTips(null);
  };

  return {
    showTipsModal,
    selectedItemForTips,
    handleExtendExpiry,
    openTipsModal,
    closeTipsModal,
  };
};
