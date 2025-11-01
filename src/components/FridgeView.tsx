/**
 * 冷蔵庫ビューコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - カテゴリ別の食材表示
 * - 食材の追加・編集・削除
 * - 今日の献立への追加
 * - 有効期限の視覚的表示
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import FridgeItemEditor from '@/components/FridgeItemEditor';
import {
  IoCalendarOutline,
  IoBasket,
  IoTrashOutline,
  IoAddOutline,
  IoAddCircleOutline,
} from 'react-icons/io5';
import { LuPencil } from 'react-icons/lu';

// 型定義とユーティリティのインポート
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES } from '@/constants';
import { CATEGORY_ICONS, getCategoryIcon } from '@/utils/categoryUtils';
import { calculateDaysUntilExpiry } from '@/utils/foodUtils';

/**
 * FridgeView コンポーネントのプロパティ
 */
interface FridgeViewProps {
  /** 表示する食材リスト */
  foodItems: FoodItem[];
  /** 食材を今日の献立に追加する関数 */
  onMoveToBasket: (item: FoodItem) => void;
  /** 食材を削除する関数 */
  onRemoveItem: (itemId: string) => void;
  /** 食材を更新する関数 */
  onUpdateItem: (updatedItem: FoodItem) => void;
  /** 新しい食材を追加する関数 */
  onAddItem: (item: FoodItem) => void;
}

/**
 * カテゴリごとのTailwind CSSクラス
 * 背景色とテキスト色のセット
 */
const categoryColors: Record<string, string> = {
  '野菜': 'bg-green-100 text-green-800',
  '肉類': 'bg-red-100 text-red-800',
  '魚類': 'bg-blue-100 text-blue-800',
  '乳製品': 'bg-yellow-100 text-yellow-800',
  '調味料': 'bg-purple-100 text-purple-800',
  'パン・米類': 'bg-orange-100 text-orange-800',
  '冷凍食品': 'bg-cyan-100 text-cyan-800',
  'その他': 'bg-gray-100 text-gray-800'
};

const FridgeView: React.FC<FridgeViewProps> = ({ foodItems, onMoveToBasket, onRemoveItem, onUpdateItem, onAddItem }) => {
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryAddForms, setCategoryAddForms] = useState<Record<string, boolean>>({});
  /**
   * 新規食材追加フォームの状態
   * 初期値としてカテゴリは最初の要素（野菜）を設定
   */
  const [newItem, setNewItem] = useState({
    name: '',
    category: FOOD_CATEGORIES[0], // デフォルトは「野菜」
    quantity: 1,
    price: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date().toISOString().split('T')[0]
  });
  /**
   * カテゴリごとの新規追加フォームの状態
   * 各カテゴリに対して個別の入力フォームを管理
   */
  const [categoryNewItems, setCategoryNewItems] = useState<Record<string, {
    name: string;
    category: string;
    quantity: number;
    price: number;
    purchaseDate: string;
    expiryDate: string;
  }>>({});

  /**
   * 有効期限のステータスを取得する
   * foodUtils.tsの関数を使用し、UIに適したフォーマットで返す
   */
  const getExpiryStatus = (expiryDate: string) => {
    const days = calculateDaysUntilExpiry(expiryDate);

    // 期限切れ
    if (days < 0) return { status: 'expired', color: 'bg-red-500', text: '期限切れ' };
    // 本日期限
    if (days === 0) return { status: 'today', color: 'bg-red-400', text: '今日まで' };
    // 明日期限
    if (days === 1) return { status: 'tomorrow', color: 'bg-orange-400', text: '明日まで' };
    // 数日以内
    if (days <= 3) return { status: 'soon', color: 'bg-yellow-400', text: `${days}日後` };
    // 安全
    return { status: 'safe', color: 'bg-green-400', text: `${days}日後` };
  };

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
      category: FOOD_CATEGORIES[0], // デフォルトに戻す
      quantity: 1,
      price: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
    toast.success(`${newItem.name}を冷蔵庫に追加しました`);
  };

  /**
   * 食材をカテゴリ別にグループ化
   * FOOD_CATEGORIESの順序を保つためにreduceを使用
   */
  const groupedItems = foodItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  const handleEditSave = (updatedItem: FoodItem) => {
    onUpdateItem(updatedItem);
    setEditingItem(null);
  };

  const toggleCategoryAddForm = (category: string) => {
    setCategoryAddForms(prev => ({
      ...prev,
      [category]: !prev[category]
    }));

    // フォームを開く時に初期値を設定
    if (!categoryAddForms[category]) {
      setCategoryNewItems(prev => ({
        ...prev,
        [category]: {
          name: '',
          category: category,
          quantity: 1,
          price: 0,
          purchaseDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date().toISOString().split('T')[0]
        }
      }));
    }
  };

  const updateCategoryNewItem = (category: string, field: string, value: any) => {
    setCategoryNewItems(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleCategoryAddItem = (category: string) => {
    const categoryItem = categoryNewItems[category];
    if (!categoryItem?.name) {
      toast.error('食材名を入力してください');
      return;
    }

    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: categoryItem.name,
      category: category,
      quantity: categoryItem.quantity,
      price: categoryItem.price,
      purchaseDate: categoryItem.purchaseDate,
      expiryDate: categoryItem.expiryDate,
      isInBasket: false
    };

    onAddItem(foodItem);

    // フォームをリセット
    setCategoryNewItems(prev => ({
      ...prev,
      [category]: {
        name: '',
        category: category,
        quantity: 1,
        price: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date().toISOString().split('T')[0]
      }
    }));
    setCategoryAddForms(prev => ({
      ...prev,
      [category]: false
    }));

    toast.success(`${categoryItem.name}を${category}に追加しました`);
  };

  return (
    <div className="space-y-6">
      {/* 手動食材追加セクション */}
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
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  カテゴリ <span className="text-danger-600">*</span>
                </label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
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
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
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
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">購入日</label>
                <Input
                  type="date"
                  value={newItem.purchaseDate}
                  onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
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
                      if (newItem.expiryDate) {
                        const currentDate = new Date(newItem.expiryDate);
                        const minDate = new Date(); // 最低今日まで
                        
                        const newDate = new Date(currentDate);
                        newDate.setDate(newDate.getDate() - 1);
                        
                        // 最低今日までの制限をチェック
                        if (newDate >= minDate) {
                          setNewItem({ ...newItem, expiryDate: newDate.toISOString().split('T')[0] });
                        }
                      }
                    }}
                    className="px-3 py-2 border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                  >
                    -1日
                  </Button>
                  <Input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    className="flex-1"
                    min={new Date().toISOString().split('T')[0]} // 最低今日まで
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newItem.expiryDate) {
                        const currentDate = new Date(newItem.expiryDate);
                        const newDate = new Date(currentDate);
                        newDate.setDate(newDate.getDate() + 1);
                        setNewItem({ ...newItem, expiryDate: newDate.toISOString().split('T')[0] });
                      } else {
                        // 初期値として今日の日付を設定
                        const today = new Date();
                        setNewItem({ ...newItem, expiryDate: today.toISOString().split('T')[0] });
                      }
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

      {/* カテゴリ別食材表示 */}
      {foodItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {FOOD_CATEGORIES.filter(category => groupedItems[category]?.length > 0).map((category) => {
            const items = groupedItems[category];
            const IconComponent = CATEGORY_ICONS[category];
            return (
              <Card key={category} className="p-6 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
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
                      onClick={() => toggleCategoryAddForm(category)}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                    >
                      <IoAddOutline className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* カテゴリ別追加フォーム */}
                {categoryAddForms[category] && (
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
                            placeholder={`例: ${category === '野菜' ? 'キャベツ' : category === '肉類' ? '鶏もも肉' : category === '魚類' ? 'サーモン' : '食材名'}`}
                            value={categoryNewItems[category]?.name || ''}
                            onChange={(e) => updateCategoryNewItem(category, 'name', e.target.value)}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">数量</label>
                          <Input
                            type="number"
                            min="1"
                            value={categoryNewItems[category]?.quantity || 1}
                            onChange={(e) => updateCategoryNewItem(category, 'quantity', parseInt(e.target.value) || 1)}
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
                            value={categoryNewItems[category]?.price || ''}
                            onChange={(e) => updateCategoryNewItem(category, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">
                            賞味期限 <span className="text-danger-600">*</span>
                          </label>
                          <Input
                            type="date"
                            value={categoryNewItems[category]?.expiryDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateCategoryNewItem(category, 'expiryDate', e.target.value)}
                            className="w-full text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          onClick={() => toggleCategoryAddForm(category)}
                          variant="outline"
                          size="sm"
                          className="border-neutral-300 text-neutral-600 hover:bg-neutral-50 text-xs"
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={() => handleCategoryAddItem(category)}
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
              
                <div className="space-y-4">
                  {items.map((item) => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    return (
                      <div
                        key={item.id}
                        className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:shadow-sm transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 text-base mb-1">{item.name}</h4>
                            <p className="text-sm text-neutral-600 mb-1">数量: {item.quantity}</p>
                            {item.price > 0 && (
                              <p className="text-sm font-medium text-success-600">¥{item.price.toLocaleString()}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentDate = new Date(item.expiryDate);
                                  const minDate = new Date(); // 最低今日まで
                                  
                                  const newDate = new Date(currentDate);
                                  newDate.setDate(newDate.getDate() - 1);
                                  
                                  // 最低今日までの制限をチェック
                                  if (newDate >= minDate) {
                                    const updatedItem = { ...item, expiryDate: newDate.toISOString().split('T')[0] };
                                    onUpdateItem(updatedItem);
                                  }
                                }}
                                className="h-6 w-6 p-0 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                              >
                                -
                              </Button>
                              <Badge className={`${expiryStatus.color} text-black text-xs px-2 py-1 rounded-md font-medium min-w-[60px] text-center cursor-default`}>
                                {expiryStatus.text}
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentDate = new Date(item.expiryDate);
                                  const newDate = new Date(currentDate);
                                  newDate.setDate(newDate.getDate() + 1);
                                  const updatedItem = { ...item, expiryDate: newDate.toISOString().split('T')[0] };
                                  onUpdateItem(updatedItem);
                                }}
                                className="h-6 w-6 p-0 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                              >
                                +
                              </Button>
                            </div>
                            {expiryStatus.status === 'expired' || expiryStatus.status === 'today' ? (
                              <IoWarningOutline className="h-5 w-5 text-danger-600" />
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                          <div className="text-xs text-neutral-500 flex items-center">
                            <IoCalendarOutline className="h-3 w-3 mr-1" />
                            購入: {item.purchaseDate}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="h-8 px-3 text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors duration-200"
                            >
                              <LuPencil  className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onMoveToBasket(item)}
                              className="h-8 px-3 text-xs border-success-300 text-success-600 hover:bg-success-50 transition-colors duration-200"
                            >
                              <IoBasket className="h-3 w-3 mr-1" />
                              献立に
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRemoveItem(item.id)}
                              className="h-8 px-3 text-xs border-danger-300 text-danger-600 hover:bg-danger-50 transition-colors duration-200"
                            >
                              <IoTrashOutline className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editingItem && (
        <FridgeItemEditor
          item={editingItem}
          onSave={handleEditSave}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default FridgeView;
