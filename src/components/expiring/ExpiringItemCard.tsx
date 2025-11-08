/**
 * 期限切れ間近食材カードコンポーネント
 *
 * 個別の期限切れ食材をカード形式で表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ShoppingBasket, Trash2, HelpCircle } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';
import { getExpiryStatusUI } from '@/hooks/useExpiryStatus';

interface ExpiringItemCardProps {
  /** 食材 */
  item: FoodItem;
  /** 今日の献立に追加するコールバック */
  onMoveToBasket: (item: FoodItem) => void;
  /** 削除するコールバック */
  onRemoveItem: (itemId: string, itemName: string) => void;
}

/**
 * カテゴリごとのアイコン表示色
 */
const categoryIconColors: Record<string, { bg: string; text: string }> = {
  '野菜': { bg: 'bg-red-50', text: 'text-red-600' },
  '肉類': { bg: 'bg-red-50', text: 'text-red-700' },
  '魚類': { bg: 'bg-red-50', text: 'text-red-600' },
  '乳製品': { bg: 'bg-red-50', text: 'text-red-500' },
  '調味料': { bg: 'bg-red-50', text: 'text-red-700' },
  'パン': { bg: 'bg-red-50', text: 'text-red-600' },
  '麺類': { bg: 'bg-red-50', text: 'text-red-600' },
  '冷凍食品': { bg: 'bg-red-50', text: 'text-red-800' },
  'その他': { bg: 'bg-red-50', text: 'text-red-500' }
};

const ExpiringItemCard: React.FC<ExpiringItemCardProps> = ({
  item,
  onMoveToBasket,
  onRemoveItem
}) => {
  const expiryStatus = getExpiryStatusUI(item.expiryDate);
  const IconComponent = CATEGORY_ICONS[item.category] || HelpCircle;
  const iconColors = categoryIconColors[item.category] || { bg: 'bg-red-50', text: 'text-red-600' };

  return (
    <Card className="p-4 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
      <div className="space-y-4">
        {/* モバイル対応: 上部にアイコンと基本情報 */}
        <div className="flex items-start space-x-3">
          <div className={`p-2 ${iconColors.bg} rounded-lg flex-shrink-0`}>
            <IconComponent className={`text-lg ${iconColors.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h4 className="font-semibold text-neutral-900 text-base">{item.name}</h4>
              <Badge className={`${expiryStatus.badgeColor} text-black text-xs px-2 py-1 rounded-md font-medium hover:${expiryStatus.badgeColor} pointer-events-none flex-shrink-0`}>
                {expiryStatus.text}
              </Badge>
            </div>

            {/* モバイル対応: 詳細情報を縦並びまたは横並びに */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-4 text-sm text-neutral-600">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">購入: {item.purchaseDate}</span>
              </span>
              <span className="truncate">カテゴリ: {item.category}</span>
              <span>数量: {item.quantity}</span>
              {item.price > 0 && (
                <span className="font-medium text-success-600">¥{item.price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* モバイル対応: ボタンを下部に配置 */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-100">
          <Button
            size="sm"
            onClick={() => onMoveToBasket(item)}
            className="bg-success-600 hover:bg-success-700 text-white transition-colors duration-200 flex-1 sm:flex-none"
          >
            <ShoppingBasket className="h-4 w-4 mr-2" />
            今日の献立へ
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemoveItem(item.id, item.name)}
            className="border-danger-300 text-danger-600 hover:bg-danger-50 transition-colors duration-200 flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            削除
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ExpiringItemCard;
