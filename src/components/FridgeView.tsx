
import React from 'react';
import { Calendar, AlertTriangle, ShoppingBasket, Trash2 } from 'lucide-react';
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

interface FridgeViewProps {
  foodItems: FoodItem[];
  onMoveToBasket: (item: FoodItem) => void;
  onRemoveItem: (itemId: string) => void;
}

const categoryColors = {
  '野菜': 'bg-green-100 text-green-800',
  '肉類': 'bg-red-100 text-red-800',
  '魚類': 'bg-blue-100 text-blue-800',
  '乳製品': 'bg-yellow-100 text-yellow-800',
  '調味料': 'bg-purple-100 text-purple-800',
  'パン・米類': 'bg-orange-100 text-orange-800',
  '冷凍食品': 'bg-cyan-100 text-cyan-800',
  'その他': 'bg-gray-100 text-gray-800'
};

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

const FridgeView: React.FC<FridgeViewProps> = ({ foodItems, onMoveToBasket, onRemoveItem }) => {
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { status: 'expired', color: 'bg-red-500', text: '期限切れ' };
    if (days === 0) return { status: 'today', color: 'bg-red-400', text: '今日まで' };
    if (days === 1) return { status: 'tomorrow', color: 'bg-orange-400', text: '明日まで' };
    if (days <= 3) return { status: 'soon', color: 'bg-yellow-400', text: `${days}日後` };
    return { status: 'safe', color: 'bg-green-400', text: `${days}日後` };
  };

  const groupedItems = foodItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  if (foodItems.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-6xl mb-4">🥬</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">冷蔵庫が空です</h3>
        <p className="text-gray-500">レシートをスキャンして食材を追加しましょう！</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">{categoryEmojis[category as keyof typeof categoryEmojis] || '📦'}</span>
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              <Badge variant="secondary" className="ml-auto">
                {items.length}個
              </Badge>
            </div>
            
            <div className="space-y-3">
              {items.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                        {item.price > 0 && (
                          <p className="text-sm text-gray-600">¥{item.price.toLocaleString()}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={`${expiryStatus.color} text-white text-xs`}>
                          {expiryStatus.text}
                        </Badge>
                        {expiryStatus.status === 'expired' || expiryStatus.status === 'today' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        購入: {item.purchaseDate}
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMoveToBasket(item)}
                          className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        >
                          <ShoppingBasket className="h-3 w-3 mr-1" />
                          献立に
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FridgeView;
