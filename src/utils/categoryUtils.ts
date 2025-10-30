/**
 * カテゴリ関連のユーティリティ関数
 *
 * このモジュールは食材カテゴリに関連する以下の機能を提供します：
 * - カテゴリアイコンのマッピング
 * - カテゴリカラーのマッピング
 * - カテゴリ関連のヘルパー関数
 */

import { ComponentType } from 'react';
import { IoLeaf, IoFish, IoSnow } from 'react-icons/io5';
import { TbMeat } from 'react-icons/tb';
import { LuMilk } from 'react-icons/lu';
import { GiSaltShaker } from 'react-icons/gi';
import { RiBreadLine } from 'react-icons/ri';
import { FiAlignJustify } from 'react-icons/fi';
import { FoodCategory } from '@/constants';

/**
 * カテゴリごとのアイコンマッピング
 * 各食材カテゴリに対応するReactアイコンコンポーネントを定義
 */
export const CATEGORY_ICONS: Record<FoodCategory, ComponentType<{ className?: string }>> = {
  '野菜': IoLeaf,
  '肉類': TbMeat,
  '魚類': IoFish,
  '乳製品': LuMilk,
  '調味料': GiSaltShaker,
  'パン・米類': RiBreadLine,
  '冷凍食品': IoSnow,
  'その他': FiAlignJustify,
};

/**
 * カテゴリカラーの型定義
 */
interface CategoryColors {
  /** 背景色のTailwind CSSクラス */
  bg: string;
  /** テキスト色のTailwind CSSクラス */
  text: string;
}

/**
 * カテゴリごとのカラーマッピング
 * 各食材カテゴリに対応する背景色とテキスト色を定義
 */
export const CATEGORY_COLORS: Record<FoodCategory, CategoryColors> = {
  '野菜': { bg: 'bg-green-50', text: 'text-green-600' },
  '肉類': { bg: 'bg-red-50', text: 'text-red-600' },
  '魚類': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '乳製品': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  '調味料': { bg: 'bg-purple-50', text: 'text-purple-600' },
  'パン・米類': { bg: 'bg-orange-50', text: 'text-orange-600' },
  '冷凍食品': { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'その他': { bg: 'bg-gray-50', text: 'text-gray-600' },
};

/**
 * カテゴリに対応するアイコンコンポーネントを取得する
 *
 * @param category - 食材カテゴリ
 * @returns 対応するReactアイコンコンポーネント
 *
 * @example
 * ```tsx
 * const IconComponent = getCategoryIcon('野菜');
 * return <IconComponent className="w-5 h-5" />;
 * ```
 */
export const getCategoryIcon = (category: FoodCategory): ComponentType<{ className?: string }> => {
  return CATEGORY_ICONS[category];
};

/**
 * カテゴリに対応するカラー情報を取得する
 *
 * @param category - 食材カテゴリ
 * @returns 背景色とテキスト色を含むオブジェクト
 *
 * @example
 * ```tsx
 * const { bg, text } = getCategoryColors('野菜');
 * return <div className={`${bg} ${text}`}>野菜</div>;
 * ```
 */
export const getCategoryColors = (category: FoodCategory): CategoryColors => {
  return CATEGORY_COLORS[category];
};

/**
 * カテゴリが有効かどうかをチェックする
 *
 * @param category - チェックするカテゴリ文字列
 * @returns カテゴリが有効な場合はtrue、それ以外はfalse
 *
 * @example
 * ```typescript
 * if (isValidCategory('野菜')) {
 *   // 野菜カテゴリの処理
 * }
 * ```
 */
export const isValidCategory = (category: string): category is FoodCategory => {
  return category in CATEGORY_ICONS;
};
