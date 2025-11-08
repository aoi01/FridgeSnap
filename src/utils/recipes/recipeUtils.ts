/**
 * レシピユーティリティ
 *
 * レシピ表示に関する設定と補助関数
 */

/**
 * 難易度設定
 */
export const getDifficultyConfig = (difficulty: '簡単' | '普通' | '難しい') => {
  const configs = {
    '簡単': { color: 'bg-emerald-100 text-emerald-700', icon: '✨' },
    '普通': { color: 'bg-amber-100 text-amber-700', icon: '👨‍🍳' },
    '難しい': { color: 'bg-rose-100 text-rose-700', icon: '🔥' }
  };
  return configs[difficulty];
};

/**
 * 食材名から不要な情報を削除
 */
export const cleanIngredientName = (name: string): string => {
  return name.replace(/\(.+?\)/g, '').trim();
};

/**
 * レシピの展開状態を切り替え
 */
export const toggleRecipeExpansion = (
  recipeId: string,
  currentExpanded: string | null
): string | null => {
  return currentExpanded === recipeId ? null : recipeId;
};
