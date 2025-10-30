/**
 * localStorage を React の状態管理と統合するカスタムフック
 *
 * このフックは以下の機能を提供します：
 * - localStorage への値の自動保存
 * - コンポーネントマウント時の値の自動読み込み
 * - JSON シリアライズ/デシリアライズの自動処理
 * - エラーハンドリング
 */

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * localStorage を使用した永続化状態管理フック
 *
 * useState と同じインターフェースを提供しますが、
 * 値の変更が自動的に localStorage に保存されます。
 *
 * @template T - 保存する値の型
 * @param key - localStorage のキー
 * @param initialValue - 初期値（localStorage に値がない場合に使用）
 * @returns [値, 値を更新する関数] のタプル（useState と同じ）
 *
 * @example
 * ```typescript
 * // 基本的な使用方法
 * const [name, setName] = useLocalStorage<string>('userName', 'Anonymous');
 *
 * // オブジェクトの保存
 * const [user, setUser] = useLocalStorage<User>('user', { id: '', name: '' });
 *
 * // 配列の保存
 * const [items, setItems] = useLocalStorage<Item[]>('items', []);
 * ```
 *
 * @remarks
 * - localStorage が利用できない環境では、メモリ上での状態管理にフォールバックします
 * - JSON でシリアライズできない値（関数、Symbol など）は保存できません
 * - 同じキーを複数のコンポーネントで使用する場合、同期は自動的には行われません
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  /**
   * 初期値を取得する関数
   * localStorage から値を読み込むか、初期値を使用する
   */
  const [storedValue, setStoredValue] = useState<T>(() => {
    // サーバーサイドレンダリング対応
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // localStorage から値を取得
      const item = window.localStorage.getItem(key);

      // 値が存在する場合は JSON パース、存在しない場合は初期値を使用
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // JSON パースエラーまたは localStorage エラーの場合
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * 値を更新する関数
   * localStorage への保存も同時に行う
   */
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      // 関数形式の更新もサポート（setState と同じ）
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // 状態を更新
      setStoredValue(valueToStore);

      // localStorage に保存
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // localStorage への保存エラー（容量オーバーなど）
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  /**
   * 他のタブでの変更を検知して同期する
   * （同一ドメインの別タブで値が変更された場合）
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 対象のキーの変更のみ処理
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    // storage イベントリスナーを登録
    window.addEventListener('storage', handleStorageChange);

    // クリーンアップ
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

/**
 * localStorage から値を削除するユーティリティ関数
 *
 * @param key - 削除する localStorage のキー
 *
 * @example
 * ```typescript
 * removeFromLocalStorage('userName');
 * ```
 */
export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

/**
 * localStorage の全てのキーを取得するユーティリティ関数
 *
 * @returns localStorage に保存されているキーの配列
 *
 * @example
 * ```typescript
 * const keys = getLocalStorageKeys();
 * console.log(keys); // => ['userName', 'userSettings', ...]
 * ```
 */
export function getLocalStorageKeys(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return Object.keys(window.localStorage);
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
}

/**
 * localStorage の容量使用状況を取得するユーティリティ関数
 *
 * @returns 使用中のバイト数（概算）
 *
 * @example
 * ```typescript
 * const usedBytes = getLocalStorageSize();
 * console.log(`Used: ${(usedBytes / 1024).toFixed(2)} KB`);
 * ```
 */
export function getLocalStorageSize(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    let totalSize = 0;
    for (const key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        const value = window.localStorage.getItem(key);
        if (value) {
          // キーと値の両方のサイズを計算（UTF-16 エンコーディングを想定）
          totalSize += key.length + value.length;
        }
      }
    }
    // 1文字 = 2バイトとして計算
    return totalSize * 2;
  } catch (error) {
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
}
