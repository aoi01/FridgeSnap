
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

import Webcam from 'react-webcam';

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

// 環境変数からAPIキーを取得（セキュリティ向上）
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const RAKUTEN_API_KEY = import.meta.env.VITE_RAKUTEN_API_KEY || 'YOUR_RAKUTEN_API_KEY_HERE';
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
                text: `レシートから食品のみを抽出し、以下のJSONで返してください：
{"items":[{"name":"商品名","category":"野菜|肉類|魚類|乳製品|調味料|パン・米類|冷凍食品|その他","quantity":1,"price":価格,"estimatedExpiryDays":賞味期限日数}]}

食品以外は無視。価格と商品名は正確に読み取り。賞味期限目安：野菜5日、肉3日、乳製品7日、冷凍食品60日、調味料300日`
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
            temperature: 0.1,
            maxOutputTokens: 2048
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
