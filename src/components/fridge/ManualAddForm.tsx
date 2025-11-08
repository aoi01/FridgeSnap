/**
 * 手動食材追加フォームコンポーネント
 *
 * 食材を手動で追加するためのフォーム
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IoAddOutline, IoAddCircleOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';

interface ManualAddFormProps {
  onAddItem: (item: FoodItem) => void;
}

const ManualAddForm: React.FC<ManualAddFormProps> = ({ onAddItem }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: FOOD_CATEGORIES[0],
    quantity: 1,
    price: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date().toISOString().split('T')[0]
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.expiryDate) {
      toast.error('必須項目を入力してください');
      return;
    }

    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      price: newItem.price,
      purchaseDate: newItem.purchaseDate,
      expiryDate: newItem.expiryDate,
      isInBasket: false
    };

    onAddItem(foodItem);
    setNewItem({
      name: '',
      category: FOOD_CATEGORIES[0],
      quantity: 1,
      price: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
    toast.success(`${newItem.name}を冷蔵庫に追加しました`);
  };

  return (
    <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 rounded-lg">
            <IoAddCircleOutline className="text-xl text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">食材を手動で追加</h3>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          className="border-brand-300 text-brand-600 hover:bg-brand-50"
        >
          <IoAddOutline className="h-4 w-4 mr-1" />
          {showAddForm ? 'キャンセル' : '追加'}
        </Button>
      </div>

      {showAddForm && (
        <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          {/* 食材名とカテゴリ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                食材名 <span className="text-danger-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="例: 鶏もも肉"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                カテゴリ <span className="text-danger-600">*</span>
              </label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORIES.map(category => {
                    const IconComponent = CATEGORY_ICONS[category];
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 数量、価格、日付 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">数量</label>
              <Input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">価格 (円)</label>
              <Input
                type="number"
                min="0"
                step="10"
                placeholder="0"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">購入日</label>
              <Input
                type="date"
                value={newItem.purchaseDate}
                onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                賞味期限 <span className="text-danger-600">*</span>
              </label>
              <Input
                type="date"
                value={newItem.expiryDate}
                onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              size="sm"
              className="border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddItem}
              size="sm"
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <IoAddOutline className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ManualAddForm;
