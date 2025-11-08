/**
 * バスケットアイテムカードコンポーネント
 *
 * 今日の献立に追加された個別食材をカード形式で表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IoCalendarOutline, IoTrashOutline } from 'react-icons/io5';
import { FoodItem } from '@/types/food';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';
import { adjustDateWithMinimum } from '@/utils/dateUtils';

interface BasketItemCardProps {
  /** 食材 */
  item: FoodItem;
  /** 削除するコールバック */
  onRemoveItem: (itemId: string) => void;
  /** 更新するコールバック */
  onUpdateItem: (updatedItem: FoodItem) => void;
}

/**
 * カテゴリごとのアイコン表示色
 * 献立ビューでは統一的な緑色系を使用
 */
const categoryIconColors: Record<string, { bg: string; text: string }> = {
  '野菜': { bg: 'bg-green-50', text: 'text-green-600' },
  '肉類': { bg: 'bg-green-50', text: 'text-green-700' },
  '魚類': { bg: 'bg-green-50', text: 'text-green-600' },
  '乳製品': { bg: 'bg-green-50', text: 'text-green-500' },
  '調味料': { bg: 'bg-green-50', text: 'text-green-700' },
  'パン・米類': { bg: 'bg-green-50', text: 'text-green-600' },
  '冷凍食品': { bg: 'bg-green-50', text: 'text-green-800' },
  'その他': { bg: 'bg-green-50', text: 'text-green-500' }
};

const BasketItemCard: React.FC<BasketItemCardProps> = ({ item, onRemoveItem, onUpdateItem }) => {
  const IconComponent = CATEGORY_ICONS[item.category];
  const iconColors = categoryIconColors[item.category] || { bg: 'bg-green-50', text: 'text-green-600' };

  return (
    <Card className="p-4 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 ${iconColors.bg} rounded-lg`}>
            <IconComponent className={`text-lg ${iconColors.text}`} />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 text-base mb-1">{item.name}</h4>
            <Badge className="bg-neutral-100 text-neutral-700 border-0 rounded-md px-2 py-1 text-xs">
              {item.category}
            </Badge>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemoveItem(item.id)}
          className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors duration-200 p-1"
        >
          <IoTrashOutline className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 text-sm text-neutral-600">
        <div className="flex justify-between items-center">
          <span>数量:</span>
          <span className="font-medium text-neutral-900">{item.quantity}</span>
        </div>
        {item.price > 0 && (
          <div className="flex justify-between items-center">
            <span>価格:</span>
            <span className="font-medium text-success-600">¥{item.price.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200">
          <span className="flex items-center">
            <IoCalendarOutline className="h-3 w-3 mr-1" />
            期限:
          </span>
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newExpiryDate = adjustDateWithMinimum(item.expiryDate, -1);
                onUpdateItem({ ...item, expiryDate: newExpiryDate });
              }}
              className="h-5 w-5 p-0 text-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
            >
              -
            </Button>
            <span className="text-black font-medium min-w-[70px] text-center text-xs cursor-default">
              {item.expiryDate}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newExpiryDate = adjustDateWithMinimum(item.expiryDate, 1);
                onUpdateItem({ ...item, expiryDate: newExpiryDate });
              }}
              className="h-5 w-5 p-0 text-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
            >
              +
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BasketItemCard;
