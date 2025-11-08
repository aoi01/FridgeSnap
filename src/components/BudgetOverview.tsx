import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  IoWalletOutline,
  IoTrendingUpOutline,
  IoReceiptOutline,
  IoCalculatorOutline,
  IoCalendarOutline,
  IoSaveOutline,
  IoCreateOutline,
  IoTrashOutline
} from 'react-icons/io5';
import { FoodItem, MonthlyData } from '@/types/food';

interface BudgetOverviewProps {
  foodItems: FoodItem[];
  // 購入履歴編集用のコールバック関数
  onUpdatePurchaseHistory?: (updatedItem: FoodItem) => void;
  onDeletePurchaseHistory?: (itemId: string) => void;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ 
  foodItems, 
  onUpdatePurchaseHistory, 
  onDeletePurchaseHistory 
}) => {
  const [monthlyLivingExpenses, setMonthlyLivingExpenses] = useState<Record<string, number>>({});
  const [currentMonthInput, setCurrentMonthInput] = useState('');
  // 購入履歴の編集用ステート
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<FoodItem>>({});

  // LocalStorageから生活費データを読み込み
  useEffect(() => {
    const saved = localStorage.getItem('monthlyLivingExpenses');
    if (saved) {
      setMonthlyLivingExpenses(JSON.parse(saved));
    }
  }, []);

  // 生活費データを保存
  useEffect(() => {
    localStorage.setItem('monthlyLivingExpenses', JSON.stringify(monthlyLivingExpenses));
  }, [monthlyLivingExpenses]);

  const budgetData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 今月の食費を計算
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthItems = foodItems.filter(item => new Date(item.purchaseDate) >= thisMonth);
    const thisMonthTotal = thisMonthItems.reduce((sum, item) => sum + item.price, 0);

    // 月別データを計算（過去6ヶ月）
    const monthlyData: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const monthItems = foodItems.filter(item => {
        const itemDate = new Date(item.purchaseDate);
        return itemDate >= targetDate && itemDate < nextMonth;
      });
      
      const foodExpense = monthItems.reduce((sum, item) => sum + item.price, 0);
      const livingExpense = monthlyLivingExpenses[monthKey] || 0;
      const engelCoefficient = livingExpense > 0 ? (foodExpense / livingExpense) * 100 : 0;

      monthlyData.push({
        month: targetDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
        year: targetDate.getFullYear(),
        monthNumber: targetDate.getMonth() + 1,
        foodExpense,
        livingExpense,
        engelCoefficient: Math.round(engelCoefficient * 10) / 10
      });
    }

    // 今月のエンゲル係数
    const currentLivingExpense = monthlyLivingExpenses[currentMonthKey] || 0;
    const currentEngelCoefficient = currentLivingExpense > 0 && thisMonthTotal >= 0 
      ? (thisMonthTotal / currentLivingExpense) * 100 
      : 0;

    // 購入履歴（今月分）
    const purchaseHistory = thisMonthItems
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 15);

    return {
      thisMonthTotal,
      currentEngelCoefficient: Math.round(currentEngelCoefficient * 10) / 10,
      currentLivingExpense,
      monthlyData,
      purchaseHistory,
      currentMonthKey
    };
  }, [foodItems, monthlyLivingExpenses]);

  const handleSaveLivingExpense = () => {
    const amount = parseFloat(currentMonthInput);
    if (isNaN(amount) || amount < 0) {
      toast.error('正しい金額を入力してください');
      return;
    }

    setMonthlyLivingExpenses(prev => ({
      ...prev,
      [budgetData.currentMonthKey]: amount
    }));
    
    toast.success('今月の生活費を保存しました');
    setCurrentMonthInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-discovery-600 p-3 rounded-2xl shadow-md">
              <IoWalletOutline className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">家計簿</h1>
              <p className="text-sm text-neutral-600 font-medium mt-1">食費管理とエンゲル係数分析</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 今月の食費 */}
        <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-neutral-600 mb-2 font-medium">今月の食費</p>
              <p className="text-3xl font-bold text-neutral-900">
                ¥{budgetData.thisMonthTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-success-50 p-3 rounded-lg">
              <IoReceiptOutline className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        {/* 今月の生活費 */}
        <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-neutral-600 mb-2 font-medium">今月の生活費</p>
              <p className="text-3xl font-bold text-neutral-900">
                ¥{budgetData.currentLivingExpense.toLocaleString()}
              </p>
            </div>
            <div className="bg-warning-50 p-3 rounded-lg">
              <IoCalculatorOutline className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        {/* エンゲル係数 */}
        <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-neutral-600 mb-2 font-medium">エンゲル係数</p>
              <p className="text-3xl font-bold text-neutral-900">
                {isNaN(budgetData.currentEngelCoefficient) ? '0' : budgetData.currentEngelCoefficient.toFixed(1)}%
              </p>
            </div>
            <div className="bg-brand-50 p-3 rounded-lg">
              <IoTrendingUpOutline className="h-6 w-6 text-brand-600" />
            </div>
          </div>
          <div className="mt-2">
            <Badge className={`${
              isNaN(budgetData.currentEngelCoefficient) || budgetData.currentEngelCoefficient === 0 ? 'bg-neutral-50 text-neutral-600 border-neutral-200' :
              budgetData.currentEngelCoefficient > 25 ? 'bg-danger-50 text-danger-600 border-danger-200' :
              budgetData.currentEngelCoefficient > 20 ? 'bg-warning-50 text-warning-600 border-warning-200' :
              'bg-success-50 text-success-600 border-success-200'
            } text-xs px-2 py-1`}>
              {isNaN(budgetData.currentEngelCoefficient) || budgetData.currentEngelCoefficient === 0 ? 'データなし' :
               budgetData.currentEngelCoefficient > 25 ? '高め' :
               budgetData.currentEngelCoefficient > 20 ? '標準' : '理想的'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* 生活費入力 */}
      <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-warning-50 p-2 rounded-lg">
            <IoSaveOutline className="h-5 w-5 text-warning-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">今月の生活費を入力</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <Input
            type="number"
            placeholder="生活費総額を入力..."
            value={currentMonthInput}
            onChange={(e) => setCurrentMonthInput(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleSaveLivingExpense}
            className="bg-warning-600 hover:bg-warning-700 text-white px-6"
          >
            保存
          </Button>
        </div>
        
        <p className="text-xs text-neutral-500 mt-2">
          ※家賃、光熱費、食費、交通費などの生活に必要な総支出額を入力してください
        </p>
      </Card>

      {/* 月別推移グラフ */}
      <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-brand-50 p-2 rounded-lg">
            <IoTrendingUpOutline className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">月別支出推移</h3>
        </div>
        
        {budgetData.monthlyData.some(d => d.foodExpense > 0) ? (
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={budgetData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickMargin={8}
                  interval={0}
                  angle={0}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#059669"
                  fontSize={12}
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#dc2626"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 50]}
                />
                <Tooltip 
                  formatter={(value: number, name) => {
                    if (name === 'foodExpense') {
                      return [`¥${value.toLocaleString()}`, '食費'];
                    } else if (name === 'engelCoefficient') {
                      return [`${value}%`, 'エンゲル係数'];
                    } else {
                      return [`${value}%`, name];
                    }
                  }}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    switch(value) {
                      case 'foodExpense': return '食費';
                      case 'engelCoefficient': return 'エンゲル係数';
                      default: return value;
                    }
                  }}
                />
                {/* 標準エンゲル係数の参考線 */}
                <ReferenceLine 
                  yAxisId="right"
                  y={20} 
                  stroke="#f59e0b" 
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ value: "標準 (20%)", position: "right", fontSize: 11, fill: "#f59e0b" }}
                />
                <ReferenceLine 
                  yAxisId="right"
                  y={25} 
                  stroke="#ef4444" 
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ value: "高め (25%)", position: "right", fontSize: 11, fill: "#ef4444" }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="foodExpense" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                  name="foodExpense"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="engelCoefficient" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                  name="engelCoefficient"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-neutral-100 p-4 rounded-full mx-auto mb-4 w-fit">
                <IoTrendingUpOutline className="h-8 w-8 text-neutral-500" />
              </div>
              <p className="text-neutral-600">データがまだありません</p>
              <p className="text-sm text-neutral-500 mt-1">レシートをスキャンして食材を追加すると、支出推移が表示されます</p>
            </div>
          </div>
        )}
        
        {/* エンゲル係数の説明 */}
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">エンゲル係数について</h4>
          <div className="text-xs text-neutral-600 space-y-1">
            <p>• <span className="text-success-600 font-medium">理想的 (20%以下)</span>: 食費が適正で、バランスの良い家計管理</p>
            <p>• <span className="text-warning-600 font-medium">標準 (20-25%)</span>: 一般的な日本の家庭の食費割合</p>
            <p>• <span className="text-danger-600 font-medium">高め (25%超)</span>: 食費の見直しや節約を検討することをおすすめ</p>
          </div>
        </div>
      </Card>

      {/* 購入履歴 */}
      <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-success-50 p-2 rounded-lg">
            <IoReceiptOutline className="h-5 w-5 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">今月の購入履歴</h3>
        </div>
        
        {budgetData.purchaseHistory.length > 0 ? (
          <div className="space-y-3">
            {budgetData.purchaseHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-600 flex items-center">
                    <IoCalendarOutline className="h-3 w-3 mr-1" />
                    {item.purchaseDate} • {item.category} • 数量: {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-neutral-900">¥{item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-neutral-100 p-4 rounded-full mx-auto mb-4 w-fit">
              <IoReceiptOutline className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-neutral-600">今月の購入履歴がありません</p>
            <p className="text-sm text-neutral-500 mt-1">レシートをスキャンして食材を追加しましょう</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BudgetOverview;