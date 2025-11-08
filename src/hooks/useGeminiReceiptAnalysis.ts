/**
 * Gemini API レシート解析カスタムフック
 *
 * このフックは以下の機能を提供します：
 * - Gemini APIを使用したレシート画像の解析
 * - 食品情報の抽出と構造化
 * - カテゴリ別の賞味期限推定
 */

import { FoodItem, FoodCategory } from '@/types/food';
import { FOOD_CATEGORIES, DEFAULT_EXPIRY_DAYS_BY_CATEGORY } from '@/constants';
import { extractJsonFromText, safeJsonParse, validateReceiptData, validateItemFields } from '@/utils/receipt/jsonParser';
import { fileToBase64, extractBase64Data } from '@/utils/receipt/receiptProcessor';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Gemini APIプロンプトを生成
 */
const generatePrompt = (): string => {
  return `あなたはレシート画像から食品情報を抽出する専門AIです。以下の指示に従って、正確にJSON形式で情報を返してください。

## 重要な指示
1. **食品のみ抽出**: 日用品、雑貨、医薬品、書籍等は除外してください
2. **正確な読み取り**: 商品名と価格は画像から正確に読み取ってください
3. **カテゴリ分類**: 商品名から適切なカテゴリを推測してください
4. **数量の推測**: 商品名に「2個」「3本」などの記載があれば、その数量を抽出してください

## 出力形式（必ずこの形式で）
\`\`\`json
{
  "items": [
    {
      "name": "商品名（正確に）",
      "category": "野菜|肉類|魚類|乳製品|調味料|パン|麺類|冷凍食品|その他のいずれか",
      "quantity": 数量（整数、デフォルト1）,
      "price": 価格（整数、税込み）,
      "estimatedExpiryDays": 推定賞味期限日数
    }
  ]
}
\`\`\`

## カテゴリ分類の基準
- **野菜**: トマト、キャベツ、レタス、人参、玉ねぎ、きのこ類など
- **肉類**: 牛肉、豚肉、鶏肉、ひき肉、ハム、ソーセージなど
- **魚類**: 魚、刺身、海老、イカ、貝類など
- **乳製品**: 牛乳、ヨーグルト、チーズ、バター、卵など
- **調味料**: 醤油、味噌、砂糖、塩、油、ドレッシング、スパイスなど
- **パン**: 食パン、菓子パン、ロールパンなど
- **麺類**: 米、パスタ、うどん、そば、ラーメン、そうめんなど
- **冷凍食品**: 冷凍野菜、冷凍肉、冷凍魚、アイスなど
- **その他**: 上記に当てはまらない食品

## 推定賞味期限の基準
- 野菜: 5日
- 肉類（生鮮）: 3日
- 肉類（加工品）: 10日
- 魚類（生鮮）: 2日
- 魚類（加工品）: 7日
- 乳製品: 7日
- 卵: 14日
- パン: 3日
- 麺類（米・パスタ・乾麺）: 180日
- 調味料: 365日
- 冷凍食品: 60日
- その他: 7日

## 注意事項
- レシートが不鮮明な場合でも、読み取れる範囲で情報を抽出してください
- 商品名に数量が含まれる場合（例：「トマト 2個」）は、quantityに反映してください
- 価格が不明な場合は0を設定してください
- 必ずJSON形式のみを返してください（説明文は不要）`;
};

/**
 * Gemini APIを使用してレシートを解析
 *
 * @param file - 解析する画像ファイル
 * @returns 抽出された食品アイテムの配列
 */
export const analyzeReceiptWithGemini = async (file: File): Promise<FoodItem[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini APIキーが設定されていません');
  }

  // 画像をBase64に変換
  const base64 = await fileToBase64(file);
  const base64Data = extractBase64Data(base64);

  // Gemini API呼び出し
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: generatePrompt() },
            { inline_data: { mime_type: file.type, data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          topP: 0.95,
          topK: 40
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('APIからの応答が不正です');
  }

  // JSONを抽出してパース
  const jsonString = extractJsonFromText(content);
  const parsedData = safeJsonParse(jsonString);
  validateReceiptData(parsedData);

  // FoodItem配列に変換
  return parsedData.items
    .filter(validateItemFields)
    .map((item: any) => convertToFoodItem(item));
};

/**
 * APIレスポンスアイテムをFoodItemに変換
 */
const convertToFoodItem = (item: any): FoodItem => {
  const purchaseDate = new Date();
  const validCategories = [...FOOD_CATEGORIES];

  // カテゴリのバリデーション
  let category: FoodCategory = item.category;
  if (!validCategories.includes(category)) {
    console.warn(`無効なカテゴリ "${category}" を "その他" に変更:`, item.name);
    category = 'その他';
  }

  // 賞味期限日数の設定（AI推定 > カテゴリデフォルト）
  const expiryDays = typeof item.estimatedExpiryDays === 'number' && item.estimatedExpiryDays > 0
    ? item.estimatedExpiryDays
    : DEFAULT_EXPIRY_DAYS_BY_CATEGORY[category];

  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  return {
    id: `${Date.now()}-${Math.random()}`,
    name: item.name,
    category,
    quantity: item.quantity || 1,
    price: item.price || 0,
    purchaseDate: purchaseDate.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    isInBasket: false
  };
};
