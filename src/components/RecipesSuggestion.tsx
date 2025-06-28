
import React, { useState } from 'react';
import { ChefHat, Loader2, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  cookingTime: string;
  difficulty: string;
  steps: string[];
}

interface RecipesSuggestionProps {
  foodItems: FoodItem[];
  apiKey: string;
  onApiKeySubmit: (key: string) => void;
}

const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ 
  foodItems, 
  apiKey, 
  onApiKeySubmit 
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  const generateRecipes = async () => {
    if (!tempApiKey.trim()) {
      toast.error('Gemini APIキーを入力してください');
      return;
    }

    if (foodItems.length === 0) {
      toast.error('冷蔵庫に食材を追加してください');
      return;
    }

    setIsLoading(true);

    try {
      const availableIngredients = foodItems.map(item => `${item.name}（${item.quantity}）`).join(', ');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${tempApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `以下の食材を使って、3つの料理レシピを提案してください：
              ${availableIngredients}
              
              各レシピについて、以下のJSON形式で返してください：
              
              {
                "recipes": [
                  {
                    "title": "料理名",
                    "description": "料理の簡単な説明",
                    "ingredients": ["材料1", "材料2", "材料3"],
                    "cookingTime": "調理時間（例：30分）",
                    "difficulty": "難易度（簡単/普通/難しい）",
                    "steps": ["手順1", "手順2", "手順3"]
                  }
                ]
              }
              
              できるだけ手持ちの食材を多く使用し、不足する材料は一般的で入手しやすいもので補完してください。
              日本料理を中心に、家庭で作りやすいレシピを提案してください。`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('APIからの応答が不正です');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('レシピの生成に失敗しました');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      setRecipes(parsedData.recipes || []);

      // Save API key if it worked
      if (tempApiKey !== apiKey) {
        onApiKeySubmit(tempApiKey);
      }

      toast.success('レシピを生成しました！');
      
    } catch (error) {
      console.error('Recipe generation error:', error);
      toast.error('レシピ生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '簡単':
        return 'bg-green-100 text-green-800';
      case '普通':
        return 'bg-yellow-100 text-yellow-800';
      case '難しい':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">AIレシピ提案</h2>
            <p className="opacity-90">冷蔵庫の食材からお料理を提案します</p>
          </div>
          <div className="text-4xl">👨‍🍳</div>
        </div>
      </Card>

      {/* API Key Input */}
      {!apiKey && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <Label htmlFor="recipeApiKey" className="text-sm font-medium text-yellow-800">
            Gemini APIキーを入力してください
          </Label>
          <div className="flex space-x-2 mt-2">
            <Input
              id="recipeApiKey"
              type="password"
              placeholder="Gemini APIキーを入力"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
            />
            <Button 
              onClick={() => onApiKeySubmit(tempApiKey)}
              disabled={!tempApiKey.trim()}
            >
              保存
            </Button>
          </div>
        </Card>
      )}

      {/* Generate Recipes Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              利用可能な食材: {foodItems.length}種類
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {foodItems.slice(0, 8).map(item => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.name}
                </Badge>
              ))}
              {foodItems.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{foodItems.length - 8}個
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            onClick={generateRecipes}
            disabled={isLoading || !tempApiKey.trim() || foodItems.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4 mr-2" />
                レシピ生成
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Recipes Display */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recipes.map((recipe, index) => (
            <Card key={index} className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {recipe.cookingTime}
                  </div>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">材料</h4>
                <div className="grid grid-cols-1 gap-1">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      {ingredient}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">作り方</h4>
                <div className="space-y-2">
                  {recipe.steps.map((step, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex">
                      <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No recipes message */}
      {recipes.length === 0 && !isLoading && (
        <Card className="p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">レシピを生成してみましょう</h3>
          <p className="text-gray-500">
            冷蔵庫の食材を使った美味しいレシピをAIが提案します
          </p>
        </Card>
      )}
    </div>
  );
};

export default RecipesSuggestion;
