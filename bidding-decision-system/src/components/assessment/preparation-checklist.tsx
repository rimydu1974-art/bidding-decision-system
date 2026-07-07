'use client';

import React, { useState } from 'react';
import { PreparationChecklist as PreparationChecklistType } from '@/types';
import { ListChecks, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

interface PreparationChecklistProps {
  data: PreparationChecklistType;
  isPaid: boolean;
}

export function PreparationChecklist({ data, isPaid }: PreparationChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prepared':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'prepared':
        return '已准备';
      case 'missing':
        return '缺失';
      case 'pending':
        return '待准备';
      default:
        return '不适用';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-gray-800">准备分工项目包</span>
        </div>
        <span className="text-sm text-gray-500">
          {data.categories.length}大类{data.totalItems}项
        </span>
      </div>

      <div className="space-y-3">
        {data.categories.map((category) => (
          <div key={category.id} className="border border-gray-100 rounded-lg overflow-hidden">
            {/* 类别标题 */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{category.name}</span>
                <span className="text-sm text-gray-500">（{category.items.length}项）</span>
              </div>
              {expandedCategories.has(category.id) ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {/* 类别内容 */}
            {expandedCategories.has(category.id) && (
              <div className="p-3 space-y-2">
                {category.items.map((item) => (
                  <div key={item.id} className="p-3 bg-white border border-gray-100 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.required && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            必须
                          </span>
                        )}
                      </div>
                      {item.scoreWeight && (
                        <span className="text-xs text-gray-500">{item.scoreWeight}分</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      来源：{item.source}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      页码：系统{item.sourcePage.systemPage}，正文{item.sourcePage.contentPage}
                    </div>

                    {/* 业绩证明特殊要求 */}
                    {item.performanceRequirements && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                        <div className="text-xs font-medium text-blue-800 mb-1">业绩证明要求：</div>
                        <div className="space-y-1">
                          {item.performanceRequirements.contractKeyPage && (
                            <div className="text-xs text-blue-700">• 需要合同关键页</div>
                          )}
                          {item.performanceRequirements.acceptanceReport && (
                            <div className="text-xs text-blue-700">• 需要验收报告</div>
                          )}
                          {item.performanceRequirements.paymentScreenshot && (
                            <div className="text-xs text-blue-700">• 需要收款截图</div>
                          )}
                          {item.performanceRequirements.customerFeedback && (
                            <div className="text-xs text-blue-700">• 需要客户反馈</div>
                          )}
                          {item.performanceRequirements.otherDocuments && item.performanceRequirements.otherDocuments.length > 0 && (
                            <div className="text-xs text-blue-700">• 其他：{item.performanceRequirements.otherDocuments.join('、')}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 备注 */}
                    {item.note && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">备注：</span>{item.note}
                      </div>
                    )}

                    {/* 状态和负责人 */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>状态：{getStatusText(item.status)}</span>
                      {item.assignee && <span>负责人：{item.assignee}</span>}
                      {item.deadline && <span>截止：{item.deadline}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
