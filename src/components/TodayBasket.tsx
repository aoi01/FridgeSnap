
import React from 'react';
import { Trash2, CheckCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface TodayBasketProps {
  basketItems: FoodItem[];
  onRemoveItem: (itemId: string) => void;
  onClearBasket: () => void;
}

const categoryEmojis = {
  '野菜': '🥬',
  '肉類': '🥩',
  '魚類': '🐟',
  '乳製品': '🥛',
  '調味料': '🧂',
  'パン・米類': '🍞',
  '冷凍食品': '🧊',
  'その他': '📦'
};

const TodayBasket: React.FC<TodayBasketProps> = ({ basketItems, onRemoveItem, onClearBasket }) => {
  const totalPrice = basketItems.reduce((sum, item) => sum + item.price, 0);

  if (basketItems.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="text-6xl mb-4">🥘</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">今日の献立バスケットは空です</h3>
        <p className="text-gray-500">冷蔵庫から食材を選んで今日使う食材を準備しましょう！</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">今日の献立バスケット</h2>
            <p className="opacity-90">選択した食材: {basketItems.length}種類</p>
            {totalPrice > 0 && (
              <p className="opacity-90">合計価格: ¥{totalPrice.toLocaleString()}</p>
            )}
          </div>
          <div className="text-4xl">🧺</div>
        </div>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {basketItems.map((item, index) => (
          <Card 
            key={item.id} 
            className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in border-l-4 border-orange-400"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {categoryEmojis[item.category as keyof typeof categoryEmojis] || '📦'}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {item.category}
                  </Badge>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(item.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>数量:</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
              {item.price > 0 && (
                <div className="flex justify-between">
                  <span>価格:</span>
                  <span className="font-medium">¥{item.price.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  期限: {item.expiryDate}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800 mb-1">調理完了</h3>
            <p className="text-sm text-green-600">
              料理が完了したら、使用した食材をまとめて削除できます
            </p>
          </div>
          
          <Button
            onClick={onClearBasket}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            disabled={basketItems.length === 0}
          >
            <CheckCircle className="h-4 w-4" />
            <span>調理完了・一括削除</span>
          </Button>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm text-blue-800">
          <h4 className="font-medium mb-2">💡 使い方のヒント</h4>
          <ul className="space-y-1 text-xs">
            <li>• 今日使う予定の食材をここに集めましょう</li>
            <li>• 調理後は「調理完了・一括削除」で使用した食材をまとめて削除</li>
            <li>• 個別に削除したい場合は各アイテムのゴミ箱アイコンをクリック</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default TodayBasket;
