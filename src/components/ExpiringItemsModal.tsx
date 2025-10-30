import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar,
  ShoppingBasket,
  Trash2,
  X,
  Leaf,
  Fish,
  Milk,
  Snowflake,
  MoreHorizontal
} from 'lucide-react';
import { TbMeat } from "react-icons/tb";
import { RiBreadLine } from "react-icons/ri";
import { GiSaltShaker } from 'react-icons/gi';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  price: number;
  isInBasket: boolean;
  image?: string;
}

interface ExpiringItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiringItems: FoodItem[];
  onMoveToBasket: (item: FoodItem) => void;
  onRemoveItem: (itemId: string) => void;
  onBulkDelete: (itemIds: string[]) => void;
}

const categoryIcons = {
  '野菜': Leaf,
  '肉類': TbMeat,
  '魚類': Fish,
  '乳製品': Milk,
  '調味料': GiSaltShaker,
  'パン・米類': RiBreadLine,
  '冷凍食品': Snowflake,
  'その他': MoreHorizontal
};

const categoryIconColors = {
  '野菜': { bg: 'bg-red-50', text: 'text-red-600' },
  '肉類': { bg: 'bg-red-50', text: 'text-red-700' },
  '魚類': { bg: 'bg-red-50', text: 'text-red-600' },
  '乳製品': { bg: 'bg-red-50', text: 'text-red-500' },
  '調味料': { bg: 'bg-red-50', text: 'text-red-700' },
  'パン・米類': { bg: 'bg-red-50', text: 'text-red-600' },
  '冷凍食品': { bg: 'bg-red-50', text: 'text-red-800' },
  'その他': { bg: 'bg-red-50', text: 'text-red-500' }
};

const ExpiringItemsModal: React.FC<ExpiringItemsModalProps> = ({
  isOpen,
  onClose,
  expiringItems,
  onMoveToBasket,
  onRemoveItem,
  onBulkDelete
}) => {
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { status: 'expired', color: 'bg-red-500', text: '期限切れ' };
    if (days === 0) return { status: 'today', color: 'bg-red-400', text: '今日まで' };
    if (days === 1) return { status: 'tomorrow', color: 'bg-orange-400', text: '明日まで' };
    if (days <= 3) return { status: 'soon', color: 'bg-yellow-400', text: `${days}日後` };
    return { status: 'safe', color: 'bg-green-400', text: `${days}日後` };
  };

  const handleMoveToBasket = (item: FoodItem) => {
    onMoveToBasket(item);
    toast.success(`${item.name}を今日の献立に追加しました`);
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    onRemoveItem(itemId);
    toast.success(`${itemName}を削除しました`);
  };

  const handleBulkDelete = () => {
    if (expiringItems.length === 0) return;
    
    const itemIds = expiringItems.map(item => item.id);
    onBulkDelete(itemIds);
    toast.success(`期限切れ間近の食材${expiringItems.length}個を一括削除しました`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden mx-4">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-neutral-900">期限切れ間近の食材</span>
            </div>
            <Badge className="bg-warning-100 text-warning-800 border border-warning-200 self-start sm:self-auto">
              {expiringItems.length}件
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[55vh] sm:max-h-[50vh] pr-1 sm:pr-2">
          {expiringItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-success-50 rounded-full mx-auto mb-4 w-fit">
                <Leaf className="h-12 w-12 text-success-600" />
              </div>
              <p className="text-lg font-medium text-neutral-700">期限切れ間近の食材はありません</p>
              <p className="text-sm text-neutral-500 mt-2">すべての食材が新鮮です！</p>
            </div>
          ) : (
            expiringItems.map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || MoreHorizontal;
              const iconColors = categoryIconColors[item.category as keyof typeof categoryIconColors] || { bg: 'bg-red-50', text: 'text-red-600' };

              return (
                <Card key={item.id} className="p-4 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
                  <div className="space-y-4">
                    {/* モバイル対応: 上部にアイコンと基本情報 */}
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 ${iconColors.bg} rounded-lg flex-shrink-0`}>
                        <IconComponent className={`text-lg ${iconColors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-semibold text-neutral-900 text-base">{item.name}</h4>
                          <Badge className={`${expiryStatus.color} text-black text-xs px-2 py-1 rounded-md font-medium hover:${expiryStatus.color} pointer-events-none flex-shrink-0`}>
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
                        onClick={() => handleMoveToBasket(item)}
                        className="bg-success-600 hover:bg-success-700 text-white transition-colors duration-200 flex-1 sm:flex-none"
                      >
                        <ShoppingBasket className="h-4 w-4 mr-2" />
                        今日の献立へ
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="border-danger-300 text-danger-600 hover:bg-danger-50 transition-colors duration-200 flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {expiringItems.length > 0 && (
          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div className="text-sm text-neutral-600 font-medium text-center sm:text-left">
              期限切れ間近の食材が{expiringItems.length}個あります
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors duration-200 flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                閉じる
              </Button>

              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="bg-danger-600 hover:bg-danger-700 text-white transition-colors duration-200 flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                すべて削除
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExpiringItemsModal;
