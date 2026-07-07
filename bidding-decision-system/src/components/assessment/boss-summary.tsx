'use client';

import React from 'react';
import { BossSummary as BossSummaryType } from '@/types';
import { Lock, TrendingUp, AlertTriangle, FileText, Calendar } from 'lucide-react';

interface BossSummaryProps {
  data: BossSummaryType;
  isPaid: boolean;
  onUnlock?: () => void;
}

export function BossSummary({ data, isPaid, onUnlock }: BossSummaryProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">老板总结</h3>
        {!isPaid && (
          <button
            onClick={onUnlock}
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            <Lock className="h-3 w-3" />
            解锁完整分析
          </button>
        )}
      </div>

      {/* 项目基本信息 */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600">项目名称：</span>
          <span className="text-sm font-medium text-gray-900">{data.projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-600">预算：</span>
          <span className="text-sm font-medium text-gray-900">{data.budget}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-gray-600">资质要求：</span>
          <span className="text-sm font-medium text-gray-900">{data.qualificationStatus}</span>
        </div>
      </div>

      {/* 评分结构 */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3">
        <div className="text-xs font-medium text-gray-500 mb-2">评分结构</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">技术</span>
            <span className="text-sm font-bold text-blue-600">{data.scoringStructure.technical}分</span>
          </div>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">商务</span>
            <span className="text-sm font-bold text-green-600">{data.scoringStructure.commercial}分</span>
          </div>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">价格</span>
            <span className="text-sm font-bold text-orange-600">{data.scoringStructure.price}分</span>
          </div>
        </div>
      </div>

      {/* 免费版：统计数据 */}
      {!isPaid && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">关键提醒</span>
            <span className="font-medium text-gray-900">{data.keyWarnings?.length || 0}条</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">关键词分析</span>
            <span className="font-medium text-gray-900">待解锁</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">准备重点</span>
            <span className="font-medium text-gray-900">{data.preparationFocus?.length || 0}条</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">资质状态</span>
            <span className="font-medium text-gray-900">{data.qualificationStatus || '待上传'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">评分结构</span>
            <span className="font-medium text-gray-900">技术{data.scoringStructure.technical}分 / 商务{data.scoringStructure.commercial}分 / 价格{data.scoringStructure.price}分</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">风险评估</span>
            <span className="font-medium text-gray-900">{data.riskCount}条</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">准备分工项目包</span>
            <span className="font-medium text-gray-900">{data.checklistCount}项</span>
          </div>
        </div>
      )}

      {/* 付费版：结论+实际内容 */}
      {isPaid && data.conclusion && (
        <>
          {/* 结论 */}
          <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <div className="text-xs font-medium text-blue-600 mb-1">结论</div>
            <div className="text-lg font-bold text-blue-900">{data.conclusion}</div>
          </div>

          {/* 关键提醒 */}
          {data.keyWarnings && data.keyWarnings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-500 mb-2">关键提醒</div>
              <div className="space-y-1">
                {data.keyWarnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span className="text-gray-700">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 准备重点 */}
          {data.preparationFocus && data.preparationFocus.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">准备重点</div>
              <div className="space-y-1">
                {data.preparationFocus.map((focus, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-gray-700">{focus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 付费版解锁提示按钮 */}
      {!isPaid && (
        <div className="mt-4 rounded-lg border border-dashed border-purple-300 bg-purple-50 p-4 text-center">
          <Lock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <p className="text-sm text-purple-700 mb-2">深度分析结果已生成</p>
          <p className="text-xs text-purple-500 mb-3">
            包含：废标风险、评分关键项、容易失分项、投标策略建议
          </p>
          <button
            onClick={onUnlock}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            解锁本项目 ¥19
          </button>
        </div>
      )}
    </div>
  );
}
