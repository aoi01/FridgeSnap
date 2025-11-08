/**
 * 食材編集・追加モーダルコンポーネント
 *
 * 食材の編集と新規追加を行うモーダルフォーム
 * フォームフィールドはFridgeItemFormFieldsコンポーネントに委譲
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';
import { getTodayDate, getDateAfterDays } from '@/utils/dateUtils';
import FridgeItemFormFields from './fridge/FridgeItemFormFields';
import FridgeItemFormActions from './fridge/FridgeItemFormActions';

/**
 * FridgeItemEditor のプロパティ
 */
interface FridgeItemEditorProps {
  /** 編集する食材（未指定の場合は新規追加モード） */
  item?: FoodItem;
  /** 保存時のコールバック関数 */
  onSave: (updatedItem: FoodItem) => void;
  /** キャンセル時のコールバック関数 */
  onCancel: () => void;
}

/**
 * デフォルトの賞味期限日数（購入日から何日後）
 */
const DEFAULT_EXPIRY_DAYS = 7;

/**
 * デフォルトの食材データを作成
 */
const createDefaultItem = (): FoodItem => ({
  id: crypto.randomUUID(),
  name: '',
  category: FOOD_CATEGORIES[0],
  purchaseDate: getTodayDate(),
  expiryDate: getDateAfterDays(DEFAULT_EXPIRY_DAYS),
  quantity: 1,
  price: 0,
  isInBasket: false,
});

const FridgeItemEditor: React.FC<FridgeItemEditorProps> = ({ item, onSave, onCancel }) => {
  /**
   * 編集中の食材データ
   */
  const [editedItem, setEditedItem] = useState<FoodItem>(item || createDefaultItem());

  /**
   * フィールド変更時のハンドラー
   */
  const handleFieldChange = (updates: Partial<FoodItem>) => {
    setEditedItem((prev) => ({ ...prev, ...updates }));
  };

  /**
   * 保存時のハンドラー
   */
  const handleSave = (): void => {
    onSave(editedItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-4 sm:p-6 bg-white">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl font-bold">{item ? '食材を編集' : '食材を追加'}</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* フォームフィールド */}
        <FridgeItemFormFields
          editedItem={editedItem}
          onFieldChange={handleFieldChange}
        />

        {/* アクションボタン */}
        <FridgeItemFormActions
          isEditMode={!!item}
          onSave={handleSave}
          onCancel={onCancel}
        />
      </Card>
    </div>
  );
};

export default FridgeItemEditor;
