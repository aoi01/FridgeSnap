/**
 * エンゲル係数バッジコンポーネント
 *
 * エンゲル係数の値と対応するステータスバッジを表示
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getEngelCoefficientStatus } from '@/utils/budgetUtils';

interface EngelCoefficientBadgeProps {
  /** エンゲル係数（%） */
  value: number;
}

const EngelCoefficientBadge: React.FC<EngelCoefficientBadgeProps> = ({ value }) => {
  const status = getEngelCoefficientStatus(value);

  return (
    <Badge className={`${status.color} text-xs px-2 py-1`}>
      {status.label}
    </Badge>
  );
};

export default EngelCoefficientBadge;
