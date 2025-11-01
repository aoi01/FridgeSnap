import React, { useState } from 'react';
import { Loader2, ChefHat, Clock, Users, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

interface GeminiRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
  servings: string;
}

interface RecipesSuggestionProps {
  basketItems: FoodItem[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ basketItems }) => {
  const [geminiRecipes, setGeminiRecipes] = useState<GeminiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  // GeminiAPIでレシピ提案を取得
  const generateRecipesWithGemini = async (ingredients: string[]): Promise<GeminiRecipe[]> => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini APIキーが設定されていません');
    }

    const prompt = `以下の食材で3つのレシピを提案してください：${ingredients.join(', ')}

JSONで回答：
{"recipes":[{"name":"料理名","description":"説明","ingredients":["食材"],"instructions":["手順"],"cookingTime":"時間","difficulty":"簡単|普通|難しい","servings":"人分"}]}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 3000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Gemini APIからの応答が不正です');
      }

      // JSONを抽出（マークダウンのコードブロックも考慮）
      console.log('Gemini API Response:', content);

      let jsonString = content;

      // マークダウンのjsonコードブロックを削除
      jsonString = jsonString.replace(/```json\s*|\s*```/g, '');

      // JSONの開始と終了を見つける
      const startIndex = jsonString.indexOf('{');
      const lastIndex = jsonString.lastIndexOf('}');

      if (startIndex === -1 || lastIndex === -1) {
        throw new Error('Gemini APIから有効なJSONを取得できませんでした');
      }

      jsonString = jsonString.substring(startIndex, lastIndex + 1);

      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Attempted to parse:', jsonString);
        throw new Error('Gemini APIのレスポンスをJSONとして解析できませんでした');
      }
      const recipes = parsedData.recipes || [];

      // IDを追加
      return recipes.map((recipe: any, index: number) => ({
        ...recipe,
        id: `gemini-recipe-${index + 1}`
      }));

    } catch (error) {
      console.error('Error generating recipes with Gemini:', error);
      throw error;
    }
  };

  // レシピ提案を実行
  const suggestRecipes = async () => {
    if (basketItems.length === 0) {
      toast.error('今日の献立に食材を追加してください');
      return;
    }

    if (!GEMINI_API_KEY) {
      toast.error('Gemini APIキーが設定されていません。.envファイルに VITE_GEMINI_API_KEY を追加してください。');
      return;
    }

    setIsLoading(true);
    setGeminiRecipes([]);
    setExpandedRecipe(null);

    try {
      const ingredientNames = basketItems.map(item => item.name);
      console.log('献立の食材:', ingredientNames);

      const recipes = await generateRecipesWithGemini(ingredientNames);

      if (recipes.length === 0) {
        toast.error('レシピを生成できませんでした。別の食材で試してください。');
        return;
      }

      setGeminiRecipes(recipes);
      toast.success(`${recipes.length}つのレシピを提案しました！`);

    } catch (error) {
      console.error('Recipe suggestion error:', error);
      toast.error('レシピ提案中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 難易度に応じた色とアイコン
  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case '簡単':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: '簡単'
        };
      case '普通':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          label: '普通'
        };
      case '難しい':
        return {
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          label: '難しい'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          label: difficulty
        };
    }
  };

  const toggleRecipeExpansion = (recipeId: string) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ヘッダーセクション - Atlassian Design inspired */}
      <Card className="bg-gradient-to-br from-white to-brand-50/30 border-brand-200/50 shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-100 rounded-xl shadow-sm">
                  <Sparkles className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">レシピ提案</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Gemini AIがあなたの食材でレシピを考案します
                  </p>
                </div>
              </div>

              {/* 献立の食材表示 */}
              {basketItems.length > 0 && (
                <div className="p-4 bg-white border border-success-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <UtensilsCrossed className="h-4 w-4 text-success-600" />
                    <p className="text-sm font-semibold text-success-700">
                      使用可能な食材 ({basketItems.length}個)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {basketItems.map(item => (
                      <Badge
                        key={item.id}
                        variant="outline"
                        className="bg-success-50 text-success-700 border-success-300 hover:bg-success-100 transition-colors"
                      >
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 警告メッセージ */}
              {basketItems.length === 0 && (
                <div className="p-4 bg-warning-50 border border-warning-300 rounded-xl">
                  <p className="text-sm text-warning-800 font-medium">
                    献立に食材が追加されていません
                  </p>
                  <p className="text-sm text-warning-700 mt-1">
                    冷蔵庫から食材を献立に追加してください
                  </p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex-shrink-0">
              <Button
                onClick={suggestRecipes}
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
        </div>
      </Card>

      {/* レシピカードグリッド - Improved Layout */}
      {geminiRecipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              提案されたレシピ ({geminiRecipes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {geminiRecipes.map((recipe) => {
              const difficultyConfig = getDifficultyConfig(recipe.difficulty);
              const isExpanded = expandedRecipe === recipe.id;

              return (
                <Card
                  key={recipe.id}
                  className="group hover:shadow-xl transition-all duration-300 border-neutral-200 hover:border-brand-300 bg-white overflow-hidden"
                >
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
                      <Badge
                        variant="outline"
                        className={`${difficultyConfig.color} border font-medium`}
                      >
                        {difficultyConfig.label}
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
                          <li
                            key={index}
                            className="flex items-start gap-2.5 text-sm text-neutral-700"
                          >
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                      {!isExpanded && recipe.ingredients.length > 4 && (
                        <p className="text-xs text-neutral-500 mt-2 italic">
                          他 {recipe.ingredients.length - 4} 個の材料...
                        </p>
                      )}
                    </div>

                    {/* 作り方セクション */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-success-500 rounded-full"></div>
                        <h5 className="font-semibold text-neutral-900 text-sm">作り方</h5>
                      </div>
                      <ol className="space-y-3">
                        {recipe.instructions.slice(0, isExpanded ? undefined : 3).map((instruction, index) => (
                          <li
                            key={index}
                            className="flex gap-3 items-start"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-success-100 to-success-200 text-success-700 rounded-full text-xs font-bold flex items-center justify-center shadow-sm">
                              {index + 1}
                            </span>
                            <span className="flex-1 text-sm text-neutral-700 pt-0.5">
                              {instruction}
                            </span>
                          </li>
                        ))}
                      </ol>
                      {!isExpanded && recipe.instructions.length > 3 && (
                        <p className="text-xs text-neutral-500 mt-2 italic">
                          他 {recipe.instructions.length - 3} つの手順...
                        </p>
                      )}
                    </div>

                    {/* 展開ボタン */}
                    {(recipe.ingredients.length > 4 || recipe.instructions.length > 3) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecipeExpansion(recipe.id)}
                        className="w-full text-brand-600 hover:text-brand-700 hover:bg-brand-50 font-medium"
                      >
                        {isExpanded ? '折りたたむ' : 'すべて表示'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 空の状態 - Improved Empty State */}
      {/* {!isLoading && geminiRecipes.length === 0 && basketItems.length > 0 && (
        <Card className="border-2 border-dashed border-neutral-300 bg-neutral-50/50">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mb-4">
              <ChefHat className="h-8 w-8 text-brand-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              レシピを提案する準備ができました
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto mb-6">
              「レシピを提案」ボタンを押して、献立の食材でAIがあなたのためにカスタマイズされたレシピを考案します
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Gemini AI</span>
            </div>
          </div>
        </Card>
      )} */}
    </div>
  );
};

export default RecipesSuggestion;
