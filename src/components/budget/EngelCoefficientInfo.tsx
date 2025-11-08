/**
 * エンゲル係数説明コンポーネント
 *
 * エンゲル係数の意味と各ステータスの説明を表示
 */

import React from 'react';

const EngelCoefficientInfo: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <h4 className="text-sm font-semibold text-neutral-900 mb-2">エンゲル係数について</h4>
      <div className="text-xs text-neutral-600 space-y-1">
        <p>
          • <span className="text-success-600 font-medium">理想的 (20%以下)</span>
          : 食費が適正で、バランスの良い家計管理
        </p>
        <p>
          • <span className="text-warning-600 font-medium">標準 (20-25%)</span>
          : 一般的な日本の家庭の食費割合
        </p>
        <p>
          • <span className="text-danger-600 font-medium">高め (25%超)</span>
          : 食費の見直しや節約を検討することをおすすめ
        </p>
      </div>
    </div>
  );
};

export default EngelCoefficientInfo;
