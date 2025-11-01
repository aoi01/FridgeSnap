/**
 * 期限切れ間近食材モーダルコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - 期限切れ間近の食材一覧表示
 * - 食材を今日の献立に追加
 * - 食材の個別削除
 * - 期限切れ食材の一括削除
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Calendar, ShoppingBasket, Trash2, X, HelpCircle } from 'lucide-react';

// 型定義とユーティリティのインポート
import { FoodItem } from '@/types/food';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';
import { calculateDaysUntilExpiry } from '@/utils/foodUtils';

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

/**
 * カテゴリごとのアイコン表示色
 * 警告モーダルでは統一的な赤色系を使用
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

const ExpiringItemsModal: React.FC<ExpiringItemsModalProps> = ({
  isOpen,
  onClose,
  expiringItems,
  onMoveToBasket,
  onRemoveItem,
  onBulkDelete
}) => {
  /**
   * 有効期限のステータスを取得する
   * foodUtils.tsの関数を使用し、UIに適したフォーマットで返す
   */
  const getExpiryStatus = (expiryDate: string) => {
    const days = calculateDaysUntilExpiry(expiryDate);

    // 期限切れ
    if (days < 0) return { status: 'expired', color: 'bg-red-500', text: '期限切れ' };
    // 本日期限
    if (days === 0) return { status: 'today', color: 'bg-red-400', text: '今日まで' };
    // 明日期限
    if (days === 1) return { status: 'tomorrow', color: 'bg-orange-400', text: '明日まで' };
    // 数日以内
    if (days <= 3) return { status: 'soon', color: 'bg-yellow-400', text: `${days}日後` };
    // 安全
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
                <AlertTriangle className="h-12 w-12 text-success-600" />
              </div>
              <p className="text-lg font-medium text-neutral-700">期限切れ間近の食材はありません</p>
              <p className="text-sm text-neutral-500 mt-2">すべての食材が新鮮です！</p>
            </div>
          ) : (
            expiringItems.map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              // カテゴリに対応するアイコンと色を取得
              const IconComponent = CATEGORY_ICONS[item.category] || HelpCircle;
              const iconColors = categoryIconColors[item.category] || { bg: 'bg-red-50', text: 'text-red-600' };

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
