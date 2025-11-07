/**
 * 保存方法Tipsモーダルコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - カテゴリごとの保存方法Tipsを表示
 * - Tipsを実行して賞味期限を延長
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lightbulb, Calendar, CheckCircle, X } from 'lucide-react';

import { FoodItem } from '@/types/food';
import { STORAGE_TIPS, StorageTip } from '@/constants';

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

        <div className="space-y-4 mt-4">
          {tips.length === 0 ? (
            <Card className="p-8 text-center bg-neutral-50 border-neutral-200">
              <Lightbulb className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 font-medium">
                このカテゴリの保存Tipsは現在準備中です
              </p>
            </Card>
          ) : (
            tips.map((tip, index) => {
              const isApplied = item.appliedStorageTips?.includes(tip.title) || false;

              return (
                <Card
                  key={index}
                  className={`p-5 border-neutral-200 transition-all duration-200 ${
                    isApplied
                      ? 'bg-neutral-100 border-neutral-300 opacity-60'
                      : 'bg-white hover:border-brand-300 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Tipヘッダー */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-bold text-lg ${isApplied ? 'text-neutral-600' : 'text-neutral-900'}`}>
                            {tip.title}
                          </h4>
                          {isApplied ? (
                            <Badge
                              variant="outline"
                              className="bg-neutral-200 text-neutral-600 border-neutral-400 font-semibold"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              適用済み
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-brand-50 text-brand-700 border-brand-300 font-semibold"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              +{tip.extendDays}日
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${isApplied ? 'text-neutral-500' : 'text-neutral-600'}`}>
                          {tip.description}
                        </p>
                      </div>
                    </div>

                    {/* 実行ボタン */}
                    <Button
                      onClick={() => handleApplyTip(tip)}
                      disabled={isApplied}
                      className={`w-full font-medium shadow-sm transition-all duration-200 ${
                        isApplied
                          ? 'bg-neutral-400 hover:bg-neutral-400 text-neutral-200 cursor-not-allowed'
                          : 'bg-success-600 hover:bg-success-700 text-white hover:shadow-md'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isApplied ? 'この方法は実行済みです' : 'この方法を実行した'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
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
