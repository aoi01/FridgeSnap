
import React, { useState } from 'react';
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
import { CgSmartHomeRefrigerator } from "react-icons/cg";
import { useFridgeState } from '@/hooks/useFridgeState';

const Index = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('fridge');
  const [showExpiringModal, setShowExpiringModal] = useState(false);

  // 状態管理フックを使用
  const {
    foodItems,
    todayBasket,
    purchaseHistory,
    handleReceiptScanned,
    moveToBasket,
    removeFromBasket,
    clearTodayBasket,
    removeFromFridge,
    updateFridgeItem,
    addFridgeItem,
    getExpiringItems,
    getExpiringCount,
    updateBasketItem,
    updatePurchaseHistory,
    deletePurchaseHistory,
    handleBulkDeleteExpiring,
  } = useFridgeState();

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
            onUpdateItem={updateBasketItem}
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
