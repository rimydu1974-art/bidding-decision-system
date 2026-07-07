'use client';

import React, { useState } from 'react';
import { ObjectiveScoreWarning as ObjectiveScoreWarningType } from '@/types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ObjectiveScoreWarningProps {
  data: ObjectiveScoreWarningType;
  onConfirm?: (confirmed: boolean) => void;
}

export function ObjectiveScoreWarning({ data, onConfirm }: ObjectiveScoreWarningProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!data.triggered) {
    return null;
  }

  const handleConfirm = () => {
    setConfirmed(!confirmed);
    onConfirm?.(!confirmed);
  };

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <span className="font-medium text-orange-800">评分结构风险提示</span>
      </div>
      
      <div className="rounded-lg bg-white p-4 border border-orange-100">
        {/* 评分结构分析 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 mb-2">评分结构分析：</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-blue-600">客观分</div>
              <div className="text-lg font-bold text-blue-700">{data.analysis.objectiveScore}分</div>
              <div className="text-xs text-blue-500">≤{data.condition.threshold}分触发提示</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-sm text-orange-600">主观分</div>
              <div className="text-lg font-bold text-orange-700">{data.analysis.subjectiveScore}分</div>
              <div className="text-xs text-orange-500">占比较高</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-green-600">价格分</div>
              <div className="text-lg font-bold text-green-700">{data.analysis.priceScore}分</div>
            </div>
          </div>
        </div>

        {/* 风险说明 */}
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div className="text-sm font-medium text-orange-800 mb-1">风险说明：</div>
          <p className="text-sm text-orange-700">{data.message}</p>
        </div>

        {/* 建议 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-blue-800 mb-1">建议：</div>
          <p className="text-sm text-blue-700">{data.suggestion}</p>
        </div>

        {/* 确认勾选 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={handleConfirm}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">我已了解风险，确认继续投标</span>
        </label>
      </div>
    </div>
  );
}
