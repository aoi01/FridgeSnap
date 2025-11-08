/**
 * カテゴリ別食材セクションコンポーネント
 *
 * 特定のカテゴリに属する食材を表示・管理するセクション
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { IoAddOutline } from 'react-icons/io5';
import { FoodItem, FoodCategory } from '@/types/food';
import { CATEGORY_ICONS } from '@/utils/categoryUtils';
import { useFridgeForm, FridgeFormData } from '@/hooks/useFridgeForm';
import FridgeItemCard from './FridgeItemCard';

interface CategorySectionProps {
  category: FoodCategory;
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onEditItem: (item: FoodItem) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveToBasket: (item: FoodItem) => void;
  onUpdateExpiry: (item: FoodItem) => void;
  onOpenTips: (item: FoodItem) => void;
}

interface CategoryFormData extends FridgeFormData {
  // FridgeFormData を継承
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  items,
  onAddItem,
  onEditItem,
  onRemoveItem,
  onMoveToBasket,
  onUpdateExpiry,
  onOpenTips,
}) => {
  const [showForm, setShowForm] = useState(false);
  const IconComponent = CATEGORY_ICONS[category];
  const { formData, updateField, reset } = useFridgeForm(category);

  const handleAddItem = () => {
    if (!formData.name) {
      toast.error('食材名を入力してください');
      return;
    }

    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: formData.name,
      category: category,
      quantity: formData.quantity,
      price: formData.price,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate,
      isInBasket: false,
    };

    onAddItem(foodItem);

    // フォームをリセット
    reset(category);
    setShowForm(false);

    toast.success(`${formData.name}を${category}に追加しました`);
  };

  return (
    <Card className="p-6 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <IconComponent className="text-xl text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">{category}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-neutral-100 text-neutral-700 border-0 rounded-md px-2 py-1 text-sm">
            {items.length}個
          </Badge>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
          >
            <IoAddOutline className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カテゴリ別追加フォーム */}
      {showForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-3">{category}の食材を追加</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  食材名 <span className="text-danger-600">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={`例: ${
                    category === '野菜'
                      ? 'キャベツ'
                      : category === '肉類'
                      ? '鶏もも肉'
                      : category === '魚類'
                      ? 'サーモン'
                      : '食材名'
                  }`}
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">数量</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">価格 (円)</label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="0"
                  value={formData.price || ''}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  賞味期限 <span className="text-danger-600">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => updateField('expiryDate', e.target.value)}
                  className="w-full text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                size="sm"
                className="border-neutral-300 text-neutral-600 hover:bg-neutral-50 text-xs"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAddItem}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <IoAddOutline className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 食材リスト */}
      <div className="space-y-4">
        {items.map((item) => (
          <FridgeItemCard
            key={item.id}
            item={item}
            onEdit={onEditItem}
            onMoveToBasket={onMoveToBasket}
            onRemove={onRemoveItem}
            onUpdateExpiry={onUpdateExpiry}
            onOpenTips={onOpenTips}
          />
        ))}
      </div>
    </Card>
  );
};

export default CategorySection;
