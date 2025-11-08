/**
 * JSON解析ユーティリティ
 *
 * このモジュールは以下の機能を提供します：
 * - Gemini API応答からのJSON抽出
 * - マークダウンコードブロックの除去
 * - JSON構造の検証
 */

/**
 * テキストからJSON文字列を抽出
 *
 * マークダウンのコードブロックや余分なテキストを除去し、
 * JSONオブジェクトのみを抽出します。
 *
 * @param text - 解析するテキスト
 * @returns 抽出されたJSON文字列
 * @throws JSON構造が見つからない場合
 */
export const extractJsonFromText = (text: string): string => {
  let jsonString = text;

  // マークダウンのコードブロックを削除
  jsonString = jsonString.replace(/```json\s*|\s*```/g, '');
  jsonString = jsonString.replace(/```\s*|\s*```/g, '');

  // JSONの開始と終了を見つける
  const startIndex = jsonString.indexOf('{');
  const lastIndex = jsonString.lastIndexOf('}');

  if (startIndex === -1 || lastIndex === -1) {
    throw new Error('JSON構造が見つかりませんでした');
  }

  return jsonString.substring(startIndex, lastIndex + 1);
};

/**
 * JSON文字列を安全にパース
 *
 * @param jsonString - パースするJSON文字列
 * @returns パースされたオブジェクト
 * @throws パースに失敗した場合
 */
export const safeJsonParse = <T = any>(jsonString: string): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Failed to parse:', jsonString);
    throw new Error('JSON解析に失敗しました');
  }
};

/**
 * レシートデータ構造の検証
 *
 * @param data - 検証するデータ
 * @returns 検証に成功した場合true
 * @throws データ構造が不正な場合
 */
export const validateReceiptData = (data: any): boolean => {
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('items配列が存在しません');
  }

  if (data.items.length === 0) {
    throw new Error('食品アイテムが見つかりませんでした');
  }

  return true;
};

/**
 * アイテムの必須フィールドを検証
 *
 * @param item - 検証するアイテム
 * @returns 検証に成功した場合true
 */
export const validateItemFields = (item: any): boolean => {
  if (!item.name || typeof item.name !== 'string') {
    console.warn('商品名が不正なアイテムをスキップ:', item);
    return false;
  }
  return true;
};
