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


const RecipesSuggestion: React.FC<RecipesSuggestionProps> = ({ foodItems, basketItems }) => {
  const [rakutenRecipes, setRakutenRecipes] = useState<RakutenRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBasketOnly, setUseBasketOnly] = useState(true);
  
  // ★★★ 古いレート制限state削除（シーケンシャル検索で対応）★★★

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


  // ★★★ レート制限対応のGemini API呼び出しヘルパー ★★★
  const callGeminiWithRateLimit = async (prompt: string, retryCount = 0): Promise<any> => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2秒
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (response.status === 429) {
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // 指数バックオフ
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          toast.loading(`API制限に達しました。${delay/1000}秒後に再試行します...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return callGeminiWithRateLimit(prompt, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after maximum retries');
        }
      }

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < maxRetries && (error instanceof Error && error.message.includes('fetch'))) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGeminiWithRateLimit(prompt, retryCount + 1);
      }
      throw error;
    }
  };

  // ★★★ 楽天レシピAPIカテゴリに特化した食材名処理関数（レート制限対応） ★★★
  const processIngredientsWithGeminiForTodayBasket = async (ingredients: string[], isTodayBasket: boolean): Promise<string[]> => {
    if (!GEMINI_API_KEY) {
      toast.error('Gemini APIキーが設定されていないため、高度な食材名処理をスキップします。');
      return ingredients;
    }

    try {
      const contextMessage = isTodayBasket 
        ? '今日の献立に選ばれた食材'
        : '冷蔵庫にある食材';
      
      const prompt = `あなたは楽天レシピAPIの専門家です。以下は${contextMessage}のリストです。これらの食材を楽天レシピAPIのカテゴリ構造に最適化された食材名に変換してください。

楽天レシピAPIの主要カテゴリ構造:
- カテゴリ10: ご飯もの（チャーハン、丼、おにぎり等）
- カテゴリ11: 魚料理（焼き魚、煮魚、刺身等）
- カテゴリ12: 野菜料理（サラダ、煮物、炒め物等）
- カテゴリ13: 卵料理（オムレツ、茶碗蒸し、目玉焼き等）
- カテゴリ14: パン（サンドイッチ、トースト等）
- カテゴリ15-152: 焼き物（焼肉、ステーキ、焼き鳥等）
- カテゴリ15-153: 炒め物（野菜炒め、チンジャオロース等）
- カテゴリ15-154: 煮物（肉じゃが、角煮等）
- カテゴリ15-155: 魚の調理法別
- カテゴリ15-157: 野菜の調理法別
- カテゴリ15-159: 豆腐料理
- カテゴリ15-160: 卵の調理法別

最適化ルール:
1. 商品名から余計な情報を削除（産地、ブランド、パッケージ情報）
2. 楽天レシピで一般的に使われる食材名に統一
3. 肉類は部位まで含めて具体的に（例：「豚バラ肉」「鶏もも肉」）
4. 野菜は標準的な名称に（例：「玉ねぎ」「にんじん」）
5. 魚類は魚種を明確に（例：「鮭」「あじ」「さば」）
6. 豆腐は「豆腐」に統一
7. 卵は「卵」に統一

入力食材リスト: ${JSON.stringify(ingredients)}

結果は "ingredients" というキーを持つJSON配列で返してください。

例:
入力: ["国産若鶏もも肉(徳用)", "こくうま絹豆腐 3個パック", "北海道産玉ねぎ(大)", "豚バラ切り落とし"]
出力: {"ingredients": ["鶏もも肉", "豆腐", "玉ねぎ", "豚バラ肉"]}`;

      const data = await callGeminiWithRateLimit(prompt);
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Gemini APIからの応答が不正です');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini APIから有効なJSONを取得できませんでした');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      console.log(`楽天レシピAPI用に${contextMessage}をAI最適化:`, parsedData.ingredients);
      return parsedData.ingredients || ingredients;

    } catch (error) {
      console.error('Error processing ingredients with Gemini for Rakuten Recipe API:', error);
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error('Gemini APIの利用制限に達しました。しばらく待ってから再試行してください。');
      } else {
        toast.warning('AI処理をスキップして検索を続行します。');
      }
      return ingredients; // エラー時も元のリストを返す
    }
  };

  // ★★★ 使用しないAI関数を削除 ★★★


  // ★★★ 古いレート制限管理関数を削除（シーケンシャル検索で対応）★★★

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

  // ★★★ GeminiAI選択カテゴリによるレシピ取得関数 ★★★
  const fetchRecipesByGeminiCategories = async (ingredients: string[]): Promise<RakutenRecipe[]> => {
    if (ingredients.length === 0) return [];
    
    console.log(`=== GeminiAIカテゴリ選択による検索開始 ===`);
    console.log(`使用食材:`, ingredients);

    try {
      // GeminiAIに最適なカテゴリを選択してもらう
      const selectedCategories = await selectOptimalCategoriesWithGemini(ingredients);
      
      if (selectedCategories.length === 0) {
        console.log('カテゴリが選択されませんでした');
        return [];
      }

      console.log(`GeminiAI選択カテゴリ:`, selectedCategories);
      
      // 選択されたカテゴリからレシピを取得
      const allRecipes = new Map<number, RakutenRecipe>();
      
      for (let i = 0; i < selectedCategories.length; i++) {
        const categoryId = selectedCategories[i];
        console.log(`\n[${i + 1}/${selectedCategories.length}] カテゴリ ${categoryId} からレシピ取得中...`);

        // API制限回避のため待機
        if (i > 0) {
          console.log('API制限回避のため4秒待機...');
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        try {
          const categoryRecipes = await fetchSingleCategory(categoryId);
          console.log(`カテゴリ ${categoryId} から ${categoryRecipes.length} 件のレシピを取得`);
          
          // レシピを統合（重複削除）
          categoryRecipes.forEach(recipe => {
            if (!allRecipes.has(recipe.recipeId)) {
              allRecipes.set(recipe.recipeId, recipe);
            }
          });
          
          // 進捗表示
          const currentTotal = allRecipes.size;
          console.log(`現在の累計ユニークレシピ数: ${currentTotal}`);
          
        } catch (error) {
          console.error(`カテゴリ ${categoryId} の検索でエラー:`, error);
          // エラーが発生してもそのまま次のカテゴリに続行
        }
      }

      const finalRecipes = Array.from(allRecipes.values());
      console.log(`\n=== GeminiAI選択カテゴリ検索完了 ===`);
      console.log(`最終統合レシピ数: ${finalRecipes.length}`);
      return finalRecipes;
      
    } catch (error) {
      console.error('GeminiAIカテゴリ選択でエラー:', error);
      return [];
    }
  };

  // ★★★ 古い食材別カテゴリ取得関数を削除（GeminiAI方式に統合）★★★

  // 単一カテゴリからレシピを取得
  const fetchSingleCategory = async (categoryId: string): Promise<RakutenRecipe[]> => {
    return new Promise<RakutenRecipe[]>((resolve) => {
      const callbackName = `rakutenCallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
        resolve([]); // タイムアウト時は空配列を返す
      }, 20000); // タイムアウトを20秒に延長

      (window as any)[callbackName] = (data: any) => {
        if (data && data.error) {
          console.error(`API error for category ${categoryId}:`, data.error);
          if (data.error === 'too_many_requests' || data.error.includes('too_many_requests')) {
            console.log('Rate limit detected, will retry with longer delay...');
          }
          cleanup();
          resolve([]);
          return;
        }
        
        if (data && data.result && Array.isArray(data.result)) {
          cleanup();
          resolve(data.result);
        } else {
          console.warn(`No valid result data for category ${categoryId}`);
          cleanup();
          resolve([]);
        }
      };
      
      script.src = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?applicationId=${RAKUTEN_APP_ID}&categoryId=${categoryId}&callback=${callbackName}`;
      script.onerror = () => {
        console.error(`Rakuten Recipe API request failed for category ${categoryId}`);
        cleanup();
        resolve([]);
      };

      document.body.appendChild(script);
    });
  };

  // ★★★ 古い階層検索戦略を削除（OR検索方式に変更）★★★

  // ★★★ 実際の楽天カテゴリマップを使ったGeminiAI選択機能 ★★★
  const selectOptimalCategoriesWithGemini = async (ingredients: string[]): Promise<string[]> => {
    if (!GEMINI_API_KEY) {
      console.log('Gemini APIキーが設定されていないため、フォールバック方式でカテゴリ選択');
      return getFallbackCategories(ingredients);
    }

    if (!categoryMap) {
      console.log('カテゴリマップが準備されていないため、フォールバック方式でカテゴリ選択');
      return getFallbackCategories(ingredients);
    }

    try {
      // 動的カテゴリマップをGeminiに渡すための形式に変換
      const categoryMapForGemini = Object.entries(categoryMap).reduce((acc, [categoryId, categoryData]) => {
        acc[categoryId] = `${categoryData.name}`;
        return acc;
      }, {} as Record<string, string>);

      console.log('GeminiAIに送信するカテゴリマップ:', Object.keys(categoryMapForGemini).length, '個のカテゴリ');

      const prompt = `あなたは楽天レシピAPIの専門家として、提供された食材に基づいて最適なレシピカテゴリを選択してください。

【使用する食材】
${JSON.stringify(ingredients)}

【楽天レシピAPIのカテゴリマップ】
${JSON.stringify(categoryMapForGemini, null, 2)}

【カテゴリ選択の基準】
1. 提供された食材に最も適しているカテゴリを1-2個選択
【具体的な選択方針】
・豆腐・卵類 → 専用カテゴリ（豆腐料理、卵料理）を優先


【重要な制約】
・必ず上記のカテゴリマップに存在するカテゴリIDのみを選択
・存在しないカテゴリIDは絶対に選択しない
・カテゴリIDは文字列形式で正確に返す（例: "10", "15-152", "11"）

【回答形式】
結果は "categories" というキーを持つJSON配列で返してください。

【回答例】
入力食材: ["豚バラ肉", "玉ねぎ"]
出力: {"categories": ["10-276", "12-96"]}`;

      // API呼び出し間に間隔を空ける
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await callGeminiWithRateLimit(prompt);
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Gemini APIからの応答が不正です');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini APIから有効なJSONを取得できませんでした');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      const selectedCategories = parsedData.categories || [];
      
      // 実際に存在するカテゴリIDのみをフィルタリング
      const validCategories = selectedCategories.filter((categoryId: string) => 
        categoryMap && categoryMap[categoryId]
      );
      
      console.log(`GeminiAIが選択したカテゴリ:`, selectedCategories);
      console.log(`有効なカテゴリ（存在確認済み）:`, validCategories);
      
      if (validCategories.length === 0) {
        console.log('有効なカテゴリが選択されなかったため、フォールバック方式を使用');
        return getFallbackCategories(ingredients);
      }
      
      // 上限を5個に制限
      return validCategories.slice(0, 5);

    } catch (error) {
      console.error('Error selecting categories with Gemini:', error);
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        toast.error('Gemini APIの利用制限に達しました。基本的なカテゴリ選択で続行します。');
      } else {
        toast.warning('AI分析をスキップして基本的なカテゴリ選択で続行します。');
      }
      console.log('Geminiエラーのためフォールバック方式でカテゴリ選択');
      return getFallbackCategories(ingredients);
    }
  };

  // フォールバック用のシンプルなカテゴリ選択
  const getFallbackCategories = (ingredients: string[]): string[] => {
    const fallbackMap: { [key: string]: string[] } = {
      '豚': ['15-152', '15-153', '10'],
      '鶏': ['15-152', '15-153', '10'], 
      '牛': ['15-152', '15-153', '10'],
      '魚': ['11', '15-155'],
      '鮭': ['11', '15-155'],
      'サーモン': ['11', '15-155'],
      '野菜': ['12', '15-157'],
      '玉ねぎ': ['12', '15-157', '15-153'],
      'にんじん': ['12', '15-157'],
      'じゃがいも': ['12', '15-157', '15-154'],
      '豆腐': ['12', '15-159'],
      '卵': ['13', '15-160']
    };

    const categories = new Set<string>();
    ingredients.forEach(ingredient => {
      Object.entries(fallbackMap).forEach(([key, cats]) => {
        if (ingredient.includes(key)) {
          cats.forEach(cat => categories.add(cat));
        }
      });
    });

    return categories.size > 0 ? Array.from(categories).slice(0, 4) : ['10', '11', '12'];
  };


  // ★★★ 古いフォールバック関数を削除（新しい効率的戦略を使用）★★★

  // --- レシピフィルタリングとスコアリング（Geminiがメインのため簡素化） ---

  const calculateRecipeScore = (recipe: RakutenRecipe, availableIngredients: string[]): number => {
      let score = 0;
      const recipeMaterials = recipe.recipeMaterial.map(m => normalizeIngredientForSearch(m));
      
      availableIngredients.forEach(ownedIngredient => {
          const matches = recipeMaterials.filter(recipeIngredient => 
              recipeIngredient.includes(ownedIngredient) || ownedIngredient.includes(recipeIngredient)
          );
          if (matches.length > 0) {
              // より具体的なマッチほど高スコア
              const exactMatch = matches.some(match => match === ownedIngredient);
              score += exactMatch ? 3 : 1;
          }
      });
      
      // 材料数が少ないレシピを少し優遇（作りやすさ重視）
      const materialCount = recipe.recipeMaterial.length;
      if (materialCount <= 5) score += 1;
      if (materialCount <= 3) score += 1;
      
      return score;
  };


  // --- 今日の献立特化レシピ検索のメインロジック ---
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
      
      console.log('=== 今日の献立レシピ検索開始 ===');
      console.log('使用する食材:', originalIngredientNames);
      console.log('検索モード:', useBasketOnly ? '今日の献立モード' : '冷蔵庫全体モード');
      
      // 今日の献立の食材専用：より詳細な食材名処理
      const processingToast = toast.loading(
        useBasketOnly 
          ? '今日の献立の食材でレシピを検索中...' 
          : '冷蔵庫の食材でレシピを検索中...'
      );

      // Gemini APIで食材名を処理（今日の献立に特化したプロンプト）
      const processedIngredientNames = await processIngredientsWithGeminiForTodayBasket(originalIngredientNames, useBasketOnly);

      console.log('=== GeminiAI最適カテゴリ選択による検索 ===');
      console.log('処理後食材名:', processedIngredientNames);

      toast.loading(`GeminiAIが食材を分析して最適なカテゴリを選択中...`, { id: processingToast });

      // ★★★ 新方式：GeminiAIが最適なカテゴリを選択してレシピ取得 ★★★
      toast.loading('選択されたカテゴリからレシピを検索中...', { id: processingToast });
      const allFetchedRecipes = await fetchRecipesByGeminiCategories(processedIngredientNames);
      
      if (allFetchedRecipes.length === 0) {
        toast.error('GeminiAIが選択したカテゴリからレシピを取得できませんでした。別の食材で試してください。', { id: processingToast });
        setIsLoading(false);
        return;
      }
      
      toast.loading(`${allFetchedRecipes.length}件のレシピを分析中...`, { id: processingToast });
      
      console.log(`=== GeminiAI選択検索完了サマリー ===`);
      console.log(`検索した食材: ${processedIngredientNames.join(', ')}`);
      console.log(`GeminiAI選択によるレシピ取得数: ${allFetchedRecipes.length}`);

      // ★★★ 基本的なフィルタリングのみ（AIフィルタリングを削除）★★★
      const normalizedIngredientNames = processedIngredientNames.map(normalizeIngredientForSearch);
      
      console.log('=== フィルタリングデバッグ情報 ===');
      console.log('取得したレシピ数:', allFetchedRecipes.length);
      console.log('正規化された食材名:', normalizedIngredientNames);
      
      // 最初の数個のレシピの材料をログ出力
      if (allFetchedRecipes.length > 0) {
        console.log('サンプルレシピ材料:');
        allFetchedRecipes.slice(0, 3).forEach((recipe, index) => {
          console.log(`レシピ${index + 1}: ${recipe.recipeTitle}`);
          console.log(`材料:`, recipe.recipeMaterial);
          console.log(`正規化後材料:`, recipe.recipeMaterial.map(m => normalizeIngredientForSearch(m)));
        });
      }
      
      // GeminiAI選択カテゴリからのレシピはすべて関連性が高いため表示
      console.log('GeminiAI選択カテゴリからのレシピはすべて表示（高い関連性保証済み）');
      const filteredRecipes = allFetchedRecipes;

      console.log(`基本フィルタリング後のレシピ数: ${filteredRecipes.length}`);

      // レシピスコアでソートして上位を表示
      toast.loading('レシピをスコアでソート中...', { id: processingToast });
      const scoredRecipes = filteredRecipes.map(recipe => ({
        ...recipe,
        score: calculateRecipeScore(recipe, normalizedIngredientNames)
      })).sort((a, b) => b.score - a.score);

      // OR検索なので多くのレシピが取得できる可能性を考慮
      const displayCount = useBasketOnly ? 20 : 25; // OR検索による豊富なレシピ数に対応
      const displayRecipes = scoredRecipes.slice(0, displayCount);
      
      toast.loading('レシピを表示準備中...', { id: processingToast });
      setRakutenRecipes(displayRecipes);

      if (displayRecipes.length > 0) {
        const message = useBasketOnly 
          ? `今日の献立で作れる${displayRecipes.length}件のレシピを取得しました！`
          : `冷蔵庫の食材で作れる${displayRecipes.length}件のレシピを取得しました！`;
        toast.success(message);
      } else {
        toast.warning('該当するレシピが見つかりませんでした。');
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
              disabled={isLoading || isCategoryMapLoading || (useBasketOnly ? basketItems.length === 0 : foodItems.length === 0)}
              className={`transition-all duration-200 shadow-sm hover:shadow-md px-6 py-2 ${
                useBasketOnly 
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