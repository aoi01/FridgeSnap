/**
 * 期限切れ間近食材モーダルコンポーネント
 *
 * 期限切れ間近の食材一覧を表示し、追加・削除・一括削除機能を提供
 * リスト表示はExpiringItemListコンポーネントに委譲
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { FoodItem } from '@/types/food';
import ExpiringItemList from './expiring/ExpiringItemList';

/**
 * ExpiringItemsModal コンポーネントのプロパティ
 */
interface ExpiringItemsModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** モーダルを閉じる関数 */
  onClose: () => void;
  /** 期限切れ間近の食材リスト */
  expiringItems: FoodItem[];
  /** 食材を今日の献立に追加する関数 */
  onMoveToBasket: (item: FoodItem) => void;
  /** 食材を削除する関数 */
  onRemoveItem: (itemId: string) => void;
  /** 複数の食材を一括削除する関数 */
  onBulkDelete: (itemIds: string[]) => void;
}

const ExpiringItemsModal: React.FC<ExpiringItemsModalProps> = ({
  isOpen,
  onClose,
  expiringItems,
  onMoveToBasket,
  onRemoveItem,
  onBulkDelete
}) => {
  /**
   * 今日の献立に追加するハンドラー
   */
  const handleMoveToBasket = (item: FoodItem) => {
    onMoveToBasket(item);
    toast.success(`${item.name}を今日の献立に追加しました`);
  };

  /**
   * 削除するハンドラー
   */
  const handleRemoveItem = (itemId: string, itemName: string) => {
    onRemoveItem(itemId);
    toast.success(`${itemName}を削除しました`);
  };

  /**
   * 一括削除するハンドラー
   */
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

        <div className="overflow-y-auto max-h-[55vh] sm:max-h-[50vh] pr-1 sm:pr-2">
          <ExpiringItemList
            items={expiringItems}
            onMoveToBasket={handleMoveToBasket}
            onRemoveItem={handleRemoveItem}
          />
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
