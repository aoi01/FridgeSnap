/**
 * 保存方法Tipsモーダルコンポーネント
 *
 * カテゴリごとの保存方法Tipsを表示
 * リスト表示はStorageTipsListコンポーネントに委譲
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { STORAGE_TIPS, StorageTip } from '@/constants';
import StorageTipsList from './storage/StorageTipsList';

/**
 * StorageTipsModal コンポーネントのプロパティ
 */
interface StorageTipsModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** モーダルを閉じる関数 */
  onClose: () => void;
  /** 対象の食材アイテム */
  item: FoodItem | null;
  /** 賞味期限を延長する関数 */
  onExtendExpiry: (itemId: string, days: number, tipTitle: string) => void;
}

const StorageTipsModal: React.FC<StorageTipsModalProps> = ({
  isOpen,
  onClose,
  item,
  onExtendExpiry
}) => {
  if (!item) return null;

  const tips = STORAGE_TIPS[item.category] || [];

  /**
   * Tipを適用するハンドラー
   */
  const handleApplyTip = (tip: StorageTip) => {
    onExtendExpiry(item.id, tip.extendDays, tip.title);
    toast.success(`${tip.title}を実行しました！`, {
      description: `賞味期限が${tip.extendDays}日延長されました`
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">保存期限を延ばすヒント</DialogTitle>
                <p className="text-sm text-neutral-600 mt-1">
                  {item.name} の保存方法
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Tipsリスト */}
          <StorageTipsList
            item={item}
            tips={tips}
            onApplyTip={handleApplyTip}
          />
        </div>

        {/* フッター */}
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-800">
            <strong>注意:</strong> 実際に保存方法を実行してから「実行した」ボタンを押してください。
            賞味期限は自動的に延長されます。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageTipsModal;
