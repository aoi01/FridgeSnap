/**
 * 冷蔵庫食材カードコンポーネント
 *
 * 個別の食材アイテムを表示・操作するカード
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LuPencil } from 'react-icons/lu';
import {
  IoCalendarOutline,
  IoBasket,
  IoTrashOutline,
  IoWarningOutline,
} from 'react-icons/io5';
import { Lightbulb } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { STORAGE_TIPS } from '@/constants';
import { getExpiryStatusUI } from '@/hooks/useExpiryStatus';
import { adjustDateWithMinimum } from '@/utils/dateUtils';

interface FridgeItemCardProps {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
  onMoveToBasket: (item: FoodItem) => void;
  onRemove: (itemId: string) => void;
  onUpdateExpiry: (item: FoodItem) => void;
  onOpenTips: (item: FoodItem) => void;
}

export const FridgeItemCard: React.FC<FridgeItemCardProps> = ({
  item,
  onEdit,
  onMoveToBasket,
  onRemove,
  onUpdateExpiry,
  onOpenTips,
}) => {
  const expiryStatus = getExpiryStatusUI(item.expiryDate);

  const handleAdjustExpiry = (days: number) => {
    const newExpiryDate = adjustDateWithMinimum(item.expiryDate, days);
    onUpdateExpiry({
      ...item,
      expiryDate: newExpiryDate,
    });
  };

  return (
    <div
      className={`${expiryStatus.cardBg} p-4 rounded-lg border ${expiryStatus.cardBorder} hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-neutral-900 text-base mb-1">{item.name}</h4>
          <p className="text-sm text-neutral-600 mb-1">数量: {item.quantity}</p>
          {item.price > 0 && (
            <p className="text-sm font-medium text-success-600">¥{item.price.toLocaleString()}</p>
          )}
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleAdjustExpiry(-1)}
              className="h-6 w-6 p-0 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
            >
              -
            </Button>
            <Badge
              className={`${expiryStatus.badgeColor} text-black text-xs px-2 py-1 rounded-md font-medium min-w-[60px] text-center cursor-default pointer-events-none`}
            >
              {expiryStatus.text}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleAdjustExpiry(1)}
              className="h-6 w-6 p-0 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
            >
              +
            </Button>
          </div>
          {STORAGE_TIPS[item.category] && STORAGE_TIPS[item.category].length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenTips(item)}
              className="h-7 px-2 text-xs border-brand-300 text-brand-600 hover:bg-brand-50 flex items-center gap-1"
            >
              <Lightbulb className="h-3 w-3" />
              <span>保存ヒント</span>
            </Button>
          )}
          {expiryStatus.status === 'expired' || expiryStatus.status === 'today' ? (
            <IoWarningOutline className="h-5 w-5 text-danger-600" />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 flex items-center">
          <IoCalendarOutline className="h-3 w-3 mr-1" />
          購入: {item.purchaseDate}
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(item)}
            className="h-8 px-3 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors duration-200"
          >
            <LuPencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMoveToBasket(item)}
            className="h-8 px-3 text-xs border-success-300 text-success-600 hover:bg-success-50 transition-colors duration-200"
          >
            <IoBasket className="h-3 w-3 mr-1" />
            献立に
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(item.id)}
            className="h-8 px-3 text-xs border-danger-300 text-danger-600 hover:bg-danger-50 transition-colors duration-200"
          >
            <IoTrashOutline className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FridgeItemCard;
