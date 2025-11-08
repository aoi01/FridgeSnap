/**
 * ファイルアップロードセクションコンポーネント
 *
 * レシート画像のファイルアップロードとカメラ起動UI
 */

import React, { useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadSectionProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraClick: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileSelect,
  onCameraClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900">
            レシートをスキャン
          </h3>
          <p className="text-sm text-neutral-600">
            レシートの写真を撮るか、画像をアップロードしてください
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onCameraClick}
            className="bg-brand-600 hover:bg-brand-700 text-white h-24 flex-col space-y-2"
          >
            <Camera className="h-8 w-8" />
            <span>カメラで撮影</span>
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-brand-300 text-brand-600 hover:bg-brand-50 h-24 flex-col space-y-2"
          >
            <Upload className="h-8 w-8" />
            <span>ファイル選択</span>
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />

        <p className="text-xs text-neutral-500">
          対応形式: JPG, PNG, WebP（最大10MB）
        </p>
      </div>
    </Card>
  );
};

export default FileUploadSection;
