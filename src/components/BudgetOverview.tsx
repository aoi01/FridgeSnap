
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

interface BudgetOverviewProps {
  foodItems: FoodItem[];
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ foodItems }) => {
  const budgetData = useMemo(() => {
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekItems = foodItems.filter(item => new Date(item.purchaseDate) >= thisWeek);
    const lastWeekItems = foodItems.filter(item => {
      const purchaseDate = new Date(item.purchaseDate);
      return purchaseDate >= lastWeek && purchaseDate < thisWeek;
    });
    const thisMonthItems = foodItems.filter(item => new Date(item.purchaseDate) >= thisMonth);

    const thisWeekTotal = thisWeekItems.reduce((sum, item) => sum + item.price, 0);
    const lastWeekTotal = lastWeekItems.reduce((sum, item) => sum + item.price, 0);
    const thisMonthTotal = thisMonthItems.reduce((sum, item) => sum + item.price, 0);

    // Category breakdown
    const categoryTotals = foodItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.price;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // Weekly comparison
    const weeklyChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    return {
      thisWeekTotal,
      lastWeekTotal,
      thisMonthTotal,
      weeklyChange,
      categoryData,
      thisWeekItems,
      lastWeekItems
    };
  }, [foodItems]);

  const categoryColors = [
    'bg-red-100 text-red-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-gray-100 text-gray-800'
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">家計簿・支出分析</h2>
            <p className="opacity-90">食費の管理と分析</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">今週の支出</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{budgetData.thisWeekTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            {budgetData.weeklyChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            )}
            <span className={`text-sm ${budgetData.weeklyChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
              前週比 {Math.abs(budgetData.weeklyChange).toFixed(1)}%
              {budgetData.weeklyChange > 0 ? '増加' : '減少'}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">先週の支出</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{budgetData.lastWeekTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            {budgetData.lastWeekItems.length}つの商品を購入
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">今月の合計</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{budgetData.thisMonthTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            月平均目標: ¥40,000
          </p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <PieChart className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">カテゴリ別支出</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetData.categoryData.map((item, index) => (
            <div
              key={item.category}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {categoryEmojis[item.category as keyof typeof categoryEmojis] || '📦'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{item.category}</p>
                  <Badge className={categoryColors[index % categoryColors.length]}>
                    {Math.round((item.total / budgetData.thisMonthTotal) * 100)}%
                  </Badge>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ¥{item.total.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Purchases */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今週の購入履歴</h3>
        
        {budgetData.thisWeekItems.length > 0 ? (
          <div className="space-y-3">
            {budgetData.thisWeekItems
              .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
              .slice(0, 10)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {categoryEmojis[item.category as keyof typeof categoryEmojis] || '📦'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.purchaseDate} • {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">¥{item.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>今週の購入履歴がありません</p>
          </div>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm text-blue-800">
          <h4 className="font-medium mb-2">💡 節約のヒント</h4>
          <ul className="space-y-1 text-xs">
            <li>• 賞味期限の近い食材から優先的に使用しましょう</li>
            <li>• 同じカテゴリの食材が重複購入されていないかチェック</li>
            <li>• 週の支出目標を設定して管理しましょう</li>
            <li>• レシピ提案機能を使って食材を無駄なく活用</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default BudgetOverview;
