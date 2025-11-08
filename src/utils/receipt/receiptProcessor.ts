/**
 * レシート画像処理ユーティリティ
 *
 * このモジュールは以下の機能を提供します：
 * - 画像のBase64変換
 * - ファイルサイズのバリデーション
 * - 画像形式のチェック
 */

/**
 * FileをBase64文字列に変換
 *
 * @param file - 変換するファイル
 * @returns Base64エンコードされた文字列（data:スキーム付き）
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Base64文字列から画像タイプを抽出
 *
 * @param base64 - Base64エンコードされた画像データ
 * @returns 画像のMIMEタイプ（例: 'image/jpeg'）
 */
export const extractImageType = (base64: string): string => {
  const match = base64.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Base64文字列からデータ部分のみを抽出
 *
 * @param base64 - Base64エンコードされた画像データ
 * @returns データ部分のみのBase64文字列
 */
export const extractBase64Data = (base64: string): string => {
  return base64.split(',')[1];
};

/**
 * ファイルサイズの検証
 *
 * @param file - 検証するファイル
 * @param maxSizeMB - 最大サイズ（MB）
 * @returns サイズが適切な場合true
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 画像ファイル形式の検証
 *
 * @param file - 検証するファイル
 * @returns サポートされている形式の場合true
 */
export const validateImageFormat = (file: File): boolean => {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return supportedFormats.includes(file.type);
};

/**
 * WebcamスクリーンショットをFileオブジェクトに変換
 *
 * @param imageSrc - WebcamのgetScreenshot()で取得したBase64画像
 * @returns Fileオブジェクト
 */
export const webcamImageToFile = async (imageSrc: string): Promise<File> => {
  const blob = await fetch(imageSrc).then(res => res.blob());
  return new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
};
