/**
 * 月別支出推移チャートコンポーネント
 *
 * 過去6ヶ月間の食費とエンゲル係数を表示するグラフ
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
import EngelCoefficientInfo from './EngelCoefficientInfo';

interface MonthlyTrendChartProps {
  /** 月別データ */
  monthlyData: MonthlyData[];
}

/**
 * チャートのツールチップ用フォーマッター
 */
const tooltipFormatter = (value: number, name: string) => {
  if (name === 'foodExpense') {
    return [`¥${value.toLocaleString()}`, '食費'];
  } else if (name === 'engelCoefficient') {
    return [`${value}%`, 'エンゲル係数'];
  }
  return [value, name];
};

/**
 * チャートの凡例用フォーマッター
 */
const legendFormatter = (value: string) => {
  switch (value) {
    case 'foodExpense':
      return '食費';
    case 'engelCoefficient':
      return 'エンゲル係数';
    default:
      return value;
  }
};

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ monthlyData }) => {
  const hasData = monthlyData.some(d => d.foodExpense > 0);

  return (
    <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-brand-50 p-2 rounded-lg">
          <IoTrendingUpOutline className="h-5 w-5 text-brand-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">月別支出推移</h3>
      </div>

      {hasData ? (
        <>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
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
                  formatter={tooltipFormatter as any}
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
                  formatter={legendFormatter}
                />
                {/* 標準エンゲル係数の参考線 */}
                <ReferenceLine
                  yAxisId="right"
                  y={20}
                  stroke="#f59e0b"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ value: '標準 (20%)', position: 'right', fontSize: 11, fill: '#f59e0b' }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={25}
                  stroke="#ef4444"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ value: '高め (25%)', position: 'right', fontSize: 11, fill: '#ef4444' }}
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

          {/* エンゲル係数の説明 */}
          <EngelCoefficientInfo />
        </>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-neutral-100 p-4 rounded-full mx-auto mb-4 w-fit">
              <IoTrendingUpOutline className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-neutral-600">データがまだありません</p>
            <p className="text-sm text-neutral-500 mt-1">
              レシートをスキャンして食材を追加すると、支出推移が表示されます
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyTrendChart;
