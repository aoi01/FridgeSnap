/**
 * 生活費入力フォームコンポーネント
 *
 * 今月の生活費を入力・保存する機能を提供
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { IoSaveOutline } from 'react-icons/io5';

interface LivingExpenseInputProps {
  /** 現在の月キー（YYYY-MM形式） */
  currentMonthKey: string;
  /** 生活費を保存するコールバック関数 */
  onSave: (monthKey: string, amount: number) => void;
}

const LivingExpenseInput: React.FC<LivingExpenseInputProps> = ({
  currentMonthKey,
  onSave
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount < 0) {
      toast.error('正しい金額を入力してください');
      return;
    }

    onSave(currentMonthKey, amount);
    toast.success('今月の生活費を保存しました');
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-warning-50 p-2 rounded-lg">
          <IoSaveOutline className="h-5 w-5 text-warning-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">今月の生活費を入力</h3>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          type="number"
          placeholder="生活費総額を入力..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button
          onClick={handleSave}
          className="bg-warning-600 hover:bg-warning-700 text-white px-6"
        >
          保存
        </Button>
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        ※家賃、光熱費、食費、交通費などの生活に必要な総支出額を入力してください
      </p>
    </Card>
  );
};

export default LivingExpenseInput;
