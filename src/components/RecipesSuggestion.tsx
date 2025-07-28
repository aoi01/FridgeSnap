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

// === 親子関係を定義した新しいカテゴリ構造 ===
interface CategoryNode {
  name: string;
  keywords: string[];
  children?: string[]; // 子カテゴリのIDリスト
}

const structuredCategoryMap: Record<string, CategoryNode> = {
  // --- 肉類 ---
  '10-275': { name: '牛肉', keywords: ['牛肉', '牛', 'ビーフ', 'beef'], children: ['10-275-516', '10-275-822', '10-275-1483'] },
  '10-275-516': { name: '牛肉薄切り', keywords: ['牛肉薄切り', '牛薄切り'] },
  '10-275-822': { name: '牛かたまり肉', keywords: ['牛かたまり肉', '牛ステーキ', '牛焼肉', '牛ロース', '牛サーロイン', '牛ヒレ'] },
  '10-275-1483': { name: '牛タン', keywords: ['牛タン'] },
  
  '10-276': { name: '豚肉', keywords: ['豚肉', '豚', 'ポーク', 'pork'], children: ['10-276-830', '10-276-1484', '10-276-1485', '10-276-1486', '10-276-517', '10-276-828', '10-276-829'] },
  '10-276-830': { name: '豚バラ肉', keywords: ['豚バラ肉', '豚バラ'] },
  '10-276-1484': { name: '豚ヒレ肉', keywords: ['豚ヒレ肉', '豚ヒレ'] },
  '10-276-1485': { name: '豚ロース', keywords: ['豚ロース'] },
  '10-276-1486': { name: '豚もも肉', keywords: ['豚もも肉', '豚もも'] },
  '10-276-517': { name: '豚薄切り肉', keywords: ['豚薄切り肉', '豚薄切り'] },
  '10-276-828': { name: '豚かたまり肉', keywords: ['豚かたまり肉'] },
  '10-276-829': { name: '豚こま切れ肉', keywords: ['豚こま切れ肉', '豚こま'] },

  '10-277': { name: '鶏肉', keywords: ['鶏肉', '鶏', 'チキン', 'chicken'], children: ['10-277-518', '10-277-1119', '10-277-519', '10-277-1488', '10-277-520'] },
  '10-277-518': { name: '鶏もも肉', keywords: ['鶏もも肉', '鶏もも'] },
  '10-277-1119': { name: '鶏むね肉', keywords: ['鶏むね肉', '鶏むね'] },
  '10-277-519': { name: 'ささみ', keywords: ['ささみ', 'ササミ'] },
  '10-277-1488': { name: '手羽元', keywords: ['手羽元'] },
  '10-277-520': { name: '手羽先', keywords: ['手羽先'] },
  
  '10-278': { name: 'ひき肉', keywords: ['ひき肉', '挽肉', 'ミンチ', '合い挽き', '合挽き'] },

  // --- 魚介類 ---
  '11': { name: '魚', keywords: ['魚', '魚類', '刺身', '切り身'], children: ['32'] },
  '32': { name: '定番の魚料理', keywords: ['サーモン', '鮭', 'まぐろ', 'さば', 'いわし', 'あじ', 'ぶり', 'さんま', '鯛', 'たら', 'えび', 'いか', 'たこ', '牡蠣', '貝類'] },
  
  // --- 野菜 ---
  '12': { name: '野菜', keywords: ['野菜', 'なす', 'かぼちゃ', '大根', 'きゅうり', 'じゃがいも', 'さつまいも', 'キャベツ', '白菜', 'トマト', 'もやし', 'ほうれん草', '玉ねぎ', 'ブロッコリー', 'にんじん', 'きのこ'] },

  // --- その他 ---
  '33': { name: '卵料理', keywords: ['卵', 'たまご'] },
  '35': { name: '大豆・豆腐', keywords: ['豆腐', '大豆', '納豆', '厚揚げ', '油揚げ'] },
  '14': { name: 'ご飯もの', keywords: ['米', 'ご飯', 'ごはん'] },
  '15': { name: 'パスタ', keywords: ['パスタ', 'スパゲティ'] },
  '17': { name: '汁物・スープ', keywords: ['スープ', '味噌汁', '豚汁'] },
  '18': { name: 'サラダ', keywords: ['サラダ'] },
  '23': { name: '鍋料理', keywords: ['鍋'] },
  '19': { name: '調味料', keywords: ['醤油', '塩', '砂糖', '酢', '油', 'みりん', '酒', 'こしょう', '味噌'] },
};


const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ foodItems, basketItems }) => {
  const [rakutenRecipes, setRakutenRecipes] = useState<RakutenRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBasketOnly, setUseBasketOnly] = useState(true);
  
  // レート制限対応のための状態管理
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);

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
    } else {
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
    let normalized = ingredient.replace(/[0-9]+[個本匹枚袋パックgkgml]?/g, '');
    normalized = normalized.replace(/[（）()【】\[\]]/g, '');
    normalized = normalized.replace(/[・×〜～−－]/g, '');
    normalized = normalized.trim();
    
    const ingredientNormalizationMap: Record<string, string> = {
      '鶏モモ': '鶏もも肉', '鶏ムネ': '鶏むね肉', '豚ロース': '豚ロース肉', '豚こま': '豚こま切れ肉',
      '牛ロース': '牛肉', 'ひき肉': 'ひき肉', '挽肉': 'ひき肉', 'サーモン': '鮭',
      'ツナ': 'まぐろ', 'マグロ': 'まぐろ', 'たまねぎ': '玉ねぎ', 'タマネギ': '玉ねぎ',
      'ニンジン': 'にんじん', '人参': 'にんじん', 'ジャガイモ': 'じゃがいも',
      'しょうゆ': '醤油', 'ごはん': 'ご飯', 'たまご': '卵', 'チキン': '鶏肉', 'ポーク': '豚肉', 'ビーフ': '牛肉',
    };
    
    const mappedIngredient = ingredientNormalizationMap[normalized] || normalized;
    // console.log(`Ingredient normalization: "${ingredient}" -> "${mappedIngredient}"`);
    return mappedIngredient;
  };

  // --- レート制限対応のJSONPリクエスト関数 ---
  const fetchRakutenRecipesByCategory = async (categoryId: string): Promise<RakutenRecipe[]> => {
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
        console.error(`API request timeout for category ${categoryId}`);
        cleanup();
        resolve([]);
      }, 15000); // タイムアウトを15秒に延長

      (window as any)[callbackName] = (data: any) => {
        updateRequestStatus(); // リクエスト完了時にカウント更新
        
        if (data && data.error) {
          console.error(`API error for category ${categoryId}:`, data.error);
          if (data.error === 'too_many_requests') {
            console.log('Rate limit detected, will wait longer for next request');
            setIsRateLimited(true);
            // 次回のリクエストのために追加待機時間を設定
            setLastRequestTime(Date.now() + 30000); // 30秒追加待機
          }
          cleanup();
          resolve([]);
          return;
        }
        
        if (data && data.result) {
          console.log(`Successfully fetched ${data.result.length} recipes from category ${categoryId}`);
          resolve(data.result);
        } else {
          console.error(`No result data for category ${categoryId}:`, data);
          resolve([]);
        }
        cleanup();
      };

      // リクエスト前にカウント更新
      updateRequestStatus();
      
      script.src = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?applicationId=${RAKUTEN_APP_ID}&categoryId=${categoryId}&callback=${callbackName}`;
      script.onerror = () => {
        console.error(`Rakuten Recipe API request failed for category ${categoryId}`);
        cleanup();
        resolve([]);
      };

      document.body.appendChild(script);
    });
  };

  // ★★★ 改良版: より効率的なカテゴリマッピング（ブログ記事の戦略を採用） ★★★
  const mapIngredientsToCategories = (ingredients: string[]): string[] => {
    const normalizedIngredients = ingredients.map(normalizeIngredientForSearch);
    const matchedCategoryIds = new Set<string>();

    normalizedIngredients.forEach(ingredient => {
      Object.entries(structuredCategoryMap).forEach(([categoryId, categoryNode]) => {
        const isMatch = categoryNode.keywords.some(keyword => ingredient.includes(keyword));

        if (isMatch) {
          // 詳細カテゴリを優先的に追加（大・中・小分類戦略）
          if (categoryNode.children && categoryNode.children.length > 0) {
            // 子カテゴリがある場合、子カテゴリを優先
            categoryNode.children.forEach(childId => {
              matchedCategoryIds.add(childId);
            });
            // 親カテゴリも念のため追加
            matchedCategoryIds.add(categoryId);
          } else {
            // 子カテゴリがない場合は親カテゴリを追加
            matchedCategoryIds.add(categoryId);
          }
        }
      });
    });

    const finalCategories = Array.from(matchedCategoryIds);
    console.log('Matched categories (detailed strategy):', finalCategories);

    // マッチしなかった場合のフォールバック（より具体的な詳細カテゴリを含む）
    if (finalCategories.length === 0) {
      const fallbackCategories = [
        '10-276-830', '10-277-518', '10-275-516', // 豚バラ、鶏もも、牛薄切り
        '32', '12', '33' // 定番魚料理、野菜、卵
      ];
      console.log('Using detailed fallback categories:', fallbackCategories);
      return fallbackCategories;
    }

    // 詳細カテゴリを優先的にソート（ブログ記事の戦略）
    const priorityOrder = [
      // 詳細な肉類カテゴリを最優先
      '10-276-830', '10-276-1484', '10-276-1485', '10-276-1486', // 豚肉詳細
      '10-277-518', '10-277-1119', '10-277-519', // 鶏肉詳細
      '10-275-516', '10-275-822', '10-275-1483', // 牛肉詳細
      // 親カテゴリ
      '10-276', '10-277', '10-275', '10-278',
      // その他カテゴリ
      '32', '12', '33', '35', '14', '17', '23'
    ];
    
    finalCategories.sort((a, b) => {
      const aIndex = priorityOrder.findIndex(id => id === a);
      const bIndex = priorityOrder.findIndex(id => id === b);
      const aScore = aIndex !== -1 ? aIndex : Infinity;
      const bScore = bIndex !== -1 ? bIndex : Infinity;
      return aScore - bScore;
    });

    // 検索効率化のため、最大5カテゴリに制限
    return finalCategories.slice(0, 5);
  };

  // --- レシピフィルタリングとスコアリング（改良版） ---
  const checkRecipeContainsIngredients = (recipe: RakutenRecipe, availableIngredients: string[]): boolean => {
      if (availableIngredients.length === 0) return true; // 材料がなければ全レシピOK
      
      const recipeMaterials = recipe.recipeMaterial || [];
      const normalizedRecipeMaterials = recipeMaterials.map(m => normalizeIngredientForSearch(m));
      
      console.log(`Checking recipe: "${recipe.recipeTitle}"`);
      console.log(`Available ingredients:`, availableIngredients);
      console.log(`Recipe materials (normalized):`, normalizedRecipeMaterials);
      
      const hasMatch = availableIngredients.some(ownedIngredient => {
          const matchFound = normalizedRecipeMaterials.some(recipeIngredient => {
              // より柔軟なマッチング条件
              let isMatch = false;
              
              // 完全一致または部分一致
              if (recipeIngredient.includes(ownedIngredient) || ownedIngredient.includes(recipeIngredient)) {
                  isMatch = true;
              }
              
              // 肉類の特殊マッチング
              if (!isMatch && ownedIngredient.includes('肉')) {
                  const meatTypes = ['豚', '牛', '鶏', 'ひき肉', 'バラ', 'ロース', 'もも', 'むね', 'ささみ'];
                  isMatch = meatTypes.some(meat => 
                      (ownedIngredient.includes(meat) && recipeIngredient.includes(meat)) ||
                      (ownedIngredient.includes('豚') && recipeIngredient.includes('ポーク')) ||
                      (ownedIngredient.includes('牛') && recipeIngredient.includes('ビーフ')) ||
                      (ownedIngredient.includes('鶏') && recipeIngredient.includes('チキン'))
                  );
              }
              
              // 野菜の柔軟マッチング
              if (!isMatch) {
                  const commonMatches = [
                      ['玉ねぎ', 'たまねぎ', 'タマネギ', 'オニオン'],
                      ['にんじん', 'ニンジン', '人参', 'キャロット'],
                      ['じゃがいも', 'ジャガイモ', 'ポテト'],
                      ['トマト', 'とまと'],
                      ['きゅうり', 'キュウリ'],
                      ['キャベツ', 'きゃべつ']
                  ];
                  
                  isMatch = commonMatches.some(group => 
                      group.some(variant => ownedIngredient.includes(variant)) &&
                      group.some(variant => recipeIngredient.includes(variant))
                  );
              }
              
              if (isMatch) {
                  console.log(`✓ Match found: "${ownedIngredient}" <-> "${recipeIngredient}"`);
              }
              return isMatch;
          });
          return matchFound;
      });
      
      console.log(`Recipe "${recipe.recipeTitle}" has match:`, hasMatch);
      return hasMatch;
  };

  const calculateRecipeScore = (recipe: RakutenRecipe, availableIngredients: string[]): number => {
      let score = 0;
      const recipeMaterials = recipe.recipeMaterial.map(m => normalizeIngredientForSearch(m));
      
      availableIngredients.forEach(ownedIngredient => {
          if (recipeMaterials.some(recipeIngredient => recipeIngredient.includes(ownedIngredient))) {
              score += 1; // 1材料マッチごとに1点
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
    setRakutenRecipes([]); // 検索開始時に前回の結果をクリア

    try {
      const ingredientNames = itemsToUse.map(item => item.name);
      // ★改良された関数を呼び出す
      const categoriesToSearch = mapIngredientsToCategories(ingredientNames);
      
      // 改良版重複チェック（ブログ記事の戦略を採用）
      const uniqueRecipes = new Map<number, RakutenRecipe>();
      const duplicateCount = { total: 0 };
      const maxCategories = 5; // 詳細カテゴリ戦略に合わせて増加

      for (let i = 0; i < Math.min(categoriesToSearch.length, maxCategories); i++) {
        const categoryId = categoriesToSearch[i];
        
        // レート制限チェック
        if (isRateLimited) {
          console.log('Rate limited, skipping remaining requests');
          break;
        }
        
        console.log(`Fetching recipes from category ${categoryId} (${i + 1}/${Math.min(categoriesToSearch.length, maxCategories)})...`);
        
        try {
          const recipes = await fetchRakutenRecipesByCategory(categoryId);
          
          if (recipes.length > 0) {
            let newRecipeCount = 0;
            recipes.forEach(recipe => {
              if (!uniqueRecipes.has(recipe.recipeId)) {
                uniqueRecipes.set(recipe.recipeId, recipe);
                newRecipeCount++;
              } else {
                duplicateCount.total++;
              }
            });
            console.log(`Category ${categoryId}: ${recipes.length} fetched, ${newRecipeCount} new, ${recipes.length - newRecipeCount} duplicates`);
            console.log(`Total unique recipes: ${uniqueRecipes.size}, total duplicates: ${duplicateCount.total}`);
          } else {
            console.log(`No recipes found in category ${categoryId}`);
          }
        } catch (error) {
          console.error(`Error fetching from category ${categoryId}:`, error);
        }
        
        // ブログ記事推奨の1.5秒待機時間
        if (i < Math.min(categoriesToSearch.length, maxCategories) - 1 && !isRateLimited) {
          console.log('Waiting before next request...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒待機（推奨値）
        }
      }

      const allFetchedRecipes = Array.from(uniqueRecipes.values());
      console.log(`=== API検索完了サマリー ===`);
      console.log(`検索カテゴリ数: ${Math.min(categoriesToSearch.length, maxCategories)}`);
      console.log(`ユニークレシピ取得数: ${allFetchedRecipes.length}`);
      console.log(`重複レシピ数: ${duplicateCount.total}`);
      console.log(`総APIリクエスト数: ${Math.min(categoriesToSearch.length, maxCategories)}`);

      const normalizedIngredientNames = ingredientNames.map(normalizeIngredientForSearch);
      console.log(`Normalized ingredient names for filtering:`, normalizedIngredientNames);

      // フィルタリング前にレシピタイトルを確認
      console.log(`Recipe titles before filtering:`, allFetchedRecipes.map(r => r.recipeTitle));

      const filteredAndScoredRecipes = allFetchedRecipes
        .filter(recipe => {
            // 今日の献立モードの場合、より柔軟なフィルタリング
            if (useBasketOnly && normalizedIngredientNames.length > 0) {
                // 今日の献立の食材が1つでも含まれていればOK
                const hasMatch = checkRecipeContainsIngredients(recipe, normalizedIngredientNames);
                console.log(`Recipe "${recipe.recipeTitle}" passed filter (basket mode):`, hasMatch);
                return hasMatch;
            } else if (!useBasketOnly) {
                // 冷蔵庫全体モードの場合、既存のロジック
                const hasMatch = checkRecipeContainsIngredients(recipe, normalizedIngredientNames);
                console.log(`Recipe "${recipe.recipeTitle}" passed filter (fridge mode):`, hasMatch);
                return hasMatch;
            } else {
                // 食材がない場合は全部表示
                return true;
            }
        })
        .map(recipe => ({
          recipe,
          score: calculateRecipeScore(recipe, normalizedIngredientNames)
        }));

      console.log(`Recipes after filtering: ${filteredAndScoredRecipes.length}`);

      let sortedRecipes = filteredAndScoredRecipes
        .sort((a, b) => b.score - a.score)
        .map(item => item.recipe);
      
      // フィルタリング後にレシピが0件の場合、フォールバック
      if (sortedRecipes.length === 0 && allFetchedRecipes.length > 0) {
        console.log('No recipes passed filtering, showing all fetched recipes as fallback');
        sortedRecipes = allFetchedRecipes.slice(0, 10);
        toast.warning('完全一致するレシピは見つかりませんでしたが、関連レシピを表示します。', {
          description: '食材を追加するか、冷蔵庫全体から検索してみてください'
        });
      }
      
      const displayRecipes = sortedRecipes.slice(0, 10); // 表示件数を10件に
      setRakutenRecipes(displayRecipes);

      if (displayRecipes.length > 0 && filteredAndScoredRecipes.length > 0) {
        toast.success(`レシピが${displayRecipes.length}件見つかりました！`, {
          description: `${Math.min(categoriesToSearch.length, maxCategories)}カテゴリから${allFetchedRecipes.length}件取得（重複${duplicateCount.total}件除外）`
        });
      } else if (displayRecipes.length > 0) {
        // フォールバック表示の場合
        toast.info(`関連レシピ${displayRecipes.length}件を表示中`, {
          description: `${allFetchedRecipes.length}件から選択（完全一致なし）`
        });
      } else if (displayRecipes.length === 0) {
        toast.error('レシピが見つかりませんでした。食材を追加するか、別のカテゴリを試してください。');
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
                <div className="p-2 bg-warning-50 rounded-lg">
                  <IoCube className="text-lg text-warning-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-lg">レシピ検索に使用する食材を選択</h3>
              </div>
              <p className="text-sm text-neutral-600">
                今日の献立の食材を優先して検索するか、冷蔵庫の全食材から検索するかを選択できます
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
              disabled={isLoading || isRateLimited || (useBasketOnly ? basketItems.length === 0 : foodItems.length === 0)}
              className={`transition-all duration-200 shadow-sm hover:shadow-md px-6 py-2 ${
                isRateLimited 
                  ? "bg-orange-500 hover:bg-orange-600"
                  : useBasketOnly 
                    ? "bg-brand-600 hover:bg-brand-700" 
                    : "bg-success-600 hover:bg-success-700"
              } text-white`}
              size="default"
            >
              {isLoading ? (
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
                        const normalizedIngredient = ingredient.replace(/[0-9]+.*/, '').replace(/[◎★※・]/g, '').trim();
                        
                        return normalizedIngredient.includes(available) || 
                               available.includes(normalizedIngredient) ||
                               (available.length >= 2 && normalizedIngredient.includes(available)) ||
                               (normalizedIngredient.length >= 2 && available.includes(normalizedIngredient));
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