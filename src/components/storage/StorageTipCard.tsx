/**
 * 保存方法Tipカードコンポーネント
 *
 * 個別の保存方法をカード形式で表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';
import { StorageTip } from '@/constants';

interface StorageTipCardProps {
  /** 保存Tip情報 */
  tip: StorageTip;
  /** このTipが既に適用されているか */
  isApplied: boolean;
  /** Tipを実行するコールバック */
  onApply: (tip: StorageTip) => void;
}

const StorageTipCard: React.FC<StorageTipCardProps> = ({ tip, isApplied, onApply }) => {
  return (
    <Card
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
          onClick={() => onApply(tip)}
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
};

export default StorageTipCard;
