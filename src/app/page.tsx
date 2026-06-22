'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { AssessmentDisplay } from '@/components/assessment/assessment-display';
import { Assessment } from '@/types';
import { Navigation } from '@/components/navigation';
import { AlertTriangle, CheckCircle, FileText, Download, ArrowLeft, Clock, Plus, FolderOpen, BarChart3 } from 'lucide-react';

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(!!data.user);
        if (data.user) loadHistory();
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data.assessments || []);
    } catch {
      console.error('Failed to load history');
    }
  }, []);

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '分析失败');
      }
      const data = await response.json();
      setAssessment(data.assessment);
      setSelectedId(data.assessment.id);
      if (isLoggedIn) {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data.assessment, fileName: file.name }),
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

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedId(item.id);
    setAssessment({
      id: item.id,
      projectName: item.projectName,
      budget: item.budget,
      riskLevel: item.riskLevel,
      recommendation: item.recommendation,
      basicInfo: { projectName: item.projectName } as Assessment['basicInfo'],
    } as Assessment);
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

  const showDashboard = !assessment && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 */}
        <aside className="w-72 bg-white border-r flex flex-col flex-shrink-0">
          {/* 新建按钮 */}
          <div className="p-4 border-b">
            <button
              onClick={() => { setAssessment(null); setSelectedId(null); }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>新建分析</span>
            </button>
          </div>

          {/* 项目列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">历史项目</div>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无项目</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedId === item.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 truncate">{item.projectName}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.recommendation === 'bid' ? 'bg-green-100 text-green-700' :
                          item.recommendation === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.recommendation === 'bid' ? '建议投' : item.recommendation === 'caution' ? '谨慎投' : '不建议投'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          {showDashboard ? (
            <div className="p-8">
              {/* 欢迎 + 上传 */}
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">上传招标文件开始分析</h2>
                  <p className="text-gray-500">支持 PDF、Word、Excel 等格式，3分钟生成完整评估报告</p>
                </div>

                <FileUpload onUpload={handleUpload} isProcessing={isProcessing} />

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-center text-sm">{error}</p>
                  </div>
                )}

                {/* 快捷统计 */}
                {isLoggedIn && history.length > 0 && (
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                      <div className="text-sm text-gray-500 mt-1">历史项目</div>
                    </div>
                    <div className="bg-white rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {history.filter((h) => h.recommendation === 'bid').length}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">建议投标</div>
                    </div>
                    <div className="bg-white rounded-lg border p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {history.filter((h) => h.riskLevel === 'high' || h.riskLevel === 'critical').length}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">高风险项目</div>
                    </div>
                  </div>
                )}

                {/* 使用流程 */}
                <div className="mt-8 bg-white rounded-lg border p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">使用流程</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { step: '1', label: '上传招标文件', desc: '支持PDF、Word、Excel等格式' },
                      { step: '2', label: 'AI提取信息', desc: '自动提取7类关键信息并识别风险' },
                      { step: '3', label: '获取评估报告', desc: '一键生成投标决策建议' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className="h-6 w-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <div className="font-medium text-sm text-gray-800">{item.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                <p className="text-gray-600 font-medium">AI 正在分析招标文件...</p>
                <p className="text-gray-400 text-sm mt-1">预计需要 1-3 分钟</p>
              </div>
            </div>
          ) : assessment ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { setAssessment(null); setSelectedId(null); }}
                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>返回</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>下载Excel报告</span>
                </button>
              </div>

              <div className="bg-white rounded-lg border p-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">{assessment.basicInfo.projectName}</h2>
                {assessment.basicInfo.projectCode && (
                  <p className="text-gray-500 mt-1 text-sm">项目编号：{assessment.basicInfo.projectCode}</p>
                )}
              </div>

              <AssessmentDisplay assessment={assessment} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
