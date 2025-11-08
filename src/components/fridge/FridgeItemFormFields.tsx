/**
 * 食材フォームフィールドコンポーネント
 *
 * 食材編集フォームの各フィールドを提供
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';
import { getTodayDate, adjustDateWithMinimum } from '@/utils/dateUtils';

interface FridgeItemFormFieldsProps {
  /** 編集中の食材データ */
  editedItem: FoodItem;
  /** フィールド変更時のコールバック */
  onFieldChange: (updates: Partial<FoodItem>) => void;
}

const FridgeItemFormFields: React.FC<FridgeItemFormFieldsProps> = ({ editedItem, onFieldChange }) => {
  /**
   * 賞味期限を調整する
   */
  const adjustExpiryDate = (days: number): void => {
    const currentExpiry = editedItem.expiryDate || getTodayDate();
    const newExpiryDate = adjustDateWithMinimum(currentExpiry, days);
    onFieldChange({ expiryDate: newExpiryDate });
  };

  return (
    <div className="space-y-4">
      {/* 食材名 */}
      <div>
        <Label htmlFor="name">食材名</Label>
        <Input
          id="name"
          value={editedItem.name}
          onChange={(e) => onFieldChange({ name: e.target.value })}
          placeholder="食材名を入力"
        />
      </div>

      {/* カテゴリ */}
      <div>
        <Label htmlFor="category">カテゴリ</Label>
        <Select
          value={editedItem.category}
          onValueChange={(value) => onFieldChange({ category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {FOOD_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 数量と価格 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">数量</Label>
          <Input
            id="quantity"
            type="number"
            value={editedItem.quantity}
            onChange={(e) => onFieldChange({ quantity: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="price">価格 (円)</Label>
          <Input
            id="price"
            type="number"
            value={editedItem.price}
            onChange={(e) => onFieldChange({ price: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      {/* 購入日と賞味期限 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseDate">購入日</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={editedItem.purchaseDate}
            onChange={(e) => onFieldChange({ purchaseDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="expiryDate">賞味期限</Label>
          <div className="flex items-center space-x-1">
            {/* 賞味期限を1日減らすボタン */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustExpiryDate(-1)}
              className="hidden sm:inline-flex px-2 py-1 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              aria-label="賞味期限を1日減らす"
            >
              -1
            </Button>
            {/* 賞味期限入力フィールド */}
            <Input
              id="expiryDate"
              type="date"
              value={editedItem.expiryDate}
              onChange={(e) => onFieldChange({ expiryDate: e.target.value })}
              className="flex-1"
              min={getTodayDate()}
            />
            {/* 賞味期限を1日増やすボタン */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustExpiryDate(1)}
              className="hidden sm:inline-flex px-2 py-1 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              aria-label="賞味期限を1日増やす"
            >
              +1
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FridgeItemFormFields;
