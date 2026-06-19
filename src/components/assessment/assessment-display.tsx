'use client';

import React from 'react';
import { Assessment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatCurrency,
  getCountdownDisplay,
  getCountdownColor,
  getRiskLevelColor,
  getRecommendationLabel,
  getRecommendationColor,
  formatDate,
} from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface AssessmentDisplayProps {
  assessment: Assessment;
}

export function AssessmentDisplay({ assessment }: AssessmentDisplayProps) {
  const countdownColor = getCountdownColor(assessment.deadline);
  const countdownColors = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const riskCounts = {
    critical: assessment.risks.filter((r) => r.level === 'critical').length,
    high: assessment.risks.filter((r) => r.level === 'high').length,
    medium: assessment.risks.filter((r) => r.level === 'medium').length,
    low: assessment.risks.filter((r) => r.level === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* 项目概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">预算金额</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(assessment.budget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">开标倒计时</div>
            <div className={`text-2xl font-bold ${countdownColors[countdownColor]}`}>
              {getCountdownDisplay(assessment.bidOpeningTime)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">风险等级</div>
            <div className="flex items-center space-x-2">
              <Badge className={getRiskLevelColor(assessment.riskLevel)}>
                {assessment.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">投标建议</div>
            <Badge className={getRecommendationColor(assessment.recommendation)}>
              {getRecommendationLabel(assessment.recommendation)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 风险概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            风险概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm">
                <span className="font-bold text-red-600">{riskCounts.critical}</span> 严重风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                <span className="font-bold text-orange-600">{riskCounts.high}</span> 高风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">
                <span className="font-bold text-yellow-600">{riskCounts.medium}</span> 中风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <span className="font-bold text-green-600">{riskCounts.low}</span> 低风险
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关键时间节点 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            关键时间节点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">质疑截止</div>
              <div className="font-medium">{formatDate(assessment.queryDeadline)}</div>
              <div className={`text-sm ${getCountdownColor(assessment.queryDeadline) === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                {getCountdownDisplay(assessment.queryDeadline)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">投标截止</div>
              <div className="font-medium">{formatDate(assessment.deadline)}</div>
              <div className={`text-sm ${getCountdownColor(assessment.deadline) === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                {getCountdownDisplay(assessment.deadline)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">开标时间</div>
              <div className="font-medium">{formatDate(assessment.bidOpeningTime)}</div>
              <div className={`text-sm ${getCountdownColor(assessment.bidOpeningTime) === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                {getCountdownDisplay(assessment.bidOpeningTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 风险清单 */}
      {assessment.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>风险清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assessment.risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    risk.level === 'critical'
                      ? 'border-red-500 bg-red-50'
                      : risk.level === 'high'
                      ? 'border-orange-500 bg-orange-50'
                      : risk.level === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-green-500 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{risk.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{risk.description}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">建议：</span>{risk.suggestion}
                      </div>
                    </div>
                    <Badge className={getRiskLevelColor(risk.level)}>
                      {risk.level === 'critical' ? '严重' : risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务清单 */}
      {assessment.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              准备清单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assessment.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : task.status === 'in-progress' ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
                      {task.name}
                    </span>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'destructive'
                        : task.priority === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
