
import React, { useState } from 'react';
import { Save, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  price: number;
  isInBasket: boolean;
  image?: string;
}

interface FridgeItemEditorProps {
  item: FoodItem;
  onSave: (updatedItem: FoodItem) => void;
  onCancel: () => void;
}

const categories = [
  '野菜',
  '肉類', 
  '魚類',
  '乳製品',
  '調味料',
  'パン・米類',
  '冷凍食品',
  'その他'
];

const FridgeItemEditor: React.FC<FridgeItemEditorProps> = ({ item, onSave, onCancel }) => {
  const [editedItem, setEditedItem] = useState<FoodItem>({ ...item });

  const handleSave = () => {
    onSave(editedItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">食材を編集</h2>
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
                {categories.map(category => (
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
              <Input
                id="expiryDate"
                type="date"
                value={editedItem.expiryDate}
                onChange={(e) => setEditedItem(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
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
