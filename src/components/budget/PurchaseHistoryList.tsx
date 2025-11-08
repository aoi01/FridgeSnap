/**
 * 購入履歴リストコンポーネント
 *
 * 今月の購入履歴を表示する機能を提供
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { IoReceiptOutline, IoCalendarOutline } from 'react-icons/io5';
import { FoodItem } from '@/types/food';
import { formatCurrency } from '@/utils/budgetUtils';

interface PurchaseHistoryListProps {
  /** 購入履歴アイテム */
  items: FoodItem[];
}

const PurchaseHistoryList: React.FC<PurchaseHistoryListProps> = ({ items }) => {
  return (
    <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-success-50 p-2 rounded-lg">
          <IoReceiptOutline className="h-5 w-5 text-success-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">今月の購入履歴</h3>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div>
                <p className="font-medium text-neutral-900">{item.name}</p>
                <p className="text-sm text-neutral-600 flex items-center">
                  <IoCalendarOutline className="h-3 w-3 mr-1" />
                  {item.purchaseDate} • {item.category} • 数量: {item.quantity}
                </p>
              </div>
              <p className="font-bold text-neutral-900">{formatCurrency(item.price)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-neutral-100 p-4 rounded-full mx-auto mb-4 w-fit">
            <IoReceiptOutline className="h-8 w-8 text-neutral-500" />
          </div>
          <p className="text-neutral-600">今月の購入履歴がありません</p>
          <p className="text-sm text-neutral-500 mt-1">
            レシートをスキャンして食材を追加しましょう
          </p>
        </div>
      )}
    </Card>
  );
};

export default PurchaseHistoryList;
