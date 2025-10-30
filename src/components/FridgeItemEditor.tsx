/**
 * 食材編集・追加モーダルコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - 既存食材の編集
 * - 新規食材の追加
 * - フォームバリデーション
 * - 賞味期限の簡単調整（±1日ボタン）
 */

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';

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
 * 現在の日付を YYYY-MM-DD 形式で取得
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 指定日数後の日付を YYYY-MM-DD 形式で取得
 *
 * @param days - 日数（正の数で未来、負の数で過去）
 * @returns YYYY-MM-DD 形式の日付文字列
 */
const getDateAfterDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * 食材編集・追加モーダルコンポーネント
 */
const FridgeItemEditor: React.FC<FridgeItemEditorProps> = ({ item, onSave, onCancel }) => {
  /**
   * 編集中の食材データ
   * itemが渡されなかった場合は新規食材のデフォルト値を使用
   */
  const [editedItem, setEditedItem] = useState<FoodItem>(
    item || {
      id: crypto.randomUUID(),
      name: '',
      category: FOOD_CATEGORIES[0], // デフォルトカテゴリ（野菜）
      purchaseDate: getTodayDate(), // 今日の日付
      expiryDate: getDateAfterDays(DEFAULT_EXPIRY_DAYS), // 7日後
      quantity: 1,
      price: 0,
      isInBasket: false,
    }
  );

  /**
   * 保存ボタンクリック時のハンドラー
   * 編集された食材データを親コンポーネントに通知
   */
  const handleSave = (): void => {
    onSave(editedItem);
  };

  /**
   * 賞味期限の日付を調整する関数
   *
   * @param days - 調整する日数（+1 または -1）
   */
  const adjustExpiryDate = (days: number): void => {
    if (!editedItem.expiryDate) {
      // 賞味期限が未設定の場合は今日の日付を設定
      setEditedItem((prev) => ({ ...prev, expiryDate: getTodayDate() }));
      return;
    }

    const currentDate = new Date(editedItem.expiryDate);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);

    // 今日より前の日付には設定できない
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate >= today) {
      setEditedItem((prev) => ({
        ...prev,
        expiryDate: newDate.toISOString().split('T')[0],
      }));
    }
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

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">食材名</Label>
            <Input
              id="name"
              value={editedItem.name}
              onChange={(e) => setEditedItem(prev => ({ ...prev, name: e.target.value }))}
              placeholder="食材名を入力"
            />
          </div>

          <div>
            <Label htmlFor="category">カテゴリ</Label>
            <Select
              value={editedItem.category}
              onValueChange={(value) => setEditedItem(prev => ({ ...prev, category: value }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                value={editedItem.quantity}
                onChange={(e) => setEditedItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="price">価格 (円)</Label>
              <Input
                id="price"
                type="number"
                value={editedItem.price}
                onChange={(e) => setEditedItem(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseDate">購入日</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={editedItem.purchaseDate}
                onChange={(e) => setEditedItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
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
                  onChange={(e) =>
                    setEditedItem((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="flex-1"
                  min={getTodayDate()} // 今日以降のみ選択可能
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

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
            <Button onClick={onCancel} variant="outline" className="flex-1">
              キャンセル
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FridgeItemEditor;
