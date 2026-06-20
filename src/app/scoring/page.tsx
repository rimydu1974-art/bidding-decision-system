'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/upload/file-upload';
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';

interface ScoringResult {
  criteria: string;
  score: number;
  maxScore: number;
  suggestion: string;
  status: 'good' | 'warning' | 'bad';
}

interface ScoringResponse {
  results: ScoringResult[];
  totalScore: number;
  totalMaxScore: number;
  rawResponse: string;
  criteria: { name: string; weight: number; description: string }[];
}

export default function ScoringPage() {
  const router = useRouter();
  const [scoring, setScoring] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      // 直接发送文件到评分API
      const formData = new FormData();
      formData.append('file', file);

      const scoringResponse = await fetch('/api/scoring', {
        method: 'POST',
        body: formData,
      });

      if (!scoringResponse.ok) {
        const errorData = await scoringResponse.json();
        throw new Error(errorData.error || '评分预测失败');
      }

      const scoringData = await scoringResponse.json();
      setScoring(scoringData);
    } catch (error) {
      console.error('Scoring error:', error);
      alert(error instanceof Error ? error.message : '评分预测失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800">优秀</Badge>;
    }
    if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">良好</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">需改进</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-bold text-gray-900">实时评分预测</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!scoring ? (
          <div className="space-y-6">
            {/* 说明 */}
            <Card>
              <CardHeader>
                <CardTitle>评分预测说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold">多维度评分</h3>
                    <p className="text-sm text-gray-600">
                      从技术、商务、报价、团队、服务5个维度综合评分
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold">实时预测</h3>
                    <p className="text-sm text-gray-600">
                      基于AI分析，实时预测投标得分
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold">改进建议</h3>
                    <p className="text-sm text-gray-600">
                      针对薄弱环节提供具体改进建议
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 上传区域 */}
            <Card>
              <CardHeader>
                <CardTitle>上传招标文件</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onUpload={handleFileUpload} isProcessing={loading} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 返回按钮 */}
            <Button variant="ghost" onClick={() => setScoring(null)}>
              ← 重新上传
            </Button>

            {/* 总分展示 */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">预测得分</h2>
                    <p className="text-blue-100 mt-1">
                      根据招标文件评分标准，预测您的投标得分
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-bold">{scoring.totalScore}</div>
                    <div className="text-blue-100">/{scoring.totalMaxScore || 100}</div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${(scoring.totalScore / (scoring.totalMaxScore || 100)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-blue-100">
                  满分 {scoring.totalMaxScore || 100} 分
                </div>
              </CardContent>
            </Card>

            {/* 详细评分 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scoring.results.map((result, index) => {
                const criterion = scoring.criteria[index];
                const maxScore = criterion?.weight || result.maxScore;
                return (
                  <Card key={result.criteria}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {result.criteria}
                            </h3>
                            <p className="text-sm text-gray-500">
                              满分 {maxScore} 分
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </div>
                          <div className="text-sm text-gray-500">/{maxScore}</div>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (result.score / maxScore) >= 0.8
                              ? 'bg-green-500'
                              : (result.score / maxScore) >= 0.6
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${(result.score / maxScore) * 100}%` }}
                        ></div>
                      </div>

                      {/* 建议 */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{result.suggestion}</p>
                      </div>

                      <div className="mt-3">{getStatusBadge(result.score)}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 原始分析 */}
            <Card>
              <CardHeader>
                <CardTitle>AI详细分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {scoring.rawResponse}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
