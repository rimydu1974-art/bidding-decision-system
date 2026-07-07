'use client';

import React from 'react';
import { BidSuggestion as BidSuggestionType } from '@/types';
import { Award, AlertTriangle, CheckCircle, XCircle, Upload } from 'lucide-react';

interface BidSuggestionProps {
  data: BidSuggestionType;
  isPaid: boolean;
  onUnlock?: () => void;
}

export function BidSuggestion({ data, isPaid, onUnlock }: BidSuggestionProps) {
  if (!isPaid) {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-6 text-center">
        <Award className="h-8 w-8 text-purple-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-purple-700 mb-2">投标策略建议</p>
        <p className="text-xs text-purple-500 mb-4">解锁后查看完整建议</p>
        <button
          onClick={onUnlock}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          解锁本项目 ¥19
        </button>
      </div>
    );
  }

  // 资料不全时显示条件化建议
  if (!data.available) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="font-medium text-orange-800">投标策略建议</span>
        </div>
        <div className="rounded-lg bg-white p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">资料不全，无法生成完整建议</span>
          </div>
          
          {data.reason && (
            <div className="mb-3 text-sm text-gray-600">{data.reason}</div>
          )}
          
          {data.conditionalSuggestion && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-800 mb-2">条件化建议：</div>
              <p className="text-sm text-blue-700">{data.conditionalSuggestion}</p>
            </div>
          )}
          
          <button
            onClick={onUnlock}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            上传资质材料后重新分析
          </button>
        </div>
      </div>
    );
  }

  // 资料完整时显示完整建议
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-green-500" />
        <span className="font-medium text-green-800">投标策略建议</span>
      </div>
      
      <div className="rounded-lg bg-white p-4 border border-green-100">
        {/* 建议等级 */}
        {data.level && data.score && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="text-lg font-bold" style={{ color: data.color }}>
              建议等级：{data.level}-{data.label}（{data.score}分）
            </div>
          </div>
        )}

        {/* 评分依据 */}
        {data.scoreBreakdown && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">评分依据：</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">资质匹配度</span>
                <span className="text-sm font-medium text-gray-900">{data.scoreBreakdown.qualificationMatch}/30分</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">业绩匹配度</span>
                <span className="text-sm font-medium text-gray-900">{data.scoreBreakdown.performanceMatch}/25分</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">技术可行性</span>
                <span className="text-sm font-medium text-gray-900">{data.scoreBreakdown.technicalFeasibility}/20分</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">价格竞争力</span>
                <span className="text-sm font-medium text-gray-900">{data.scoreBreakdown.priceCompetitiveness}/15分</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">团队配置</span>
                <span className="text-sm font-medium text-gray-900">{data.scoreBreakdown.teamConfiguration}/10分</span>
              </div>
            </div>
          </div>
        )}

        {/* 建议理由 */}
        {data.reasons && data.reasons.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">建议理由：</div>
            <div className="space-y-1">
              {data.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 重点准备 */}
        {data.keyPreparations && data.keyPreparations.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">重点准备：</div>
            <div className="space-y-1">
              {data.keyPreparations.map((prep, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-gray-700">{prep}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 风险提示 */}
        {data.riskWarnings && data.riskWarnings.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">⚠️ 风险提示：</div>
            <div className="space-y-1">
              {data.riskWarnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-orange-600">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
