/**
 * レシピ提案ヘッダーコンポーネント
 *
 * 食材一覧と提案ボタンを表示
 */

import React from 'react';
import { Loader2, ChefHat, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FoodItem } from '@/types/food';

interface RecipesHeaderProps {
  basketItems: FoodItem[];
  isLoading: boolean;
  onSuggestRecipes: () => void;
}

const RecipesHeader: React.FC<RecipesHeaderProps> = ({
  basketItems,
  isLoading,
  onSuggestRecipes
}) => {
  return (
    <Card className="p-8 bg-gradient-to-br from-white via-brand-50/30 to-white border-brand-200 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        {/* 食材情報 */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-brand-100">
              <UtensilsCrossed className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                今日の献立レシピ
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                選んだ食材からAIがレシピを提案
              </p>
            </div>
          </div>

          {/* 食材バッジリスト */}
          {basketItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {basketItems.map(item => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="bg-white border-brand-200 text-brand-700 px-3 py-1.5 text-sm font-medium shadow-sm"
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                「冷蔵庫」タブで食材を選んでから、レシピを提案してください
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex-shrink-0">
          <Button
            onClick={onSuggestRecipes}
            disabled={isLoading || basketItems.length === 0}
            size="lg"
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AI考案中...
              </>
            ) : (
              <>
                <ChefHat className="mr-2 h-5 w-5" />
                レシピを提案
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RecipesHeader;
