/**
 * レシピカードコンポーネント
 *
 * 個別のレシピを表示する展開可能なカード
 */

import React from 'react';
import { ChefHat, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GeminiRecipe } from '@/hooks/useGeminiRecipes';
import { getDifficultyConfig } from '@/utils/recipes/recipeUtils';

interface RecipeCardProps {
  recipe: GeminiRecipe;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isExpanded,
  onToggleExpand
}) => {
  const difficultyConfig = getDifficultyConfig(recipe.difficulty);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-neutral-200 hover:border-brand-300 bg-white overflow-hidden">
      {/* カードヘッダー */}
      <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-bold text-lg text-neutral-900 group-hover:text-brand-700 transition-colors line-clamp-2">
            {recipe.name}
          </h4>
          <div className="p-2 bg-brand-50 rounded-lg flex-shrink-0">
            <ChefHat className="h-5 w-5 text-brand-600" />
          </div>
        </div>

        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
          {recipe.description}
        </p>

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-neutral-500" />
            <span className="font-medium">{recipe.cookingTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg">
            <Users className="h-4 w-4 text-neutral-500" />
            <span className="font-medium">{recipe.servings}</span>
          </div>
          <Badge variant="outline" className={`${difficultyConfig.color} border font-medium`}>
            {difficultyConfig.icon} {recipe.difficulty}
          </Badge>
        </div>
      </div>

      {/* カードボディ */}
      <div className="p-6 space-y-5">
        {/* 材料セクション */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
            <h5 className="font-semibold text-neutral-900 text-sm">材料</h5>
          </div>
          <ul className="space-y-2">
            {recipe.ingredients.slice(0, isExpanded ? undefined : 4).map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
          {!isExpanded && recipe.ingredients.length > 4 && (
            <p className="text-xs text-neutral-500 mt-2">他 {recipe.ingredients.length - 4} 個...</p>
          )}
        </div>

        {/* 作り方セクション */}
        {isExpanded && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              <h5 className="font-semibold text-neutral-900 text-sm">作り方</h5>
            </div>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-sm text-neutral-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 展開/折りたたみボタン */}
        <Button
          onClick={onToggleExpand}
          variant="ghost"
          size="sm"
          className="w-full text-brand-600 hover:text-brand-700 hover:bg-brand-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              折りたたむ
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              作り方を見る
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default RecipeCard;
