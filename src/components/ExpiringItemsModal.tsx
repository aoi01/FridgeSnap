import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  IoWarningOutline,
  IoCalendarOutline,
  IoBasket,
  IoTrashOutline,
  IoCloseOutline,
  IoLeaf,
  IoFish,
  IoWater,
  IoSnow,
  IoExtensionPuzzleOutline
} from 'react-icons/io5';
import { GiCow, GiBread, GiSaltShaker } from 'react-icons/gi';

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
  '野菜': IoLeaf,
  '肉類': GiCow,
  '魚類': IoFish,
  '乳製品': IoWater,  
  '調味料': GiSaltShaker,
  'パン・米類': GiBread,
  '冷凍食品': IoSnow,
  'その他': IoExtensionPuzzleOutline
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-warning-50 rounded-lg">
              <IoWarningOutline className="h-6 w-6 text-warning-600" />
            </div>
            <span className="text-xl font-semibold text-neutral-900">期限切れ間近の食材</span>
            <Badge className="bg-warning-600 text-white shadow-sm rounded-md">
              {expiringItems.length}件
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
          {expiringItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-success-50 rounded-full mx-auto mb-4 w-fit">
                <IoLeaf className="h-12 w-12 text-success-600" />
              </div>
              <p className="text-lg font-medium text-neutral-900">期限切れ間近の食材はありません</p>
              <p className="text-sm text-neutral-600 mt-2">すべての食材が新鮮です！</p>
            </div>
          ) : (
            expiringItems.map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || IoExtensionPuzzleOutline;
              
              return (
                <Card key={item.id} className="p-4 bg-white border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        <IconComponent className="text-lg text-neutral-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                          <Badge className={`${expiryStatus.color} text-white text-xs px-3 py-1 shadow-md font-medium`}>
                            {expiryStatus.text}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <IoCalendarOutline className="h-3 w-3 mr-1" />
                            購入: {item.purchaseDate}
                          </span>
                          <span>カテゴリ: {item.category}</span>
                          <span>数量: {item.quantity}</span>
                          {item.price > 0 && (
                            <span className="font-medium text-green-600">¥{item.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleMoveToBasket(item)}
                        className="bg-success-600 hover:bg-success-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <IoBasket className="h-4 w-4 mr-2" />
                        今日の献立へ
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="border-danger-300 text-danger-600 hover:bg-danger-50 hover:border-danger-400 transition-all duration-200"
                      >
                        <IoTrashOutline className="h-4 w-4 mr-1" />
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600 font-medium">
              期限切れ間近の食材が{expiringItems.length}個あります
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <IoCloseOutline className="h-4 w-4 mr-2" />
                閉じる
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <IoTrashOutline className="h-4 w-4 mr-2" />
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