
import React, { useState, useEffect } from 'react';
import { Camera, Bell, ChefHat, Calendar, TrendingUp, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ReceiptScanner from '@/components/ReceiptScanner';
import FridgeView from '@/components/FridgeView';
import TodayBasket from '@/components/TodayBasket';
import RecipesSuggestion from '@/components/RecipesSuggestion';
import BudgetOverview from '@/components/BudgetOverview';

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

const Index = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('fridge');
  const [todayBasket, setTodayBasket] = useState<FoodItem[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('fridgeItems');
    const savedBasket = localStorage.getItem('todayBasket');
    
    if (savedItems) {
      setFoodItems(JSON.parse(savedItems));
    }
    if (savedBasket) {
      setTodayBasket(JSON.parse(savedBasket));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('fridgeItems', JSON.stringify(foodItems));
  }, [foodItems]);

  useEffect(() => {
    localStorage.setItem('todayBasket', JSON.stringify(todayBasket));
  }, [todayBasket]);

  // Check for expiring items
  useEffect(() => {
    const checkExpiringItems = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const expiringItems = foodItems.filter(item => {
        const expiryDate = new Date(item.expiryDate);
        return expiryDate <= tomorrow && expiryDate >= today;
      });

      if (expiringItems.length > 0) {
        toast.error(`${expiringItems.length}つの食材が期限切れ間近です！`, {
          description: expiringItems.map(item => item.name).join(', ')
        });
      }
    };

    if (foodItems.length > 0) {
      checkExpiringItems();
    }
  }, [foodItems]);

  const handleReceiptScanned = (newItems: FoodItem[]) => {
    setFoodItems(prev => [...prev, ...newItems]);
    setShowScanner(false);
    toast.success(`${newItems.length}つの食材を冷蔵庫に追加しました！`);
  };

  const moveToBasket = (item: FoodItem) => {
    setTodayBasket(prev => [...prev, { ...item, isInBasket: true }]);
    toast.success(`${item.name}を今日の献立に追加しました`);
  };

  const removeFromBasket = (itemId: string) => {
    setTodayBasket(prev => prev.filter(item => item.id !== itemId));
  };

  const clearTodayBasket = () => {
    const basketItemIds = todayBasket.map(item => item.id);
    setFoodItems(prev => prev.filter(item => !basketItemIds.includes(item.id)));
    setTodayBasket([]);
    toast.success('今日の献立を完了しました！');
  };

  const removeFromFridge = (itemId: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('食材を削除しました');
  };

  const updateFridgeItem = (updatedItem: FoodItem) => {
    setFoodItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    toast.success('食材を更新しました');
  };

  const getExpiringCount = () => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    return foodItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysLater;
    }).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">スマート冷蔵庫</h1>
                <p className="text-sm text-gray-600">AI搭載の食材管理システム</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getExpiringCount() > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-4 w-4 mr-1" />
                  期限切れ間近 {getExpiringCount()}件
                </Badge>
              )}
              
              <Button 
                onClick={() => setShowScanner(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                レシート撮影
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'fridge', label: '冷蔵庫', icon: ChefHat },
            { id: 'basket', label: '今日の献立', icon: Calendar },
            { id: 'recipes', label: 'レシピ提案', icon: Plus },
            { id: 'budget', label: '家計簿', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-green-100 text-green-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {activeTab === 'fridge' && (
          <FridgeView 
            foodItems={foodItems} 
            onMoveToBasket={moveToBasket}
            onRemoveItem={removeFromFridge}
            onUpdateItem={updateFridgeItem}
          />
        )}
        
        {activeTab === 'basket' && (
          <TodayBasket 
            basketItems={todayBasket}
            onRemoveItem={removeFromBasket}
            onClearBasket={clearTodayBasket}
          />
        )}
        
        {activeTab === 'recipes' && (
          <RecipesSuggestion foodItems={foodItems} />
        )}
        
        {activeTab === 'budget' && (
          <BudgetOverview foodItems={foodItems} />
        )}
      </div>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <ReceiptScanner
          onItemsScanned={handleReceiptScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Index;
