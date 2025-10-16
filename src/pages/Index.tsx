
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ReceiptScanner from '@/components/ReceiptScanner';
import FridgeView from '@/components/FridgeView';
import TodayBasket from '@/components/TodayBasket';
import RecipesSuggestion from '@/components/RecipesSuggestion';
import BudgetOverview from '@/components/BudgetOverview';
import ExpiringItemsModal from '@/components/ExpiringItemsModal';
import { 
  IoCameraOutline, 
  IoWarningOutline, 
  IoRestaurant, 
  IoBasketOutline, 
  IoSearchOutline,
  IoWalletOutline,
  IoSnowOutline
} from 'react-icons/io5';
import { MdKitchen } from 'react-icons/md';
import { CgSmartHomeRefrigerator } from "react-icons/cg";

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
  // 購入履歴専用のステート（削除されずに保持される）
  const [purchaseHistory, setPurchaseHistory] = useState<FoodItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('fridge');
  const [todayBasket, setTodayBasket] = useState<FoodItem[]>([]);
  const [showExpiringModal, setShowExpiringModal] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('fridgeItems');
    const savedBasket = localStorage.getItem('todayBasket');
    // 購入履歴をLocalStorageから読み込み
    const savedPurchaseHistory = localStorage.getItem('purchaseHistory');
    
    if (savedItems) {
      setFoodItems(JSON.parse(savedItems));
    }
    if (savedBasket) {
      setTodayBasket(JSON.parse(savedBasket));
    }
    // 購入履歴の復元
    if (savedPurchaseHistory) {
      setPurchaseHistory(JSON.parse(savedPurchaseHistory));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('fridgeItems', JSON.stringify(foodItems));
  }, [foodItems]);

  useEffect(() => {
    localStorage.setItem('todayBasket', JSON.stringify(todayBasket));
  }, [todayBasket]);

  // 購入履歴をLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

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
    // 新しい食材を購入履歴にも追加（永続保存用）
    setPurchaseHistory(prev => [...prev, ...newItems]);
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
    // 冷蔵庫から食材を削除（購入履歴は残す）
    setFoodItems(prev => prev.filter(item => item.id !== itemId));
    // 今日の献立にも入っていれば同時に削除
    setTodayBasket(prev => prev.filter(item => item.id !== itemId));
    toast.success('食材を削除しました');  
  };  

  const updateFridgeItem = (updatedItem: FoodItem) => {
    setFoodItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    console.log('食材を更新しました');
  };

  const addFridgeItem = (newItem: FoodItem) => {
    setFoodItems(prev => [...prev, newItem]);
    // 新しい食材を購入履歴にも追加
    setPurchaseHistory(prev => [...prev, newItem]);
  };

  const getExpiringItems = () => {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    return foodItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysLater;
    });
  };

  const getExpiringCount = () => {
    return getExpiringItems().length;
  };

  // 購入履歴の編集機能
  const updatePurchaseHistory = (updatedItem: FoodItem) => {
    setPurchaseHistory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  // 購入履歴の削除機能
  const deletePurchaseHistory = (itemId: string) => {
    setPurchaseHistory(prev => prev.filter(item => item.id !== itemId));
  };

  const handleBulkDeleteExpiring = (itemIds: string[]) => {
    setFoodItems(prev => prev.filter(item => !itemIds.includes(item.id)));
    // 今日の献立からも該当アイテムを削除
    setTodayBasket(prev => prev.filter(item => !itemIds.includes(item.id)));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-4">
              <div className="bg-brand-600 p-3 rounded-2xl shadow-md">
                <CgSmartHomeRefrigerator  className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Fridge Snap</h1>
                <p className="text-sm text-neutral-600 font-medium mt-1"></p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:space-x-3">
              {getExpiringCount() > 0 && (
                <Badge 
                  className="bg-danger-600 hover:bg-danger-700 text-white border-0 px-3 sm:px-4 py-2 shadow-sm cursor-pointer transition-colors duration-200 rounded-lg"
                  onClick={() => setShowExpiringModal(true)}
                >
                  <IoWarningOutline className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only">期限切れ間近 {getExpiringCount()}件</span>
                  <span className="hidden sm:inline">期限切れ間近 {getExpiringCount()}件</span>
                </Badge>
              )}
              
              <Button 
                onClick={() => setShowScanner(true)}
                className="bg-success-600 hover:bg-success-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2"
                size="default"
              >
                <IoCameraOutline className="h-5 w-5 mr-2" />
                レシート撮影
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
            {[
              { id: 'fridge', label: '冷蔵庫', icon: CgSmartHomeRefrigerator , color: 'text-brand-600', bgColor: 'hover:bg-brand-50', activeBg: 'bg-brand-600' },
              { id: 'basket', label: '今日の献立', icon: IoBasketOutline, color: 'text-success-600', bgColor: 'hover:bg-success-50', activeBg: 'bg-success-600' },
              { id: 'recipes', label: 'レシピ検索', icon: IoRestaurant, color: 'text-warning-600', bgColor: 'hover:bg-warning-50', activeBg: 'bg-warning-600' },
              { id: 'budget', label: '家計簿', icon: IoWalletOutline, color: 'text-discovery-600', bgColor: 'hover:bg-discovery-50', activeBg: 'bg-discovery-600' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === tab.id 
                    ? `${tab.activeBg} text-white shadow-sm` 
                    : `${tab.color} ${tab.bgColor} hover:shadow-sm`
                }`}
              >
                <tab.icon className="h-6 w-6 mb-1" />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {activeTab === 'fridge' && (
          <FridgeView 
            foodItems={foodItems} 
            onMoveToBasket={moveToBasket}
            onRemoveItem={removeFromFridge}
            onUpdateItem={updateFridgeItem}
            onAddItem={addFridgeItem}
          />
        )}
        
        {activeTab === 'basket' && (
          <TodayBasket 
            basketItems={todayBasket}
            onRemoveItem={removeFromBasket}
            onClearBasket={clearTodayBasket}
            onUpdateItem={(updatedItem) => {
              setTodayBasket(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              // 冷蔵庫の同じアイテムも更新
              setFoodItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
            }}
          />
        )}
        
        {activeTab === 'recipes' && (
          <RecipesSuggestion basketItems={todayBasket} />
        )}
        
        {activeTab === 'budget' && (
          <BudgetOverview 
            foodItems={purchaseHistory} 
            onUpdatePurchaseHistory={updatePurchaseHistory}
            onDeletePurchaseHistory={deletePurchaseHistory}
          />
        )}
      </div>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <ReceiptScanner
          onItemsScanned={handleReceiptScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Expiring Items Modal */}
      <ExpiringItemsModal
        isOpen={showExpiringModal}
        onClose={() => setShowExpiringModal(false)}
        expiringItems={getExpiringItems()}
        onMoveToBasket={moveToBasket}
        onRemoveItem={removeFromFridge}
        onBulkDelete={handleBulkDeleteExpiring}
      />
    </div>
  );
};

export default Index;
