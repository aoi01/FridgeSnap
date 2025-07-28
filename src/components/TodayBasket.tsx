
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IoCalendarOutline,
  IoTrashOutline,
  IoLeaf,
  IoFish,
  IoWater,
  IoSnow,
  IoExtensionPuzzleOutline
} from 'react-icons/io5';
import { GiCow, GiBread, GiSaltShaker } from 'react-icons/gi';

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
  onUpdateItem: (updatedItem: FoodItem) => void;
}

const categoryIcons = {
  '野菜': IoLeaf,
  '肉類': GiCow,
  '魚類': IoFish,
  '乳製品': IoWater,  
  '調味料': GiSaltShaker,
  'パン・米類': GiBread,
  '冷凍食品': IoSnow,
  'その他': IoExtensionPuzzleOutline
};

const TodayBasket: React.FC<TodayBasketProps> = ({ basketItems, onRemoveItem, onClearBasket, onUpdateItem }) => {
  const totalPrice = basketItems.reduce((sum, item) => sum + item.price, 0);

  if (basketItems.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-16 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-neutral-100 rounded-full">
            <IoCalendarOutline className="text-6xl text-neutral-600" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-neutral-900 mb-3">今日の献立バスケットは空です</h3>
        <p className="text-neutral-600 text-base max-w-md mx-auto">冷蔵庫から食材を選んで今日使う食材を準備しましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
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
      </Card> */}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {basketItems.map((item, index) => {
          const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || IoExtensionPuzzleOutline;
          return (
            <Card 
              key={item.id} 
              className="p-4 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-50 rounded-lg">
                    <IconComponent className="text-lg text-brand-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900 text-base mb-1">{item.name}</h4>
                    <Badge className="bg-neutral-100 text-neutral-700 border-0 rounded-md px-2 py-1 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors duration-200 p-1"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </Button>
              </div>
            
              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex justify-between items-center">
                  <span>数量:</span>
                  <span className="font-medium text-neutral-900">{item.quantity}</span>
                </div>
                {item.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span>価格:</span>
                    <span className="font-medium text-success-600">¥{item.price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200">
                  <span className="flex items-center">
                    <IoCalendarOutline className="h-3 w-3 mr-1" />
                    期限:
                  </span>
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
                      className="h-5 w-5 p-0 text-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                    >
                      -
                    </Button>
                    <span className="text-black font-medium min-w-[70px] text-center text-xs cursor-default">
                      {item.expiryDate}
                    </span>
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
                      className="h-5 w-5 p-0 text-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <Card className="p-6 bg-success-50 border border-success-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-success-800 mb-1 text-lg">調理完了</h3>
            <p className="text-sm text-success-700">
              料理が完了したら、使用した食材をまとめて削除できます
            </p>
          </div>
          
          <Button
            onClick={onClearBasket}
            className="bg-success-600 hover:bg-success-700 text-white flex items-center space-x-2 px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200"
            disabled={basketItems.length === 0}
            size="default"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">調理完了・一括削除</span>
          </Button>
        </div>
      </Card>

      
    </div>
  );
};

export default TodayBasket;
