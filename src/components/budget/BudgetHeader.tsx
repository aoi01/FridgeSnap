/**
 * 家計簿ヘッダーコンポーネント
 *
 * タイトル、アイコン、説明文を表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { IoWalletOutline } from 'react-icons/io5';

const BudgetHeader: React.FC = () => {
  return (
    <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-discovery-600 p-3 rounded-2xl shadow-md">
            <IoWalletOutline className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">家計簿</h1>
            <p className="text-sm text-neutral-600 font-medium mt-1">食費管理とエンゲル係数分析</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BudgetHeader;
