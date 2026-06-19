'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { AssessmentDisplay } from '@/components/assessment/assessment-display';
import { Assessment } from '@/types';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Home() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('分析失败，请稍后重试');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }
      setAssessment(data.assessment);
    } catch (err) {
      console.error('分析错误:', err);
      setError(err instanceof Error ? err.message : '分析过程中出现错误');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">投标决策支持系统</h1>
                <p className="text-sm text-gray-500">Bidding Decision Support System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!assessment ? (
          <div className="space-y-8">
            {/* 价值主张 */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                3分钟生成投标决策评估表
              </h2>
              <p className="text-xl text-gray-600">
                提前发现废标风险，判断是否值得投
              </p>
              <div className="flex justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>免费基础评估</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>废标风险识别</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span>智能投标建议</span>
                </div>
              </div>
            </div>

            {/* 上传区域 */}
            <FileUpload onUpload={handleUpload} isProcessing={isProcessing} />

            {/* 错误提示 */}
            {error && (
              <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* 功能说明 */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">上传招标文件</h3>
                <p className="text-sm text-gray-500">
                  支持 PDF、Word、Excel 格式的招标文件
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">智能风险识别</h3>
                <p className="text-sm text-gray-500">
                  自动识别废标风险、得分风险、时间风险
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">投标决策建议</h3>
                <p className="text-sm text-gray-500">
                  基于分析结果给出投/不投/谨慎投建议
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 返回按钮 */}
            <button
              onClick={() => setAssessment(null)}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>← 返回上传</span>
            </button>

            {/* 项目标题 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {assessment.basicInfo.projectName}
              </h2>
              <p className="text-gray-500 mt-1">
                {assessment.basicInfo.projectCode && `项目编号：${assessment.basicInfo.projectCode}`}
              </p>
            </div>

            {/* 评估结果 */}
            <AssessmentDisplay assessment={assessment} />
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 投标决策支持系统 · 帮助企业做出明智的投标决策
          </p>
        </div>
      </footer>
    </div>
  );
}
