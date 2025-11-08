/**
 * 日付関連のユーティリティ関数モジュール
 *
 * このモジュールは以下の機能を提供します：
 * - 日付のフォーマット
 * - 相対日付の計算
 * - 日付の比較
 */

/**
 * 現在の日付を YYYY-MM-DD 形式で取得
 *
 * @returns YYYY-MM-DD 形式の日付文字列
 *
 * @example
 * ```typescript
 * const today = getTodayDate(); // => '2024-01-15'
 * ```
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 指定日数後の日付を YYYY-MM-DD 形式で取得
 *
 * @param days - 日数（正の数で未来、負の数で過去）
 * @param baseDate - 基準日（省略時は今日）
 * @returns YYYY-MM-DD 形式の日付文字列
 *
 * @example
 * ```typescript
 * const tomorrow = getDateAfterDays(1); // => '2024-01-16'
 * const yesterday = getDateAfterDays(-1); // => '2024-01-14'
 * const weekLater = getDateAfterDays(7, '2024-01-15'); // => '2024-01-22'
 * ```
 */
export const getDateAfterDays = (days: number, baseDate?: string): string => {
  const date = baseDate ? new Date(baseDate) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Date オブジェクトを YYYY-MM-DD 形式に変換
 *
 * @param date - 変換する Date オブジェクト
 * @returns YYYY-MM-DD 形式の日付文字列
 *
 * @example
 * ```typescript
 * const dateStr = formatDateToISO(new Date()); // => '2024-01-15'
 * ```
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 日付文字列を Date オブジェクトに変換（時刻を0:00:00に設定）
 *
 * @param dateStr - YYYY-MM-DD 形式の日付文字列
 * @returns 時刻が0:00:00に設定された Date オブジェクト
 *
 * @example
 * ```typescript
 * const date = parseDateString('2024-01-15');
 * // => Date object with time set to 00:00:00
 * ```
 */
export const parseDateString = (dateStr: string): Date => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * 2つの日付の差を日数で計算
 *
 * @param date1 - 比較する日付1（YYYY-MM-DD形式）
 * @param date2 - 比較する日付2（YYYY-MM-DD形式）
 * @returns date1 から date2 までの日数（date2が未来なら正の値）
 *
 * @example
 * ```typescript
 * const diff = getDaysDifference('2024-01-15', '2024-01-20'); // => 5
 * const diff = getDaysDifference('2024-01-20', '2024-01-15'); // => -5
 * ```
 */
export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = parseDateString(date1);
  const d2 = parseDateString(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 指定した日付から指定日数を加算した日付を計算（最低今日までの制限付き）
 *
 * @param dateStr - 基準となる日付（YYYY-MM-DD形式）
 * @param days - 加算する日数
 * @returns 計算結果の日付（YYYY-MM-DD形式）
 *
 * @example
 * ```typescript
 * const newDate = adjustDateWithMinimum('2024-01-15', 5); // => '2024-01-20'
 * const newDate = adjustDateWithMinimum('2024-01-15', -10); // => 今日以降の最初の日付
 * ```
 */
export const adjustDateWithMinimum = (dateStr: string, days: number): string => {
  const currentDate = new Date(dateStr);
  const minDate = new Date(); // 最低今日まで
  minDate.setHours(0, 0, 0, 0);

  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + days);

  // 最低今日までの制限をチェック
  if (newDate >= minDate) {
    return newDate.toISOString().split('T')[0];
  }

  return minDate.toISOString().split('T')[0];
};
