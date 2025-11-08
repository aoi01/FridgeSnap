/**
 * 冷蔵庫ビューコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - カテゴリ別の食材表示
 * - 食材の追加・編集・削除
 * - 今日の献立への追加
 * - 有効期限の視覚的表示
 */

import React, { useState } from 'react';
import FridgeAddForm from '@/components/fridge/FridgeAddForm';
import CategorySection from '@/components/fridge/CategorySection';
import FridgeItemEditor from '@/components/FridgeItemEditor';
import StorageTipsModal from '@/components/StorageTipsModal';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';

/**
 * FridgeView コンポーネントのプロパティ
 */
interface FridgeViewProps {
  /** 表示する食材リスト */
  foodItems: FoodItem[];
  /** 食材を今日の献立に追加する関数 */
  onMoveToBasket: (item: FoodItem) => void;
  /** 食材を削除する関数 */
  onRemoveItem: (itemId: string) => void;
  /** 食材を更新する関数 */
  onUpdateItem: (updatedItem: FoodItem) => void;
  /** 新しい食材を追加する関数 */
  onAddItem: (item: FoodItem) => void;
}

const FridgeView: React.FC<FridgeViewProps> = ({
  foodItems,
  onMoveToBasket,
  onRemoveItem,
  onUpdateItem,
  onAddItem,
}) => {
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedItemForTips, setSelectedItemForTips] = useState<FoodItem | null>(null);

  /**
   * 食材をカテゴリ別にグループ化
   * FOOD_CATEGORIESの順序を保つためにreduceを使用
   */
  const groupedItems = foodItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, FoodItem[]>
  );

  /**
   * 保存Tipsを適用して賞味期限を延長する
   */
  const handleExtendExpiry = (itemId: string, days: number, tipTitle: string) => {
    const item = foodItems.find((i) => i.id === itemId);
    if (!item) return;

    // 既に適用済みのTipsかチェック
    if (item.appliedStorageTips?.includes(tipTitle)) {
      return;
    }

    const currentExpiry = new Date(item.expiryDate);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    const updatedItem = {
      ...item,
      expiryDate: newExpiry.toISOString().split('T')[0],
      appliedStorageTips: [...(item.appliedStorageTips || []), tipTitle],
    };

    onUpdateItem(updatedItem);
  };

  const handleEditSave = (updatedItem: FoodItem) => {
    onUpdateItem(updatedItem);
    setEditingItem(null);
  };

  const openTipsModal = (item: FoodItem) => {
    setSelectedItemForTips(item);
    setShowTipsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 手動食材追加フォーム */}
      <FridgeAddForm onAddItem={onAddItem} />

      {/* カテゴリ別食材表示 */}
      {foodItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {FOOD_CATEGORIES.filter((category) => groupedItems[category]?.length > 0).map(
            (category) => {
              const items = groupedItems[category];
              return (
                <CategorySection
                  key={category}
                  category={category}
                  items={items}
                  onAddItem={onAddItem}
                  onEditItem={setEditingItem}
                  onRemoveItem={onRemoveItem}
                  onMoveToBasket={onMoveToBasket}
                  onUpdateExpiry={onUpdateItem}
                  onOpenTips={openTipsModal}
                />
              );
            }
          )}
        </div>
      )}

      {/* 編集モーダル */}
      {editingItem && (
        <FridgeItemEditor
          item={editingItem}
          onSave={handleEditSave}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {/* 保存Tipsモーダル */}
      <StorageTipsModal
        isOpen={showTipsModal}
        onClose={() => {
          setShowTipsModal(false);
          setSelectedItemForTips(null);
        }}
        item={selectedItemForTips}
        onExtendExpiry={handleExtendExpiry}
      />
    </div>
  );
};

export default FridgeView;
