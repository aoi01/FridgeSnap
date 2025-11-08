/**
 * バスケットアクションセクションコンポーネント
 *
 * 調理完了・一括削除ボタンと関連情報を表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface BasketActionSectionProps {
  /** バスケットアイテム数 */
  itemCount: number;
  /** 調理完了コールバック */
  onClearBasket: () => void;
}

const BasketActionSection: React.FC<BasketActionSectionProps> = ({ itemCount, onClearBasket }) => {
  return (
    <Card className="p-6 bg-success-50 border border-success-200 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-success-800 mb-1 text-lg">調理完了</h3>
          <p className="text-sm text-success-700">
            料理が完了したら、使用した食材をまとめて削除できます
          </p>
        </div>

        <Button
          onClick={onClearBasket}
          className="bg-success-600 hover:bg-success-700 text-white flex items-center space-x-2 px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200"
          disabled={itemCount === 0}
          size="default"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium">調理完了・一括削除</span>
        </Button>
      </div>
    </Card>
  );
};

export default BasketActionSection;
