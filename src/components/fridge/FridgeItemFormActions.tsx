/**
 * 食材フォームアクションボタンコンポーネント
 *
 * 保存・キャンセルボタンを提供
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface FridgeItemFormActionsProps {
  /** キャンセルボタンの表示テキスト */
  isEditMode: boolean;
  /** 保存ボタンクリック時のコールバック */
  onSave: () => void;
  /** キャンセルボタンクリック時のコールバック */
  onCancel: () => void;
}

const FridgeItemFormActions: React.FC<FridgeItemFormActionsProps> = ({
  isEditMode,
  onSave,
  onCancel
}) => {
  return (
    <div className="flex space-x-3 pt-4">
      <Button onClick={onSave} className="flex-1">
        <Save className="h-4 w-4 mr-2" />
        保存
      </Button>
      <Button onClick={onCancel} variant="outline" className="flex-1">
        キャンセル
      </Button>
    </div>
  );
};

export default FridgeItemFormActions;
