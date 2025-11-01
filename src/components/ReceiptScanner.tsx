/**
 * レシートスキャナーコンポーネント
 *
 * このコンポーネントは以下の機能を提供します：
 * - カメラでレシート撮影
 * - ファイルアップロード
 * - Gemini AIによるレシート画像解析
 * - 食品情報の抽出と自動カテゴリ分類
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Webcam from 'react-webcam';

// 型定義のインポート
import { FoodItem } from '@/types/food';
import { FOOD_CATEGORIES, API_CONFIG, DEFAULT_EXPIRY_DAYS_BY_CATEGORY, FoodCategory } from '@/constants';

/**
 * ReceiptScanner コンポーネントのプロパティ
 */
interface ReceiptScannerProps {
  /** スキャンした食品アイテムのコールバック */
  onItemsScanned: (items: FoodItem[]) => void;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
}

/**
 * 環境変数からAPIキーを取得
 * セキュリティのため、.envファイルで管理
 */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onItemsScanned,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const capturePhoto = async () => {
    if (!webcamRef.current) {
      toast.error('カメラが正しく初期化されていません');
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const blob = await fetch(imageSrc).then(res => res.blob());
      await processReceiptImage(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
      setShowCamera(false);
    } else {
      toast.error('写真の撮影に失敗しました');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processReceiptImage(file);
  };

  const processReceiptImage = async (file: File) => {
    if (!GEMINI_API_KEY) {
      toast.error('Gemini APIキーが設定されていません。.envファイルを確認してください。');
      return;
    }

    console.log('API Key available:', GEMINI_API_KEY ? 'Yes' : 'No');
    console.log('API Key length:', GEMINI_API_KEY?.length || 0);
    
    setIsLoading(true);
    
    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);
      
      // Call Gemini API to analyze receipt
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `あなたはレシート画像から食品情報を抽出する専門AIです。以下の指示に従って、正確にJSON形式で情報を返してください。

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
- 必ずJSON形式のみを返してください（説明文は不要）`
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('APIからの応答が不正です');
      }

      console.log('Gemini response:', content);

      // Extract JSON from response (マークダウンのコードブロック対応)
      let jsonString = content;

      // マークダウンのコードブロックを削除
      jsonString = jsonString.replace(/```json\s*|\s*```/g, '');
      jsonString = jsonString.replace(/```\s*|\s*```/g, '');

      // JSONの開始と終了を見つける
      const startIndex = jsonString.indexOf('{');
      const lastIndex = jsonString.lastIndexOf('}');

      if (startIndex === -1 || lastIndex === -1) {
        console.error('JSON not found in response:', content);
        throw new Error('レシートから食品情報を抽出できませんでした');
      }

      jsonString = jsonString.substring(startIndex, lastIndex + 1);

      // JSONをパース
      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse:', jsonString);
        throw new Error('レシート情報の解析に失敗しました');
      }

      // データの検証
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        console.error('Invalid data structure:', parsedData);
        throw new Error('レシートデータの形式が正しくありません');
      }
      // カテゴリのバリデーション用リスト（定数から取得）
      const validCategories = [...FOOD_CATEGORIES];

      const items: FoodItem[] = parsedData.items
        .filter((item: any) => {
          // 必須フィールドのチェック
          if (!item.name || typeof item.name !== 'string') {
            console.warn('商品名が不正なアイテムをスキップ:', item);
            return false;
          }
          return true;
        })
        .map((item: any) => {
          const purchaseDate = new Date();
          const expiryDate = new Date(purchaseDate);

          // カテゴリのバリデーション（賞味期限計算より先に実施）
          let category: FoodCategory = item.category;
          if (!validCategories.includes(category)) {
            console.warn(`無効なカテゴリ "${category}" を "その他" に変更:`, item.name);
            category = 'その他';
          }

          // 賞味期限日数の設定
          // 1. AIが返したestimatedExpiryDaysを優先
          // 2. なければカテゴリごとのデフォルト値を使用
          let expiryDays: number;
          if (typeof item.estimatedExpiryDays === 'number' && item.estimatedExpiryDays > 0) {
            expiryDays = item.estimatedExpiryDays;
            console.log(`${item.name}: AI推定の賞味期限 ${expiryDays}日を使用`);
          } else {
            expiryDays = DEFAULT_EXPIRY_DAYS_BY_CATEGORY[category];
            console.log(`${item.name}: カテゴリ「${category}」のデフォルト賞味期限 ${expiryDays}日を使用`);
          }
          expiryDate.setDate(expiryDate.getDate() + expiryDays);

          // 数量のバリデーション
          let quantity = 1;
          if (typeof item.quantity === 'number' && item.quantity > 0) {
            quantity = Math.floor(item.quantity);
          } else if (typeof item.quantity === 'string') {
            const parsedQty = parseInt(item.quantity, 10);
            if (!isNaN(parsedQty) && parsedQty > 0) {
              quantity = parsedQty;
            }
          }

          // 価格のバリデーション
          let price = 0;
          if (typeof item.price === 'number' && item.price >= 0) {
            price = Math.floor(item.price);
          } else if (typeof item.price === 'string') {
            const parsedPrice = parseInt(item.price.replace(/[^\d]/g, ''), 10);
            if (!isNaN(parsedPrice) && parsedPrice >= 0) {
              price = parsedPrice;
            }
          }

          return {
            id: crypto.randomUUID(),
            name: item.name.trim(),
            category: category,
            purchaseDate: purchaseDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            quantity: quantity,
            price: price,
            isInBasket: false
          };
        });

      if (items.length === 0) {
        toast.error('レシートから食品が見つかりませんでした');
        return;
      }

      console.log('Processed items:', items);

      // 成功メッセージ
      toast.success(`${items.length}個の食品を検出しました`, {
        description: items.map(i => i.name).slice(0, 3).join(', ') + (items.length > 3 ? '...' : '')
      });

      onItemsScanned(items);

    } catch (error) {
      console.error('Receipt processing error:', error);

      // エラーの種類に応じた詳細メッセージ
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          toast.error('API接続エラー', {
            description: 'Gemini APIとの接続に失敗しました。APIキーを確認してください。'
          });
        } else if (error.message.includes('解析に失敗')) {
          toast.error('画像解析エラー', {
            description: 'レシート画像の解析に失敗しました。画像が鮮明か確認してください。'
          });
        } else if (error.message.includes('食品情報を抽出できませんでした')) {
          toast.error('食品が見つかりません', {
            description: 'レシートから食品が検出できませんでした。別の画像で試してください。'
          });
        } else {
          toast.error('処理エラー', {
            description: error.message
          });
        }
      } else {
        toast.error('レシートの処理中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className={`w-full ${showCamera ? 'max-w-6xl h-[90vh]' : 'max-w-full sm:max-w-md'} p-4 sm:p-6 bg-white border border-neutral-200 shadow-sm rounded-xl`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl font-bold">レシートをスキャン</h2>
          <Button variant="ghost" size="sm" onClick={() => { setShowCamera(false); onClose(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {showCamera ? (
          <div className="space-y-4 flex flex-col h-full">
            <div className="relative bg-black rounded-lg overflow-hidden flex-1">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: "environment" }}
              />
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-50">
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  レシートをここに合わせてください
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setShowCamera(false)}
                variant="outline"
                className="px-6"
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                onClick={capturePhoto}
                className="bg-success-600 hover:bg-success-700 text-white px-8 py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-2" />
                    撮影する
                  </>
                )}
              </Button>
            </div>
            
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => setShowCamera(true)}
                disabled={isLoading}
                className="w-full h-20 border-2 border-dashed border-brand-300 hover:border-brand-400 bg-brand-50 hover:bg-brand-100 transition-all duration-200 text-brand-700 hover:text-brand-800"
                variant="outline"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Camera className="h-6 w-6" />
                  <span className="text-sm font-medium">カメラで撮影</span>
                </div>
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full h-20 border-2 border-dashed border-success-300 hover:border-success-400 bg-success-50 hover:bg-success-100 transition-all duration-200 text-success-700 hover:text-success-800"
                variant="outline"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>レシートを分析中...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-medium">ファイルをアップロード</span>
                  </div>
                )}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

          </div>
        )}
      </Card>
    </div>
  );
};

export default ReceiptScanner;
