/**
 * 冷蔵庫食材追加フォームコンポーネント
 *
 * 新規食材を手動で追加するためのメインフォームを提供
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { IoAddOutline, IoAddCircleOutline } from 'react-icons/io5';
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';
import { useFridgeForm } from '@/hooks/useFridgeForm';

interface FridgeAddFormProps {
  onAddItem: (item: FoodItem) => void;
}

export const FridgeAddForm: React.FC<FridgeAddFormProps> = ({ onAddItem }) => {
  const [showForm, setShowForm] = React.useState(false);
  const { formData, updateField, reset, validate } = useFridgeForm();

  const handleAddItem = () => {
    const { valid, errors } = validate();

    if (!valid) {
      errors.forEach(error => toast.error(error));
      return;
    }

    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
      price: formData.price,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate,
      isInBasket: false
    };

    onAddItem(foodItem);
    reset();
    setShowForm(false);
    toast.success(`${formData.name}を冷蔵庫に追加しました`);
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
          onClick={() => setShowForm(!showForm)}
          variant="outline"
          size="sm"
          className="border-brand-300 text-brand-600 hover:bg-brand-50"
        >
          <IoAddOutline className="h-4 w-4 mr-1" />
          {showForm ? 'キャンセル' : '追加'}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                食材名 <span className="text-danger-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="例: 鶏もも肉"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                カテゴリ <span className="text-danger-600">*</span>
              </label>
              <Select value={formData.category} onValueChange={(value) => updateField('category', value as any)}>
                <SelectTrigger className="w-full">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">数量</label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">価格 (円)</label>
              <Input
                type="number"
                min="0"
                step="10"
                placeholder="0"
                value={formData.price || ''}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">購入日</label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                賞味期限 <span className="text-danger-600">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(formData.expiryDate);
                    const minDate = new Date();

                    newDate.setDate(newDate.getDate() - 1);

                    if (newDate >= minDate) {
                      updateField('expiryDate', newDate.toISOString().split('T')[0]);
                    }
                  }}
                  className="px-3 py-2 border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                >
                  -1日
                </Button>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                  className="flex-1"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(formData.expiryDate);
                    newDate.setDate(newDate.getDate() + 1);
                    updateField('expiryDate', newDate.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                >
                  +1日
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowForm(false)}
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

export default FridgeAddForm;
