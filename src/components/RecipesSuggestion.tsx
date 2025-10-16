import React, { useState } from 'react';
import { Loader2, ChefHat, Clock, Users } from 'lucide-react';
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

    try {
      const ingredientNames = basketItems.map(item => item.name);
      console.log('献立の食材:', ingredientNames);

      // toast.loading('Gemini AIが献立の食材でレシピを考案中...');

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

  // 難易度に応じた色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '簡単': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case '普通': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case '難しい': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダーセクション */}
      <Card className="p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg">
              <ChefHat className="text-lg text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">AIレシピ提案</h3>
              <p className="text-sm text-neutral-600">
                献立の食材でGeminiがレシピを提案します
              </p>
            </div>
          </div>
          <Button
            onClick={suggestRecipes}
            disabled={isLoading || basketItems.length === 0}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI考案中...
              </>
            ) : (
              <>
                <ChefHat className="mr-2 h-4 w-4" />
                レシピを提案
              </>
            )}
          </Button>
        </div>

        {basketItems.length === 0 && (
          <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-700">
              献立に食材が追加されていません。冷蔵庫から食材を献立に追加してください。
            </p>
          </div>
        )}

        {basketItems.length > 0 && (
          <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-sm text-success-700 font-medium mb-2">献立の食材 ({basketItems.length}個):</p>
            <div className="flex flex-wrap gap-2">
              {basketItems.map(item => (
                <Badge key={item.id} className="bg-white text-success-700 border border-success-300 hover:bg-white">
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* レシピ表示セクション */}
      {geminiRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {geminiRecipes.map((recipe) => (
            <Card key={recipe.id} className="p-0 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden rounded-xl">
              <div className="p-6">
                {/* レシピヘッダー */}
                <div className="mb-4">
                  <h4 className="font-semibold text-neutral-900 text-lg mb-2">{recipe.name}</h4>
                  <p className="text-sm text-neutral-600 mb-3">{recipe.description}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Clock className="h-4 w-4" />
                      {recipe.cookingTime}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Users className="h-4 w-4" />
                      {recipe.servings}
                    </div>
                    <Badge className={getDifficultyColor(recipe.difficulty)}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* 材料 */}
                <div className="mb-4">
                  <h5 className="font-medium text-neutral-800 mb-2">材料</h5>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-neutral-400 rounded-full mt-2 flex-shrink-0"></span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 作り方 */}
                <div>
                  <h5 className="font-medium text-neutral-800 mb-2">作り方</h5>
                  <ol className="text-sm text-neutral-600 space-y-2">
                    {recipe.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-brand-100 text-brand-700 rounded-full text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="flex-1">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空の状態 */}
      {!isLoading && geminiRecipes.length === 0 && basketItems.length > 0 && (
        <Card className="p-8 text-center bg-neutral-50 border border-neutral-200 rounded-xl">
          <ChefHat className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">レシピを提案する準備ができました</h3>
          <p className="text-neutral-600 mb-4">
            「レシピを提案」ボタンを押して、献立の食材でAIがレシピを考案します
          </p>
        </Card>
      )}
    </div>
  );
};

export default RecipesSuggestion;