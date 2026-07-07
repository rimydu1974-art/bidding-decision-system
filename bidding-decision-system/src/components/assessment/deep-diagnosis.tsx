'use client';

import React from 'react';
import { DeepDiagnosisResult } from '@/types';
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Award,
  Phone,
  Target,
  Lightbulb,
  ListChecks,
} from 'lucide-react';

interface DeepDiagnosisProps {
  data: DeepDiagnosisResult;
  isPaid: boolean;
  onUnlock?: () => void;
}

export function DeepDiagnosis({ data, isPaid, onUnlock }: DeepDiagnosisProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">项目深度诊断</h3>
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

      {/* 已发现统计（免费版+付费版都有） */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="text-sm font-medium text-gray-700 mb-3">已发现：</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">{data.summary.scoringFactors}项评分因素</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">{data.summary.qualificationRequirements}项资格要求</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">{data.summary.technicalRequirements}项关键技术要求</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-700">{data.summary.phoneQuestions}项需电话确认问题</span>
          </div>
        </div>
      </div>

      {/* 付费版：详细内容 */}
      {isPaid && data.details && (
        <div className="space-y-4">
          {/* 废标风险 */}
          {data.details.voidRisk.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-800">废标风险：{data.details.voidRisk.length}项</span>
              </div>
              <div className="space-y-3">
                {data.details.voidRisk.map((risk) => (
                  <div key={risk.id} className="rounded-lg bg-white p-3 border border-red-100">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900">{risk.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        risk.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                        risk.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {risk.riskLevel === 'critical' ? '🔴 高风险' :
                         risk.riskLevel === 'high' ? '🟠 高风险' : '🟡 中风险'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                    <div className="text-xs text-gray-500 mb-1">
                      来源：{risk.source}（系统页码{risk.sourcePage.systemPage}，正文页码{risk.sourcePage.contentPage}）
                    </div>
                    {risk.customerStatus && (
                      <div className="text-xs text-gray-500 mb-1">客户状态：{risk.customerStatus}</div>
                    )}
                    {risk.expiryDate && (
                      <div className="text-xs text-gray-500 mb-1">到期时间：{risk.expiryDate}（剩余{risk.remainingDays}天）</div>
                    )}
                    <div className="text-xs text-blue-600">建议：{risk.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 评分关键项 */}
          {data.details.scoringKeyItems.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-800">评分关键项：{data.details.scoringKeyItems.length}项</span>
              </div>
              <div className="space-y-3">
                {data.details.scoringKeyItems.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{item.name}（{item.maxScore}分）</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500">重点：</span>
                      <div className="mt-1 space-y-1">
                        {item.keyPoints.map((point, idx) => (
                          <div key={idx} className="text-xs text-gray-600">• {point}</div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      来源：{item.source}（系统页码{item.sourcePage.systemPage}，正文页码{item.sourcePage.contentPage}）
                    </div>
                    {item.customerStatus && (
                      <div className="text-xs text-gray-500">客户状态：{item.customerStatus}</div>
                    )}
                    {item.suggestion && (
                      <div className="text-xs text-blue-600">建议：{item.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 容易失分项 */}
          {data.details.easyToLosePoints.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-yellow-800">容易失分项：{data.details.easyToLosePoints.length}项</span>
              </div>
              <div className="space-y-3">
                {data.details.easyToLosePoints.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-3 border border-yellow-100">
                    <div className="font-medium text-gray-900 mb-1">{item.category}</div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="text-xs text-orange-600 mb-1">风险：{item.risk}</div>
                    <div className="text-xs text-gray-500">
                      来源：{item.source}（系统页码{item.sourcePage.systemPage}，正文页码{item.sourcePage.contentPage}）
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 电话咨询问题 */}
          {data.details.phoneConsultationQuestions.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-purple-800">电话咨询问题：{data.details.phoneConsultationQuestions.length}项</span>
              </div>
              <div className="space-y-2">
                {data.details.phoneConsultationQuestions.map((q) => (
                  <div key={q.id} className="rounded-lg bg-white p-3 border border-purple-100">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{q.question}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        q.priority === 'high' ? 'bg-red-100 text-red-700' :
                        q.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {q.priority === 'high' ? '🔴 高' :
                         q.priority === 'medium' ? '🟡 中' : '🟢 低'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{q.category}问题</div>
                    <div className="text-xs text-gray-600 mt-1">原因：{q.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 投标策略建议 */}
          {data.details.bidSuggestion && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">投标策略建议</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-green-100">
                {data.details.bidSuggestion.level && (
                  <div className="mb-2">
                    <span className="text-lg font-bold text-green-700">
                      建议等级：{data.details.bidSuggestion.level}-{data.details.bidSuggestion.label}（{data.details.bidSuggestion.score}分）
                    </span>
                  </div>
                )}
                {data.details.bidSuggestion.reasons && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">建议理由：</div>
                    {data.details.bidSuggestion.reasons.map((reason, idx) => (
                      <div key={idx} className="text-sm text-gray-700">{reason}</div>
                    ))}
                  </div>
                )}
                {data.details.bidSuggestion.keyPreparations && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">重点准备：</div>
                    {data.details.bidSuggestion.keyPreparations.map((prep, idx) => (
                      <div key={idx} className="text-sm text-gray-700">{prep}</div>
                    ))}
                  </div>
                )}
                {data.details.bidSuggestion.riskWarnings && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">⚠️ 风险提示：</div>
                    {data.details.bidSuggestion.riskWarnings.map((warning, idx) => (
                      <div key={idx} className="text-sm text-orange-600">{warning}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 准备分工项目包 */}
          {data.details.preparationChecklist && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-800">
                  准备分工项目包：{data.details.preparationChecklist.categories.length}大类{data.details.preparationChecklist.totalItems}项
                </span>
              </div>
              <div className="space-y-2">
                {data.details.preparationChecklist.categories.map((category) => (
                  <div key={category.id} className="rounded-lg bg-white p-3 border border-gray-100">
                    <div className="font-medium text-gray-900 mb-1">{category.name}（{category.items.length}项）</div>
                    <div className="text-xs text-gray-500">
                      {category.items.slice(0, 3).map(item => item.name).join('、')}
                      {category.items.length > 3 && `等${category.items.length}项`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 免费版：锁定提示 */}
      {!isPaid && (
        <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-6 text-center">
          <Lock className="h-8 w-8 text-purple-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-purple-700 mb-2">深度分析结果已生成</p>
          <p className="text-xs text-purple-500 mb-4">
            包含：潜在废标风险、评分关键项、容易失分项、电话咨询问题、投标策略建议、准备分工项目包
          </p>
          <button
            onClick={onUnlock}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            解锁本项目 ¥19
          </button>
        </div>
      )}
    </div>
  );
}
