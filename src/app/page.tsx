'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { AssessmentDisplay } from '@/components/assessment/assessment-display';
import { Assessment } from '@/types';
import { Navigation } from '@/components/navigation';
import {
  AlertTriangle, CheckCircle, FileText, Download, ArrowLeft, Clock,
  Plus, FolderOpen, BarChart3, Shield, Zap, Lock, ChevronRight,
  TrendingUp, AlertCircle, XCircle, Eye, EyeOff, Settings, Link2
} from 'lucide-react';

interface HistoryItem {
  id: string;
  projectName: string;
  budget: number;
  riskLevel: string;
  recommendation: string;
  fileName: string;
  createdAt: string;
}

type TabType = 'assessment' | 'tasks' | 'response' | 'keywords' | 'audit';

const TABS: { id: TabType; label: string; locked?: boolean }[] = [
  { id: 'assessment', label: '招标决策评估' },
  { id: 'tasks', label: '准备与分工清单', locked: true },
  { id: 'response', label: '商务技术响应表', locked: true },
  { id: 'keywords', label: '标书审核关键词', locked: true },
  { id: 'audit', label: '深度AI审核', locked: true },
];

export default function Home() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('assessment');
  const [showUpload, setShowUpload] = useState(true);

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
      setShowUpload(false);
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
    setShowUpload(false);
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

  const handleNewAnalysis = () => {
    setAssessment(null);
    setSelectedId(null);
    setShowUpload(true);
    setActiveTab('assessment');
  };

  const riskCounts = assessment ? {
    critical: assessment.risks?.filter((r: any) => r.level === 'critical').length || 0,
    high: assessment.risks?.filter((r: any) => r.level === 'high').length || 0,
    medium: assessment.risks?.filter((r: any) => r.level === 'medium').length || 0,
    low: assessment.risks?.filter((r: any) => r.level === 'low').length || 0,
  } : { critical: 0, high: 0, medium: 0, low: 0 };

  const totalRisk = riskCounts.critical + riskCounts.high + riskCounts.medium + riskCounts.low;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navigation />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 - 深色 */}
        <aside className="w-64 bg-[#0F172A] flex flex-col flex-shrink-0">
          {/* 新建按钮 */}
          <div className="p-4 border-b border-gray-700/50">
            <button
              onClick={handleNewAnalysis}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>新建投标分析</span>
            </button>
          </div>

          {/* 项目列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">历史分析项目</div>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
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
                          ? 'bg-blue-600/20 border border-blue-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-white truncate">{item.projectName}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.recommendation === 'bid' ? 'bg-green-500/20 text-green-400' :
                          item.recommendation === 'caution' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
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

          {/* 底部 - 飞书连接状态 */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300">飞书企业资料库</span>
                </div>
                <button className="text-gray-500 hover:text-gray-300">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400">已安全连接</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">所有文件仅在本地与飞书流转，绝不上云</p>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          {/* 顶部项目信息栏 */}
          {assessment && !showUpload && (
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">当前项目</div>
                  <h1 className="text-xl font-bold text-gray-900">{assessment.basicInfo.projectName}</h1>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">预算金额</div>
                    <div className="text-xl font-bold text-blue-600">
                      ¥{(assessment.budget || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">距离开标</div>
                    <div className="text-xl font-bold text-orange-600">
                      {assessment.bidOpeningTime ? '计算中...' : '未设置'}
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>导出Excel</span>
                  </button>
                </div>
              </div>

              {/* Tab导航 */}
              <div className="flex items-center space-x-1 mt-4 border-b border-gray-200">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!tab.locked || tab.id === 'assessment') {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : tab.locked
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      {tab.locked && <Lock className="h-3.5 w-3.5" />}
                      <span>{tab.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 内容区 */}
          {showUpload ? (
            <div className="p-8">
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
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  {/* 概览卡片 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 风险摘要 */}
                    <div className="bg-white rounded-xl border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">风险摘要</h3>
                        <span className="text-2xl font-bold text-gray-900">{totalRisk}</span>
                      </div>
                      <div className="space-y-3">
                        {riskCounts.critical > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">严重风险</span>
                            </div>
                            <span className="font-bold text-red-600">{riskCounts.critical}</span>
                          </div>
                        )}
                        {riskCounts.high > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">高风险</span>
                            </div>
                            <span className="font-bold text-orange-600">{riskCounts.high}</span>
                          </div>
                        )}
                        {riskCounts.medium > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">中风险</span>
                            </div>
                            <span className="font-bold text-yellow-600">{riskCounts.medium}</span>
                          </div>
                        )}
                        {riskCounts.low > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">低风险</span>
                            </div>
                            <span className="font-bold text-green-600">{riskCounts.low}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 评分点 */}
                    <div className="bg-white rounded-xl border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">评分点</h3>
                        <span className="text-2xl font-bold text-gray-900">
                          {assessment.scoringRules?.items?.length || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">总分</span>
                          <span className="font-bold text-blue-600">{assessment.scoringRules?.totalScore || 100}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">商务分</span>
                          <span className="font-bold text-green-600">{assessment.scoringRules?.commercialScore || 30}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">技术分</span>
                          <span className="font-bold text-purple-600">{assessment.scoringRules?.technicalScore || 50}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">价格分</span>
                          <span className="font-bold text-orange-600">{assessment.scoringRules?.priceScore || 20}</span>
                        </div>
                      </div>
                    </div>

                    {/* 投标建议 */}
                    <div className="bg-white rounded-xl border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">AI建议</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          assessment.recommendation === 'bid' ? 'bg-green-100 text-green-700' :
                          assessment.recommendation === 'caution' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {assessment.recommendation === 'bid' ? '建议投标' :
                           assessment.recommendation === 'caution' ? '谨慎投标' : '不建议投标'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {assessment.recommendation === 'bid' && '资质基本匹配，风险可控，建议积极准备投标。'}
                        {assessment.recommendation === 'caution' && '存在部分风险，需重点关注资质和时间要求。'}
                        {assessment.recommendation === 'no-bid' && '风险较高，建议谨慎评估后再决定是否投标。'}
                      </p>
                    </div>
                  </div>

                  {/* 详细评估 */}
                  <AssessmentDisplay assessment={assessment} />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">智能全标材料准备与分工清单</h3>
                    <p className="text-sm text-gray-500 mb-4">系统共精准解析出 {assessment.checklist?.length || 0} 项必需材料</p>
                    
                    {/* 前3行完整显示 */}
                    <div className="overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">序号</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">材料类别</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">招标文件要求</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(assessment.checklist || []).slice(0, 3).map((item, index) => (
                            <tr key={item.id} className="border-b">
                              <td className="py-3 px-4">{index + 1}</td>
                              <td className="py-3 px-4">{item.category}</td>
                              <td className="py-3 px-4">{item.item}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.status === 'prepared' ? 'bg-green-100 text-green-700' :
                                  item.status === 'missing' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.status === 'prepared' ? '已准备' :
                                   item.status === 'missing' ? '缺失' : '待确认'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 第4行开始模糊 */}
                    {(assessment.checklist || []).length > 3 && (
                      <div className="relative mt-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white z-10"></div>
                        <div className="blur-sm opacity-50">
                          <table className="w-full text-sm">
                            <tbody>
                              {(assessment.checklist || []).slice(3, 6).map((item, index) => (
                                <tr key={item.id} className="border-b">
                                  <td className="py-3 px-4">{index + 4}</td>
                                  <td className="py-3 px-4">{item.category}</td>
                                  <td className="py-3 px-4">{item.item}</td>
                                  <td className="py-3 px-4">***</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* 解锁按钮 */}
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg">
                            <Lock className="h-4 w-4" />
                            <span>解锁完整分工项目包 (消耗 1 点数)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'response' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">商务技术响应表</h3>
                      <span className="text-sm text-gray-500">免费展示采购方技术要求</span>
                    </div>
                    
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">序号</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">采购方原始要求</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">AI响应 (需解锁)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(assessment.projectInfo?.technicalRequirements || '').split('；').filter(Boolean).slice(0, 3).map((req, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4">{req.trim()}</td>
                            <td className="py-3 px-4">
                              <button className="text-blue-600 hover:underline flex items-center space-x-1">
                                <Lock className="h-3 w-3" />
                                <span>点击解锁AI响应</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* 解锁区域 */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-3">解锁有响应内容版，系统将自动编写符合偏离表规范的响应语句</p>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                          立即解锁 AI 自动响应编写 (消耗 2 点数)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'keywords' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">标书审核关键词</h3>
                    <div className="relative">
                      <div className="blur-sm opacity-50">
                        <div className="grid grid-cols-2 gap-4">
                          {['废标条款', '实质性响应', '资质要求', '报价限制', '时间约束', '格式要求'].map((keyword) => (
                            <div key={keyword} className="p-4 bg-gray-50 rounded-lg">
                              <div className="font-medium text-gray-800">{keyword}</div>
                              <div className="text-sm text-gray-500 mt-1">共识别 3-5 处相关条款</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg">
                          <Lock className="h-4 w-4" />
                          <span>解锁完整关键词分析 (消耗 1 点数)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">深度AI审核</h3>
                    <div className="text-center py-12">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">深度AI审核功能需要解锁</p>
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto">
                        <Lock className="h-4 w-4" />
                        <span>解锁深度AI审核 (消耗 3 点数)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
