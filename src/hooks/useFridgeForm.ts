/**
 * 冷蔵庫食材フォーム管理カスタムフック
 *
 * 新規食材追加フォームの状態管理を担当するフック
 */

import { useState } from 'react';
import { FOOD_CATEGORIES } from '@/constants';
import { FoodCategory } from '@/constants';

/**
 * 新規食材フォームのデータ型
 */
export interface FridgeFormData {
  name: string;
  category: FoodCategory;
  quantity: number;
  price: number;
  purchaseDate: string;
  expiryDate: string;
}

/**
 * フォーム初期値を生成するヘルパー関数
 */
const createInitialFormData = (category?: FoodCategory): FridgeFormData => ({
  name: '',
  category: category || FOOD_CATEGORIES[0],
  quantity: 1,
  price: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date().toISOString().split('T')[0],
});

/**
 * 冷蔵庫食材フォーム状態管理フック
 *
 * @param initialCategory - 初期カテゴリ（デフォルト：最初のカテゴリ）
 * @returns フォームデータと操作関数
 */
export const useFridgeForm = (initialCategory?: FoodCategory) => {
  const [formData, setFormData] = useState<FridgeFormData>(
    createInitialFormData(initialCategory)
  );

  /**
   * フォーム値を更新
   */
  const updateField = <K extends keyof FridgeFormData>(
    field: K,
    value: FridgeFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 複数フィールドを一度に更新
   */
  const updateFields = (updates: Partial<FridgeFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  /**
   * 賞味期限を指定日数増減
   */
  const adjustExpiryDate = (days: number) => {
    if (!formData.expiryDate) return;

    const currentDate = new Date(formData.expiryDate);
    const minDate = new Date(); // 最低今日まで

    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);

    // 最低今日までの制限をチェック
    if (newDate >= minDate) {
      setFormData(prev => ({
        ...prev,
        expiryDate: newDate.toISOString().split('T')[0]
      }));
    }
  };

  /**
   * フォームをリセット
   */
  const reset = (category?: FoodCategory) => {
    setFormData(createInitialFormData(category));
  };

  /**
   * フォームの検証
   */
  const validate = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('食材名を入力してください');
    }

    if (!formData.category) {
      errors.push('カテゴリを選択してください');
    }

    if (!formData.expiryDate) {
      errors.push('賞味期限を設定してください');
    }

    if (formData.quantity < 1) {
      errors.push('数量は1以上である必要があります');
    }

    if (formData.price < 0) {
      errors.push('価格は0以上である必要があります');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  return {
    formData,
    updateField,
    updateFields,
    adjustExpiryDate,
    reset,
    validate
  };
};
