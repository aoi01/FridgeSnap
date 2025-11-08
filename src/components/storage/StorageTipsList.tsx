/**
 * 保存方法Tipsリストコンポーネント
 *
 * 複数の保存Tipをリスト表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { StorageTip } from '@/constants';
import StorageTipCard from './StorageTipCard';

interface StorageTipsListProps {
  /** 食材アイテム */
  item: FoodItem;
  /** 保存Tips配列 */
  tips: StorageTip[];
  /** Tipを実行するコールバック */
  onApplyTip: (tip: StorageTip) => void;
}

const StorageTipsList: React.FC<StorageTipsListProps> = ({ item, tips, onApplyTip }) => {
  if (tips.length === 0) {
    return (
      <Card className="p-8 text-center bg-neutral-50 border-neutral-200">
        <Lightbulb className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-600 font-medium">
          このカテゴリの保存Tipsは現在準備中です
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tips.map((tip, index) => {
        const isApplied = item.appliedStorageTips?.includes(tip.title) || false;

        return (
          <StorageTipCard
            key={index}
            tip={tip}
            isApplied={isApplied}
            onApply={onApplyTip}
          />
        );
      })}
    </div>
  );
};

export default StorageTipsList;
