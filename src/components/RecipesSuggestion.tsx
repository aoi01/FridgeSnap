/**
 * レシピ提案コンポーネント
 *
 * Gemini AIを使用した食材ベースのレシピ提案
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import RecipesHeader from '@/components/recipes/RecipesHeader';
import RecipeCard from '@/components/recipes/RecipeCard';
import { FoodItem } from '@/types/food';
import { generateRecipesWithGemini, GeminiRecipe } from '@/hooks/useGeminiRecipes';
import { toggleRecipeExpansion } from '@/utils/recipes/recipeUtils';

interface RecipesSuggestionProps {
  basketItems: FoodItem[];
}

const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ basketItems }) => {
  const [geminiRecipes, setGeminiRecipes] = useState<GeminiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const suggestRecipes = async () => {
    if (basketItems.length === 0) {
      toast.error('食材を選択してください');
      return;
    }

    setIsLoading(true);

    try {
      const ingredients = basketItems.map(item => item.name);
      const recipes = await generateRecipesWithGemini(ingredients);

      if (recipes.length === 0) {
        toast.warning('レシピが見つかりませんでした');
        return;
      }

      setGeminiRecipes(recipes);
      toast.success(`${recipes.length}個のレシピを提案しました`);
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      toast.error(
        error instanceof Error ? error.message : 'レシピの提案に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <RecipesHeader
        basketItems={basketItems}
        isLoading={isLoading}
        onSuggestRecipes={suggestRecipes}
      />

      {/* レシピカードグリッド */}
      {geminiRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              提案されたレシピ ({geminiRecipes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {geminiRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isExpanded={expandedRecipe === recipe.id}
                onToggleExpand={() => setExpandedRecipe(toggleRecipeExpansion(recipe.id, expandedRecipe))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesSuggestion;
