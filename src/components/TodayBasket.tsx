/**
 * 今日の献立コンポーネント
 *
 * 今日使用する食材の一覧表示と献立管理機能を提供
 * アイテム表示はBasketItemCardコンポーネントに委譲
 */

import React from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { FoodItem } from '@/types/food';
import BasketItemCard from './basket/BasketItemCard';
import BasketActionSection from './basket/BasketActionSection';

/**
 * TodayBasket コンポーネントのプロパティ
 */
interface TodayBasketProps {
  /** 今日の献立に追加された食材リスト */
  basketItems: FoodItem[];
  /** 食材を削除する関数 */
  onRemoveItem: (itemId: string) => void;
  /** 献立を全てクリアする関数 */
  onClearBasket: () => void;
  /** 食材を更新する関数 */
  onUpdateItem: (updatedItem: FoodItem) => void;
}

const TodayBasket: React.FC<TodayBasketProps> = ({ basketItems, onRemoveItem, onClearBasket, onUpdateItem }) => {
  // 空状態
  if (basketItems.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-16 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-neutral-100 rounded-full">
            <IoCalendarOutline className="text-6xl text-neutral-600" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-neutral-900 mb-3">今日の献立に何も選択されていません</h3>
        <p className="text-neutral-600 text-base max-w-md mx-auto">冷蔵庫から食材を選んで今日使う食材を準備しましょう！</p>
      </div>
    );
  }

  // 通常表示
  return (
    <div className="space-y-6">
      {/* アイテムグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {basketItems.map((item) => (
          <BasketItemCard
            key={item.id}
            item={item}
            onRemoveItem={onRemoveItem}
            onUpdateItem={onUpdateItem}
          />
        ))}
      </div>

      {/* アクションセクション */}
      <BasketActionSection
        itemCount={basketItems.length}
        onClearBasket={onClearBasket}
      />
    </div>
  );
};

export default TodayBasket;
