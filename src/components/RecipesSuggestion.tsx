import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  IoRestaurant, 
  IoTime, 
  IoCheckmarkCircle, 
  IoLeaf,
  IoCube,
  IoSearch,
  IoSnowOutline,
  IoBasketOutline
} from 'react-icons/io5';

// --- インターフェース定義（変更なし） ---
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

interface RakutenRecipe {
  recipeId: number;
  recipeTitle: string;
  recipeUrl: string;
  foodImageUrl: string;
  mediumImageUrl?: string;
  smallImageUrl?: string;
  recipeMaterial: string[];
  recipeIndication: string;
  recipeCost: string;
  recipeDescription: string;
}

interface RecipesSuggestionProps {
  foodItems: FoodItem[];
  basketItems: FoodItem[];
}

// --- 環境変数（変更なし） ---
const RAKUTEN_APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID || 'YOUR_RAKUTEN_APP_ID_HERE';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

import { structuredCategoryMap } from '@/lib/recipeCategories';

const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ foodItems, basketItems }) => {
  const [rakutenRecipes, setRakutenRecipes] = useState<RakutenRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBasketOnly, setUseBasketOnly] = useState(true);
  
  // APIレート制限関連のstate
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);

  // ★★★ 動的に生成されるカテゴリマップのためのstate ★★★
  const [categoryMap, setCategoryMap] = useState<Record<string, { name: string; keywords: string[] }> | null>(null);
  const [isCategoryMapLoading, setIsCategoryMapLoading] = useState(true);

  // --- カテゴリマップの動的構築処理 ---
  useEffect(() => {
    const buildCategoryMap = () => {
      const callbackName = `rakutenCategoryCallback_${Date.now()}`;
      const script = document.createElement('script');

      const cleanup = () => {
        delete (window as any)[callbackName];
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };

      (window as any)[callbackName] = (data: any) => {
        if (data && data.result) {
          const newCategoryMap: Record<string, { name: string; keywords: string[] }> = {};
          // 大カテゴリ
          data.result.large.forEach((cat: any) => {
            newCategoryMap[cat.categoryId] = { name: cat.categoryName, keywords: [cat.categoryName] };
          });
          // 中カテゴリ (親IDと連結)
          data.result.medium.forEach((cat: any) => {
            const combinedId = `${cat.parentCategoryId}-${cat.categoryId}`;
            newCategoryMap[combinedId] = { name: cat.categoryName, keywords: [cat.categoryName] };
          });
          // 小カテゴリ (親IDと連結)
          data.result.small.forEach((cat: any) => {
            const combinedId = `${cat.parentCategoryId}-${cat.categoryId}`;
            newCategoryMap[combinedId] = { name: cat.categoryName, keywords: [cat.categoryName] };
          });
          
          setCategoryMap(newCategoryMap);
          console.log('楽天レシピのカテゴリマップを動的に構築しました。', newCategoryMap);
          toast.success('レシピカテゴリの準備ができました');
        } else {
          toast.error('レシピカテゴリの取得に失敗しました。');
        }
        setIsCategoryMapLoading(false);
        cleanup();
      };

      script.src = `https://app.rakuten.co.jp/services/api/Recipe/CategoryList/20170426?applicationId=${RAKUTEN_APP_ID}&format=jsonp&callback=${callbackName}`;
      script.onerror = () => {
        toast.error('カテゴリAPIの読み込みに失敗しました。');
        setIsCategoryMapLoading(false);
        cleanup();
      };

      document.body.appendChild(script);
    };

    if (RAKUTEN_APP_ID !== 'YOUR_RAKUTEN_APP_ID_HERE') {
      buildCategoryMap();
    }
  }, [RAKUTEN_APP_ID]);

  useEffect(() => {
    if (RAKUTEN_APP_ID === 'YOUR_RAKUTEN_APP_ID_HERE') {
      toast.warning('楽天APIキーが設定されていません', {
        description: '.envファイルに VITE_RAKUTEN_APP_ID を追加してください。',
        duration: 8000,
      });
    }
    if (!GEMINI_API_KEY) {
      toast.warning('Gemini APIキーが設定されていません', {
        description: '.envファイルに VITE_GEMINI_API_KEY を追加してください。',
        duration: 8000,
      });
    }
  }, []);

  const processIngredientsWithGemini = async (ingredients: string[]): Promise<string[]> => {
    if (!GEMINI_API_KEY) {
      toast.error('Gemini APIキーが設定されていないため、高度な食材名処理をスキップします。');
      return ingredients;
    }

    const processingToast = toast.loading('AIが食材名を最適化中...');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `以下の食材リストを、楽天レシピAPIでの検索に最適化された一般的な食材名のリストに変換してください。産地、ブランド名、量、余分な説明（「切り落とし」など）はすべて取り除き、最も基本的な食材名のみを抽出してください。結果は "ingredients" というキーを持つJSON配列で返してください。\n\n入力リスト: ${JSON.stringify(ingredients)}\n\n例:\n入力: ["国産若鶏もも肉(徳用)", "こくうま絹豆腐 3個パック"]\n出力: {"ingredients": ["鶏もも肉", "豆腐"]}`
            }]
          }]
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini APIから有効なJSONを取得できませんでした');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      toast.success('食材名をAIで最適化しました！', { id: processingToast });
      
      console.log('Gemini processed ingredients:', parsedData.ingredients);
      return parsedData.ingredients || ingredients;

    } catch (error) {
      console.error('Error processing ingredients with Gemini:', error);
      toast.error('AIによる食材名の処理中にエラーが発生しました。', { id: processingToast });
      return ingredients; // エラー時も元のリストを返す
    }
  };

  const filterRecipesWithGemini = async (recipes: RakutenRecipe[], userIngredients: string[]): Promise<number[]> => {
    if (!GEMINI_API_KEY) {
      toast.error('Gemini APIキーが設定されていないため、高度なレシピフィルタリングをスキップします。');
      return recipes.map(r => r.recipeId);
    }

    const filteringToast = toast.loading('AIがレシピを厳選中...');

    const recipesForPrompt = recipes.map(r => ({
      recipeId: r.recipeId,
      recipeTitle: r.recipeTitle,
      recipeMaterial: r.recipeMaterial
    }));

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは賢いレシピ判定アシスタントです。\nユーザーが持っている食材リストと、複数のレシピ候補が渡されます。\nユーザーの食材リストに書かれている食材が、レシピの材料リストに実質的に含まれているかどうかを判定してください。\n\nユーザーの食材: ${JSON.stringify(userIngredients)}\n\nレシピ候補リスト: ${JSON.stringify(recipesForPrompt)}\n\n判定基準:\n- ユーザーの食材が1つ以上、レシピ材料に含まれていること。\n- 表記揺れ（例：「豚肉」と「豚バラ肉」、「豆腐」と「絹ごし豆腐」）は同一とみなす。\n- 明らかに関係のないレシピは除外する。\n\n上記の基準を満たすレシピの recipeId のみを、"matchedRecipeIds" というキーを持つJSON配列で返してください。\n\n例:\n入力(ユーザー食材): ["豚肉", "玉ねぎ"]\n入力(レシピ候補): [{recipeId: 1, recipeTitle: "豚の生姜焼き", recipeMaterial: ["豚ロース肉", "玉ねぎ"]}, {recipeId: 2, recipeTitle: "鶏の唐揚げ", recipeMaterial: ["鶏もも肉", "醤油"]}]\n出力: {"matchedRecipeIds": [1]}`
            }]
          }]
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini APIから有効なJSONを取得できませんでした');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      toast.success('AIによるレシピの厳選が完了！', { id: filteringToast });
      
      console.log('Gemini filtered recipe IDs:', parsedData.matchedRecipeIds);
      return parsedData.matchedRecipeIds || [];

    } catch (error) {
      console.error('Error filtering recipes with Gemini:', error);
      toast.error('AIによるレシピの厳選中にエラーが発生しました。', { id: filteringToast });
      return [];
    }
  };


  // レート制限管理関数（改良版：1.5秒間隔を採用）
  const canMakeRequest = (): boolean => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // 1分間に最大10リクエスト制限
    if (timeSinceLastRequest < 60000) { // 1分以内の場合
      if (requestCount >= 10) {
        return false;
      }
    } else {
      // 1分以上経過している場合はカウントリセット
      setRequestCount(0);
    }
    
    // 最低1.5秒間隔を強制（ブログ記事推奨値）
    if (timeSinceLastRequest < 1500) {
      return false;
    }
    
    return true;
  };

  const updateRequestStatus = () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < 60000) {
      setRequestCount(prev => prev + 1);
    }
    else {
      setRequestCount(1);
    }
    
    setLastRequestTime(now);
  };

  const waitForRateLimit = async (): Promise<void> => {
    if (!canMakeRequest()) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < 1500) {
        // 最低1.5秒待機（ブログ記事推奨値）
        const waitTime = 1500 - timeSinceLastRequest;
        console.log(`Rate limit: waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (requestCount >= 10) {
        // 1分間で10リクエスト制限に達した場合
        const waitTime = 60000 - timeSinceLastRequest;
        console.log(`Rate limit: too many requests, waiting ${waitTime}ms...`);
        setIsRateLimited(true);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        setIsRateLimited(false);
        setRequestCount(0);
      }
    }
  };

  // --- 食材名の正規化（変更なし） ---
  const normalizeIngredientForSearch = (ingredient: string): string => {
    // レシピ検索に不要な汎用的な単語を削除
    const unnecessaryWords = [
      '国内産', '国産', '外国産', '産',
      '切り落とし', 'スライス', 'ブロック', 'カット',
      '徳用', 'お買得', 'ジャンボパック', '使い切り', '少量', '大容量', 'パック',
      '若鶏', 'バラ凍結'
    ];
    const regex = new RegExp(unnecessaryWords.join('|'), 'g');
    let normalized = ingredient.replace(regex, '');

    // 数量や記号を削除
    normalized = normalized.replace(/[0-9]+[個本匹枚袋パックgkgml]?/g, '');
    normalized = normalized.replace(/[（）()【】\[\]]/g, '');
    normalized = normalized.replace(/[・×〜～−－]/g, '');
    normalized = normalized.trim();
    
    // 表記揺れを統一するためのマップ
    const ingredientNormalizationMap: Record<string, string> = {
      // 肉類
      '鶏モモ': '鶏もも肉', '鶏ムネ': '鶏むね肉', 'チキン': '鶏肉',
      '豚ロース': '豚ロース肉', '豚こま': '豚こま切れ肉', 'ポーク': '豚肉', '豚バラ': '豚バラ肉',
      '牛ロース': '牛肉', 'ビーフ': '牛肉',
      'ひき肉': 'ひき肉', '挽肉': 'ひき肉',

      // 魚介類
      'サーモン': '鮭', 'ツナ': 'まぐろ', 'マグロ': 'まぐろ',

      // 野菜
      'たまねぎ': '玉ねぎ', 'タマネギ': '玉ねぎ', '玉葱': '玉ねぎ',
      'にんじん': 'にんじん', 'ニンジン': 'にんじん', '人参': 'にんじん',
      'じゃがいも': 'じゃがいも', 'ジャガイモ': 'じゃがいも', 'じゃが芋': 'じゃがいも',
      'ピーマン': 'ピーマン', 'ぴーまん': 'ピーマン',
      'なす': 'なす', 'ナス': 'なす',
      'きゅうり': 'きゅうり', 'キュウリ': 'きゅうり',

      // 大豆製品
      '絹豆腐': '豆腐', '木綿豆腐': '豆腐', '焼き豆腐': '豆腐', 'とうふ': '豆腐',

      // その他
      'しょうゆ': '醤油', 'ごはん': 'ご飯', 'たまご': '卵',
    };
    
    const mappedIngredient = ingredientNormalizationMap[normalized] || normalized;
    return mappedIngredient.trim();
  };

  // --- レート制限対応のJSONPリクエスト関数（改良版） ---
  const fetchRakutenRecipesByCategories = async (categoryIds: string[]): Promise<RakutenRecipe[]> => {
    if (categoryIds.length === 0) return [];
    
    const categoryIdString = categoryIds.join(',');

    // レート制限チェックと待機
    await waitForRateLimit();
    
    return new Promise((resolve) => {
      const callbackName = `rakutenCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const script = document.createElement('script');

      const cleanup = () => {
        delete (window as any)[callbackName];
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        clearTimeout(timeout);
      };

      const timeout = setTimeout(() => {
        console.error(`API request timeout for categories ${categoryIdString}`);
        cleanup();
        resolve([]);
      }, 15000);

      (window as any)[callbackName] = (data: any) => {
        updateRequestStatus();
        
        if (data && data.error) {
          console.error(`API error for categories ${categoryIdString}:`, data.error);
          if (data.error === 'too_many_requests') {
            setIsRateLimited(true);
            setLastRequestTime(Date.now() + 30000);
          }
          cleanup();
          resolve([]);
          return;
        }
        
        if (data && data.result) {
          console.log(`Successfully fetched ${data.result.length} recipes from categories ${categoryIdString}`);
          resolve(data.result);
        } else {
          console.error(`No result data for categories ${categoryIdString}:`, data);
          resolve([]);
        }
        cleanup();
      };

      updateRequestStatus();
      
      script.src = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?applicationId=${RAKUTEN_APP_ID}&categoryId=${categoryIdString}&callback=${callbackName}`;
      script.onerror = () => {
        console.error(`Rakuten Recipe API request failed for categories ${categoryIdString}`);
        cleanup();
        resolve([]);
      };

      document.body.appendChild(script);
    });
  };

  // ★★★ 改良版: 動的カテゴリマップを使用してカテゴリを検索 ★★★
  const mapIngredientsToCategories = (ingredients: string[]): string[] => {
    if (!categoryMap) return [];

    const normalizedIngredients = ingredients.map(normalizeIngredientForSearch);
    const matchedCategoryIds = new Set<string>();

    normalizedIngredients.forEach(ingredient => {
      Object.entries(categoryMap).forEach(([categoryId, categoryData]) => {
        // 食材名とカテゴリ名のキーワードが部分一致するかチェック
        if (categoryData.keywords.some(keyword => ingredient.includes(keyword) || keyword.includes(ingredient))) {
          matchedCategoryIds.add(categoryId);
        }
      });
    });

    const finalCategories = Array.from(matchedCategoryIds);
    console.log('Matched categories from dynamic map:', finalCategories);

    // マッチしなかった場合のフォールバック
    if (finalCategories.length === 0) {
      const fallbackCategories = ['10', '11', '12', '13', '14']; // 主要な大カテゴリ
      console.log('Using fallback categories:', fallbackCategories);
      return fallbackCategories;
    }

    return finalCategories.slice(0, 10); // 検索するカテゴリ数を最大10に制限
  };

  // --- レシピフィルタリングとスコアリング（Geminiがメインのため簡素化） ---
  const checkRecipeContainsIngredients = (recipe: RakutenRecipe, availableIngredients: string[]): boolean => {
      if (availableIngredients.length === 0) return true;
      const recipeMaterials = recipe.recipeMaterial.map(m => normalizeIngredientForSearch(m));
      return availableIngredients.some(ownedIngredient => 
          recipeMaterials.some(recipeIngredient => recipeIngredient.includes(ownedIngredient) || ownedIngredient.includes(recipeIngredient))
      );
  };

  const calculateRecipeScore = (recipe: RakutenRecipe, availableIngredients: string[]): number => {
      let score = 0;
      const recipeMaterials = recipe.recipeMaterial.map(m => normalizeIngredientForSearch(m));
      availableIngredients.forEach(ownedIngredient => {
          if (recipeMaterials.some(recipeIngredient => recipeIngredient.includes(ownedIngredient))) {
              score += 1;
          }
      });
      return score;
  };


  // --- レシピ検索のメインロジック（変更なし、改良されたカテゴリマッピングを利用） ---
  const searchRakutenRecipes = async () => {
    const itemsToUse = useBasketOnly ? basketItems : foodItems;
    if (itemsToUse.length === 0) {
      toast.error(useBasketOnly ? '今日の献立に食材を追加してください' : '冷蔵庫に食材を追加してください');
      return;
    }
    if (RAKUTEN_APP_ID === 'YOUR_RAKUTEN_APP_ID_HERE') {
      toast.error('楽天APIキーが設定されていません。');
      return;
    }

    setIsLoading(true);
    setRakutenRecipes([]);

    try {
      const originalIngredientNames = itemsToUse.map(item => item.name);
      
      // Gemini APIで食材名を処理
      const processedIngredientNames = await processIngredientsWithGemini(originalIngredientNames);

      const categoriesToSearch = mapIngredientsToCategories(processedIngredientNames);
      
      // ★★★ 改良されたロジック：複数カテゴリを一度にリクエスト ★★★
      const allFetchedRecipes = await fetchRakutenRecipesByCategories(categoriesToSearch);
      
      console.log(`=== API検索完了サマリー ===`);
      console.log(`検索カテゴリ: ${categoriesToSearch.join(', ')}`);
      console.log(`ユニークレシピ取得数: ${allFetchedRecipes.length}`);

      // ★★★ Gemini APIでレシピをフィルタリング ★★★
      const normalizedIngredientNames = processedIngredientNames.map(normalizeIngredientForSearch);
      const matchedRecipeIds = await filterRecipesWithGemini(allFetchedRecipes, normalizedIngredientNames);

      const finalRecipes = allFetchedRecipes.filter(recipe => matchedRecipeIds.includes(recipe.recipeId));

      console.log(`AIによるフィルタリング後のレシピ数: ${finalRecipes.length}`);

      // フィルタリング後にレシピが0件の場合、フォールバック
      if (finalRecipes.length === 0 && allFetchedRecipes.length > 0) {
        console.log('AIフィルタリングで一致するレシピがなかったため、フォールバック表示します。');
        const fallbackRecipes = allFetchedRecipes.slice(0, 10);
        setRakutenRecipes(fallbackRecipes);
        toast.warning('AIが関連性の高いレシピを見つけられませんでした。', {
          description: '代わりに取得した全てのレシピ候補を表示します。',
        });
      } else {
        const displayRecipes = finalRecipes.slice(0, 10); // 表示件数を10件に
        setRakutenRecipes(displayRecipes);

        if (displayRecipes.length > 0) {
          toast.success(`AIが${displayRecipes.length}件の関連レシピを厳選しました！`);
        } else {
          toast.error('関連するレシピが見つかりませんでした。');
        }
      }

    } catch (error) {
      console.error('Rakuten recipe search error:', error);
      toast.error('レシピの検索中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };


  // --- JSX（UI部分） ---
  // 元のコードから変更なしのため、ここでは省略します。
  // ご自身のプロジェクトのJSX部分をそのままお使いください。
  return (
    <div className="space-y-6">
      {/* Food Source Toggle */}
      <Card className="p-6 bg-white border border-neutral-200 shadow-sm rounded-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 rounded-lg">
                  <IoRestaurant className="text-lg text-brand-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-lg">今日の献立からレシピを提案</h3>
              </div>
              <p className="text-sm text-neutral-600">
                「今日の献立」の食材を使ってレシピを検索します。冷蔵庫全体の食材からも検索できます。
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant={!useBasketOnly ? "default" : "outline"}
                size="default"
                onClick={() => setUseBasketOnly(false)}
                className={`transition-all duration-200 px-4 py-2 ${
                  !useBasketOnly 
                    ? "bg-success-600 hover:bg-success-700 text-white shadow-sm" 
                    : "border-success-300 text-success-600 hover:bg-success-50"
                }`}
              >
                <IoSnowOutline className="mr-2 h-4 w-4" />
                <span className="font-medium">冷蔵庫全体 ({foodItems.length})</span>
              </Button>
              <Button
                variant={useBasketOnly ? "default" : "outline"}
                size="default"
                onClick={() => setUseBasketOnly(true)}
                className={`transition-all duration-200 px-4 py-2 ${
                  useBasketOnly 
                    ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm" 
                    : "border-brand-300 text-brand-600 hover:bg-brand-50"
                }`}
              >
                <IoBasketOutline className="mr-2 h-4 w-4" />
                <span className="font-medium">今日の献立 ({basketItems.length})</span>
              </Button>
            </div>
          </div>
          
          {/* Current Selection Display */}
          <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2 text-base">
                {useBasketOnly ? '今日の献立の食材' : '冷蔵庫の食材'}: {(useBasketOnly ? basketItems : foodItems).length}種類
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(useBasketOnly ? basketItems : foodItems).slice(0, 8).map(item => (
                  <Badge 
                    key={item.id} 
                    className="text-xs bg-neutral-100 text-neutral-700 border-0 px-3 py-1 rounded-md"
                  >
                    {item.name}
                  </Badge>
                ))}
                {(useBasketOnly ? basketItems : foodItems).length > 8 && (
                  <Badge className="text-xs bg-neutral-200 text-neutral-600 px-3 py-1 rounded-md">
                    +{(useBasketOnly ? basketItems : foodItems).length - 8}個
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              onClick={searchRakutenRecipes}
              disabled={isLoading || isRateLimited || isCategoryMapLoading || (useBasketOnly ? basketItems.length === 0 : foodItems.length === 0)}
              className={`transition-all duration-200 shadow-sm hover:shadow-md px-6 py-2 ${
                isRateLimited 
                  ? "bg-orange-500 hover:bg-orange-600"
                  : useBasketOnly 
                    ? "bg-brand-600 hover:bg-brand-700" 
                    : "bg-success-600 hover:bg-success-700"
              } text-white`}
              size="default"
            >
              {isCategoryMapLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="font-medium">カテゴリ準備中...</span>
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="font-medium">検索中...</span>
                </>
              ) : isRateLimited ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="font-medium">待機中...</span>
                </>
              ) : (
                <>
                  <IoSearch className="h-4 w-4 mr-2" />
                  <span className="font-medium">レシピ検索</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Rakuten Recipes Display */}
      {rakutenRecipes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rakutenRecipes.map((recipe, index) => (
            <Card key={index} className="p-0 bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden rounded-xl">
              <div className="relative">
                {recipe.foodImageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={recipe.foodImageUrl}
                      alt={recipe.recipeTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{recipe.recipeTitle}</h3>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  {!recipe.foodImageUrl && (
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{recipe.recipeTitle}</h3>
                  )}
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{recipe.recipeDescription}</p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center text-sm text-neutral-600 bg-neutral-100 px-3 py-2 rounded-full">
                      <IoTime className="h-4 w-4 mr-2 text-warning-600" />
                      {recipe.recipeIndication}
                    </div>
                    <Badge className="bg-warning-50 text-warning-800 border border-warning-200 px-3 py-1">
                      約{recipe.recipeCost}
                    </Badge>
                  </div>
                </div>
              </div>

                <div className="px-6 pb-6">
                  <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <IoLeaf className="text-success-600" />
                    材料
                  </h4>
                  <div className="space-y-2 mb-6">
                    {recipe.recipeMaterial.map((ingredient, idx) => {
                      const itemsToUse = useBasketOnly ? basketItems : foodItems;
                      const availableIngredients = itemsToUse.map(item => normalizeIngredientForSearch(item.name));
                      
                      const isAvailable = availableIngredients.some(available => {
                        const normalizedRecipeIngredient = normalizeIngredientForSearch(ingredient.replace(/[0-9]+.*/, '').replace(/[◎★※・]/g, '').trim());
                        
                        return normalizedRecipeIngredient.includes(available) || 
                               available.includes(normalizedRecipeIngredient);
                      });
                      
                      return (
                        <div key={idx} className="text-sm flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                          <div className="flex items-center">
                            {isAvailable ? (
                              <IoCheckmarkCircle className="text-success-600 mr-3 text-lg" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-neutral-300 rounded-full mr-3" />
                            )}
                            <span className={isAvailable ? 'text-success-700 font-medium' : 'text-neutral-600'}>
                              {ingredient}
                            </span>
                          </div>
                          {isAvailable && (
                            <Badge className="bg-success-50 text-success-800 border border-success-200 text-xs">
                              手持ちあり
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => window.open(recipe.recipeUrl, '_blank')}
                    className="w-full bg-warning-600 hover:bg-warning-700 text-white shadow-sm hover:shadow-md transition-all duration-200 py-3"
                    size="default"
                  >
                    <IoRestaurant className="mr-2 h-4 w-4" />
                    <span className="font-medium">楽天レシピで詳細を見る</span>
                  </Button>
                </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipesSuggestion;