
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  price: number;
  isInBasket: boolean;
  image?: string;
}

interface ReceiptScannerProps {
  onItemsScanned: (items: FoodItem[]) => void;
  onClose: () => void;
}

// 内部でAPIキーを管理
const GEMINI_API_KEY = 'AIzaSyDxKvQOuGk4tJFGvQzQzQwQzQzQzQzQzQz'; // 実際のAPIキーに置き換えてください

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onItemsScanned,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processReceiptImage(file);
  };

  const processReceiptImage = async (file: File) => {
    setIsLoading(true);
    
    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);
      
      // Call Gemini API to analyze receipt
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `このレシートの画像を詳細に分析して、食品・食材のみを特定してください。非食品（洗剤、ティッシュ、薬品など）は完全に除外してください。

各食品アイテムについて以下の情報をJSONフォーマットで返してください：

{
  "items": [
    {
      "name": "具体的な商品名（日本語、略語ではなく正式な食材名）",
      "category": "適切なカテゴリ（野菜、肉類、魚類、乳製品、調味料、パン・米類、冷凍食品、その他）",
      "quantity": 数量または1,
      "price": 正確な価格,
      "estimatedExpiryDays": 食材の種類に基づく推定賞味期限日数
    }
  ]
}

重要な指示：
- 食品・食材のみを抽出し、非食品は完全に無視する
- 商品名は具体的に（例：「キャベツ」「豚バラ肉」「牛乳」）
- 賞味期限は食材の特性を考慮して設定（野菜：3-7日、肉類：2-3日、乳製品：5-10日、冷凍食品：30-90日、調味料：180-365日など）
- 価格は必ず正確に読み取る
- 不明な場合は合理的な推定値を使用`
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64.split(',')[1]
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('APIからの応答が不正です');
      }

      console.log('Gemini response:', content);

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('レシートから食品情報を抽出できませんでした');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      const items: FoodItem[] = parsedData.items.map((item: any) => {
        const purchaseDate = new Date();
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + (item.estimatedExpiryDays || 7));

        return {
          id: crypto.randomUUID(),
          name: item.name,
          category: item.category,
          purchaseDate: purchaseDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          quantity: item.quantity || 1,
          price: item.price || 0,
          isInBasket: false
        };
      });

      if (items.length === 0) {
        toast.error('レシートから食品が見つかりませんでした');
        return;
      }

      console.log('Processed items:', items);
      onItemsScanned(items);
      
    } catch (error) {
      console.error('Receipt processing error:', error);
      toast.error('レシートの処理中にエラーが発生しました');
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
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">レシートをスキャン</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50 transition-colors"
            variant="outline"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>レシートを分析中...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium">レシート画像をアップロード</span>
                <span className="text-xs text-gray-500">JPG, PNG形式対応</span>
              </div>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 使い方のコツ：</p>
            <ul className="text-xs space-y-1">
              <li>• レシート全体が映るように撮影</li>
              <li>• 文字がはっきり見えるように</li>
              <li>• 影や反射を避ける</li>
              <li>• 食品のみが自動認識されます</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReceiptScanner;
