/**
 * レシートスキャナーコンポーネント
 *
 * カメラ撮影/ファイルアップロードからGemini AI解析までを統合
 */

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CameraCapture from '@/components/receipt/CameraCapture';
import FileUploadSection from '@/components/receipt/FileUploadSection';
import { FoodItem } from '@/types/food';
import { analyzeReceiptWithGemini } from '@/hooks/useGeminiReceiptAnalysis';
import { webcamImageToFile } from '@/utils/receipt/receiptProcessor';

interface ReceiptScannerProps {
  onItemsScanned: (items: FoodItem[]) => void;
  onClose: () => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onItemsScanned,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const processReceiptImage = async (file: File) => {
    setIsLoading(true);

    try {
      const items = await analyzeReceiptWithGemini(file);

      if (items.length === 0) {
        toast.warning('食品が見つかりませんでした');
        return;
      }

      toast.success(`${items.length}個の食品を検出しました`);
      onItemsScanned(items);
      onClose();
    } catch (error) {
      console.error('レシート処理エラー:', error);
      toast.error(
        error instanceof Error ? error.message : 'レシートの処理に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async (imageSrc: string) => {
    try {
      const file = await webcamImageToFile(imageSrc);
      await processReceiptImage(file);
      setShowCamera(false);
    } catch (error) {
      toast.error('写真の処理に失敗しました');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processReceiptImage(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-neutral-900">
            レシートスキャン
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-brand-600 mx-auto mb-4" />
              <p className="text-neutral-600">レシートを解析中...</p>
              <p className="text-sm text-neutral-500 mt-2">
                しばらくお待ちください
              </p>
            </div>
          ) : showCamera ? (
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={() => setShowCamera(false)}
            />
          ) : (
            <FileUploadSection
              onFileSelect={handleFileSelect}
              onCameraClick={() => setShowCamera(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
