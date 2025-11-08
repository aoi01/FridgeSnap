/**
 * 予算チャートコンポーネント
 *
 * 過去6ヶ月の食費とエンゲル係数の推移を表示
 */

import React from 'react';
import { Card } from '@/components/ui/card';
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
import { IoTrendingUpOutline } from 'react-icons/io5';
import { MonthlyData } from '@/hooks/useBudgetCalculations';

interface BudgetChartProps {
  monthlyData: MonthlyData[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ monthlyData }) => {
  if (monthlyData.length === 0 || monthlyData.every(d => d.foodExpense === 0)) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-neutral-500">
          <IoTrendingUpOutline className="text-4xl mx-auto mb-2 text-neutral-400" />
          <p>データがありません</p>
          <p className="text-sm mt-1">食材を購入すると、グラフが表示されます</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <IoTrendingUpOutline className="text-xl text-brand-600" />
          月次推移（過去6ヶ月）
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          食費とエンゲル係数の推移を確認できます
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke="#10b981"
            tick={{ fill: '#10b981', fontSize: 12 }}
            label={{ value: '食費 (円)', angle: -90, position: 'insideLeft', fill: '#10b981' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#ef4444"
            tick={{ fill: '#ef4444', fontSize: 12 }}
            label={{ value: 'エンゲル係数 (%)', angle: 90, position: 'insideRight', fill: '#ef4444' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.75rem'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'foodExpense') return [`¥${value.toLocaleString()}`, '食費'];
              if (name === 'engelCoefficient') return [`${value}%`, 'エンゲル係数'];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="foodExpense"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="食費"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="engelCoefficient"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="エンゲル係数"
          />
          {/* エンゲル係数の基準線 */}
          <ReferenceLine
            yAxisId="right"
            y={25}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: '理想: 25%', position: 'right', fill: '#f59e0b', fontSize: 11 }}
          />
          <ReferenceLine
            yAxisId="right"
            y={30}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: '上限: 30%', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default BudgetChart;
