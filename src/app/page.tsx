'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { AssessmentDisplay } from '@/components/assessment/assessment-display';
import { Assessment } from '@/types';
import { FileText, AlertTriangle, CheckCircle, User, LogOut, History, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface HistoryItem {
  id: string;
  projectName: string;
  budget: number;
  riskLevel: string;
  recommendation: string;
  fileName: string;
  createdAt: string;
}

export default function Home() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data.assessments || []);
    } catch {
      console.error('Failed to load history');
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, loadHistory]);

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
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }

      const data = await response.json();
      setAssessment(data.assessment);

      if (user) {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data.assessment,
              fileName: file.name,
            }),
          });
          loadHistory();
        } catch {
          console.error('Failed to save history');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析过程中出现错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!assessment) return;

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment),
      });

      if (!response.ok) throw new Error('下载失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `投标决策评估-${assessment.basicInfo.projectName || '未命名'}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setHistory([]);
    window.location.reload();
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

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/knowledge" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                    <FileText className="h-5 w-5" />
                    <span>知识库</span>
                  </Link>
                  <Link href="/ai-write" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                    <FileText className="h-5 w-5" />
                    <span>AI写标书</span>
                  </Link>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    <History className="h-5 w-5" />
                    <span>历史记录</span>
                  </button>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-5 w-5" />
                    <span>{user.name || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login" className="text-gray-600 hover:text-gray-900">
                    登录
                  </Link>
                  <Link href="/register">
                    <Button>注册</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 历史记录面板 */}
        {showHistory && user && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">历史评估记录</h3>
            {history.length === 0 ? (
              <p className="text-gray-500">暂无历史记录</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <div className="font-medium">{item.projectName}</div>
                      <div className="text-sm text-gray-500">
                        {item.fileName} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.recommendation === 'bid' ? 'bg-green-100 text-green-800' :
                        item.recommendation === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.recommendation === 'bid' ? '建议投' :
                         item.recommendation === 'caution' ? '谨慎投' : '不建议投'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            <div className="flex items-center justify-between">
              <button
                onClick={() => setAssessment(null)}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>← 返回上传</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>下载报告</span>
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {assessment.basicInfo.projectName}
              </h2>
              <p className="text-gray-500 mt-1">
                {assessment.basicInfo.projectCode && `项目编号：${assessment.basicInfo.projectCode}`}
              </p>
            </div>

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
