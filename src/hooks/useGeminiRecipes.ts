/**
 * Gemini API レシピ生成カスタムフック
 *
 * 食材からレシピを生成するGemini API統合
 */

import { extractJsonFromText, safeJsonParse } from '@/utils/receipt/jsonParser';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface GeminiRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: '簡単' | '普通' | '難しい';
  servings: string;
}

/**
 * Gemini APIでレシピを生成
 *
 * @param ingredients - 食材名の配列
 * @returns レシピの配列
 */
export const generateRecipesWithGemini = async (
  ingredients: string[]
): Promise<GeminiRecipe[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini APIキーが設定されていません');
  }

  const prompt = `以下の食材で3つのレシピを提案してください：${ingredients.join(', ')}

JSONで回答：
{"recipes":[{"name":"料理名","description":"説明","ingredients":["食材"],"instructions":["手順"],"cookingTime":"時間","difficulty":"簡単|普通|難しい","servings":"人分"}]}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Gemini APIからの応答が不正です');
  }

  console.log('Gemini API Response:', content);

  // JSONを抽出してパース
  const jsonString = extractJsonFromText(content);
  const parsedData = safeJsonParse<{ recipes: any[] }>(jsonString);

  const recipes = parsedData.recipes || [];

  // IDを追加
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `gemini-recipe-${index + 1}`
  }));
};
