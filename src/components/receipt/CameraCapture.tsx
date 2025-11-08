/**
 * カメラキャプチャーコンポーネント
 *
 * Webcamを使用したレシート撮影機能
 */

import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
            videoConstraints={{
              facingMode: 'environment'
            }}
          />
          {/* カメラガイドライン */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="border-2 border-brand-400 border-dashed rounded-lg m-4 h-[calc(100%-2rem)]" />
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            キャンセル
          </Button>
          <Button
            onClick={handleCapture}
            className="flex-1 bg-brand-600 hover:bg-brand-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            撮影
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CameraCapture;
