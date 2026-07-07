'use client';

import React from 'react';
import { ServicePeriodAnalysis as ServicePeriodAnalysisType } from '@/types';
import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ServicePeriodAnalysisProps {
  data: ServicePeriodAnalysisType;
  userPlan: 'single' | 'pro';
}

export function ServicePeriodAnalysis({ data, userPlan }: ServicePeriodAnalysisProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-blue-500" />
        <span className="font-medium text-gray-800">服务期限分析</span>
        <span className="text-xs text-gray-500">
          （{userPlan === 'pro' ? '99元版：分析招标+投标文件' : '19元版：只分析招标文件'}）
        </span>
      </div>
      
      {/* 招标文件要求 */}
      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">招标文件要求</span>
          {data.tenderRequirement.isSubstantial && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
              ▲实质性要求
            </span>
          )}
        </div>
        <div className="text-sm text-gray-700 mb-1">
          要求服务期限：<span className="font-medium">{data.tenderRequirement.period}</span>
        </div>
        <div className="text-xs text-gray-500">
          来源：{data.tenderRequirement.source}（{data.tenderRequirement.sourcePage}）
        </div>
        <div className="mt-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            data.tenderRequirement.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
            data.tenderRequirement.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
            data.tenderRequirement.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            风险等级：{data.tenderRequirement.riskLevel === 'critical' ? '🔴 严重' :
                       data.tenderRequirement.riskLevel === 'high' ? '🟠 高' :
                       data.tenderRequirement.riskLevel === 'medium' ? '🟡 中' : '🟢 低'}
          </span>
        </div>
      </div>

      {/* 投标文件分析（仅99元版） */}
      {userPlan === 'pro' && data.bidAnalysis && (
        <div className={`p-3 rounded-lg border ${
          data.bidAnalysis.deviation ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              data.bidAnalysis.deviation ? 'text-orange-800' : 'text-green-800'
            }`}>
              投标文件分析
            </span>
            {data.bidAnalysis.deviation ? (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                ⚠️ 存在偏离
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                ✅ 无偏离
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-700 mb-1">
            投标承诺期限：<span className="font-medium">{data.bidAnalysis.proposedPeriod}</span>
          </div>
          
          {data.bidAnalysis.deviation && (
            <>
              <div className="text-sm text-gray-700 mb-1">
                偏离类型：<span className="font-medium text-orange-600">{data.bidAnalysis.deviationType}</span>
              </div>
              <div className="text-sm text-gray-700 mb-1">
                风险等级：<span className="font-medium">{data.bidAnalysis.riskLevel}</span>
              </div>
              <div className="text-sm text-orange-600">
                建议：{data.bidAnalysis.suggestion}
              </div>
            </>
          )}
        </div>
      )}

      {/* 19元版提示 */}
      {userPlan === 'single' && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-medium">提示：</span>
            升级到99元专业版可分析投标文件，检测服务期限偏离。
          </div>
        </div>
      )}
    </div>
  );
}
