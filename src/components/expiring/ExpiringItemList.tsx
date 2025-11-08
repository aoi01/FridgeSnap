/**
 * 期限切れ間近食材リストコンポーネント
 *
 * 期限切れ食材のリスト表示と空状態の処理
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FoodItem } from '@/types/food';
import ExpiringItemCard from './ExpiringItemCard';

interface ExpiringItemListProps {
  /** 期限切れ間近の食材リスト */
  items: FoodItem[];
  /** 今日の献立に追加するコールバック */
  onMoveToBasket: (item: FoodItem) => void;
  /** 削除するコールバック */
  onRemoveItem: (itemId: string, itemName: string) => void;
}

const ExpiringItemList: React.FC<ExpiringItemListProps> = ({
  items,
  onMoveToBasket,
  onRemoveItem
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-success-50 rounded-full mx-auto mb-4 w-fit">
          <AlertTriangle className="h-12 w-12 text-success-600" />
        </div>
        <p className="text-lg font-medium text-neutral-700">期限切れ間近の食材はありません</p>
        <p className="text-sm text-neutral-500 mt-2">すべての食材が新鮮です！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {items.map((item) => (
        <ExpiringItemCard
          key={item.id}
          item={item}
          onMoveToBasket={onMoveToBasket}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </div>
  );
};

export default ExpiringItemList;
