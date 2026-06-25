'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { RiskBadge } from '@/components/ui/risk-badge';
import {
  ArrowLeft,
  Download,
  FileText,
  Lock,
  CheckCircle,
  AlertTriangle,
  Phone,
  FileCode,
  Target,
  Key,
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: string;
  createdAt: string;
}

interface AssessmentData {
  basicInfo?: any;
  financialInfo?: any;
  scoringRules?: any;
  qualificationRequirements?: any;
  timeRequirements?: any;
  projectInfo?: any;
  phoneQuestions?: any[];
  risks?: any[];
  tasks?: any[];
  checklist?: any[];
  recommendation?: string;
  riskLevel?: string;
}

type TabType = 'eval' | 'checklist' | 'response' | 'scoring' | 'keywords';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'eval', label: '免费 AI 评估', icon: Target },
  { id: 'checklist', label: '准备清单', icon: FileText },
  { id: 'response', label: '商务技术响应表', icon: FileCode },
  { id: 'scoring', label: '评分预测', icon: BarChart3 },
  { id: 'keywords', label: '关键词拆解', icon: Key },
];

import { BarChart3 } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [activeTab, setActiveTab] = useState<TabType>('eval');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    loadUserPlan();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      const record = data.assessments?.find((a: any) => a.id === projectId);
      if (record) {
        setProject({
          id: record.id,
          name: record.projectName || record.name,
          description: record.description || '',
          status: record.status || 'completed',
          metadata: record.metadata || '',
          createdAt: record.createdAt,
        });
        if (record.aiResult) {
          try {
            setAssessment(JSON.parse(record.aiResult));
          } catch {
            setAssessment({
              basicInfo: { projectName: record.projectName },
              financialInfo: { budget: record.budget },
              riskLevel: record.riskLevel,
              recommendation: record.recommendation,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlan = async () => {
    try {
      const res = await fetch('/api/user/quota');
      const data = await res.json();
      setUserPlan(data.plan || 'free');
      if (data.plan === 'pro' || data.plan === 'enterprise') {
        setIsUnlocked(true);
      }
    } catch {
      console.error('Failed to load user plan');
    }
  };

  const handleUnlock = () => {
    router.push(`/payment?projectId=${projectId}&returnUrl=/project/${projectId}`);
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment),
      });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `投标决策评估-${project?.name || '未命名'}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const riskCounts = assessment ? {
    scoringFactors: assessment.scoringRules?.items?.length || 0,
    qualificationReqs: assessment.qualificationRequirements?.length || 0,
    techReqs: assessment.projectInfo?.technicalRequirements?.split('；').filter(Boolean).length || 0,
    phoneQuestions: assessment.phoneQuestions?.length || 0,
  } : { scoringFactors: 0, qualificationReqs: 0, techReqs: 0, phoneQuestions: 0 };

  const hasIncompleteInfo = !assessment?.scoringRules && !assessment?.qualificationRequirements && !assessment?.projectInfo;
  const score = hasIncompleteInfo ? 0 : 65;

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#7c3aed]/20 border-t-[#7c3aed] rounded-full mx-auto" />
            <p className="mt-4 text-[#6b7280]">加载中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#2e2e42] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.push('/projects')} className="text-[#6b7280] hover:text-white transition-all mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg font-bold text-white">{project?.name || '项目详情'}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981]">分析完成</span>
            </div>
            <p className="text-xs text-[#6b7280] ml-6">
              编号: {projectId.slice(0, 8)} | 预算: ¥{(assessment?.financialInfo?.budget || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-ghost text-xs">
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="px-5 pt-3 flex gap-0 border-b border-[#2e2e42] flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar">
          {activeTab === 'eval' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column (1/3) */}
              <div className="lg:col-span-1 space-y-4">
                {/* Score Gauge */}
                <div className="glass-card p-6 text-center">
                  <ScoreGauge score={score} size="lg" />
                  {!assessment?.scoringRules && (
                    <div className="mt-3 p-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                      <p className="text-xs text-[#f59e0b]">⚠️ 发现信息缺口：由于未关联企业知识库，AI无法判定建议</p>
                    </div>
                  )}
                </div>

                {/* Win Probability */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">中标概率预测</h3>
                    <span className="text-xs text-[#6b7280]">AI 模型</span>
                  </div>
                  <div className="flex items-end gap-4 mb-3">
                    <span className="text-4xl font-bold gradient-text">68%</span>
                    <span className="text-xs text-[#f59e0b] mb-1">竞争激烈</span>
                  </div>
                  <div className="w-full bg-[#1e1e2e] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#10b981] h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                  {!assessment?.financialInfo && (
                    <div className="mt-3 p-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                      <p className="text-xs text-[#f59e0b]">⚠️ 上传招标文件投标文件一起做对比</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Risk Assessment - Blurred for free */}
                <div className={`glass-card p-6 ${!isUnlocked ? 'relative' : ''}`}>
                  <h3 className="text-sm font-medium text-white mb-4">风险评估</h3>
                  <div className={`space-y-3 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                    {(assessment?.risks || []).map((risk: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                        <RiskBadge level={risk.level || 'medium'} />
                        <div className="flex-1">
                          <p className="text-sm text-[#e2e8f0] font-medium">{risk.title || risk.category}</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{risk.description || risk.suggestion}</p>
                        </div>
                      </div>
                    ))}
                    {(!assessment?.risks || assessment.risks.length === 0) && (
                      <p className="text-[#6b7280] text-sm">暂无风险数据</p>
                    )}
                  </div>
                </div>

                {/* Missing Info Warning - Always visible */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#f59e0b]/10 to-[#f97316]/5 border border-[#f59e0b]/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#f59e0b] mb-2">⚠️ 你缺少哪些信息、哪些无法判断</p>
                      <div className="text-sm text-[#9ca3af] space-y-1">
                        <p>缺少信息：</p>
                        <div className="flex flex-wrap gap-2 ml-4">
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">企业资质没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">个人资质没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">合同业绩没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">社保没有上传</span>
                          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-xs">检测报告没有上传</span>
                        </div>
                        <p className="mt-2">所以没办法对比做判断</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Deep Diagnosis - Always visible */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-white mb-4">项目深度诊断</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.scoringFactors}</b>项评分因素
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.qualificationReqs}</b>项资格要求
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.techReqs}</b>项关键技术要求
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f1a]">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className={`text-sm text-[#e2e8f0] ${hasIncompleteInfo ? 'blur-[4px] select-none' : ''}`}>
                        <b className="text-white">{riskCounts.phoneQuestions}</b>项需电话确认问题
                      </span>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 border border-[#7c3aed]/20 text-center">
                      <Lock className="w-8 h-8 text-[#a78bfa] mx-auto mb-2" />
                      <p className="text-sm font-medium text-white mb-1">深度分析结果已生成</p>
                      <p className="text-xs text-[#9ca3af] mb-3">
                        包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包
                      </p>
                      <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">
                        🔑 解锁本项目 ¥19
                      </button>
                    </div>
                  )}
                </div>

                {/* Boss Summary - Visible but limited for free */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-white mb-4">老板总结</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">项目名称</span>
                      <span className="text-[#e2e8f0]">{assessment?.basicInfo?.projectName || project?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">预算金额</span>
                      <span className="text-[#e2e8f0]">¥{(assessment?.financialInfo?.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">资质要求</span>
                      <span className="text-[#e2e8f0]">
                        {isUnlocked ? '详见资质要求列表' : '需上传完整资质才能判断'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">评分结构</span>
                      <span className="text-[#e2e8f0]">
                        {isUnlocked ? `${assessment?.scoringRules?.totalScore || 100}分` : `共${riskCounts.scoringFactors}项评分因素`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">关键风险点</span>
                      <span className="text-[#e2e8f0]">共{assessment?.risks?.length || 0}个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">准备分工项目包</span>
                      <span className="text-[#e2e8f0]">共{assessment?.checklist?.length || 0}项任务</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6b7280]">电话需确认问题</span>
                      <span className="text-[#e2e8f0]">共{assessment?.phoneQuestions?.length || 0}项</span>
                    </div>
                  </div>
                </div>

                {/* AI Comprehensive Suggestion - Blurred for free */}
                <div className={`glass-card p-6 ${!isUnlocked ? 'relative' : ''}`}>
                  <h3 className="text-sm font-medium text-white mb-4">AI 综合建议</h3>
                  <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                    <p className="text-sm text-[#9ca3af] leading-relaxed mb-3">
                      {assessment?.recommendation === 'bid'
                        ? '资质基本匹配，风险可控，建议积极准备投标。'
                        : assessment?.recommendation === 'caution'
                        ? '存在部分风险，需重点关注资质和时间要求。'
                        : '风险较高，建议谨慎评估后再决定是否投标。'}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa]">
                        {assessment?.recommendation === 'bid' ? '建议参与' : assessment?.recommendation === 'caution' ? '谨慎参与' : '不建议'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#f59e0b]/20 text-[#f59e0b]">关注报价</span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#06b6d4]/20 text-[#06b6d4]">优化方案</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className={`glass-card p-6 max-w-3xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">📋 投标准备清单</h3>
              <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e42] text-[#6b7280]">
                      <th className="text-left py-2 font-medium">序号</th>
                      <th className="text-left py-2 font-medium">准备项</th>
                      <th className="text-left py-2 font-medium">负责人</th>
                      <th className="text-left py-2 font-medium">截止日期</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#e2e8f0]">
                    {(assessment?.checklist || []).map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-[#2e2e42]/50">
                        <td className="py-2">{idx + 1}</td>
                        <td>{item.item || item.category}</td>
                        <td>{item.assignee || '待定'}</td>
                        <td>{item.deadline || '待定'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 ¥19</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div className={`glass-card p-6 max-w-3xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">📊 商务技术响应表</h3>
              <div className={`${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e42] text-[#6b7280]">
                      <th className="text-left py-2 font-medium">序号</th>
                      <th className="text-left py-2 font-medium">技术要求</th>
                      <th className="text-left py-2 font-medium">响应方案</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#e2e8f0]">
                    {(assessment?.projectInfo?.technicalRequirements || '').split('；').filter(Boolean).slice(0, 5).map((req: string, idx: number) => (
                      <tr key={idx} className="border-b border-[#2e2e42]/50">
                        <td className="py-2">{idx + 1}</td>
                        <td>{req.trim()}</td>
                        <td className="text-[#6b7280]">待解锁</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 ¥19</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className={`glass-card p-6 max-w-2xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-6">🎯 评分预测拆解</h3>
              <div className={`space-y-4 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                {assessment?.scoringRules?.items?.map((item: any, idx: number) => {
                  const pct = (item.score || item.maxScore || 0);
                  const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[#e2e8f0]">{item.name || item.category}</span>
                        <span className="text-sm font-bold text-white">{item.score || item.maxScore || 0}</span>
                      </div>
                      <div className="w-full bg-[#1e1e2e] rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 ¥19</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className={`glass-card p-6 max-w-2xl ${!isUnlocked ? 'relative' : ''}`}>
              <h3 className="text-sm font-medium text-white mb-4">🔍 关键词拆解</h3>
              <div className={`space-y-2 ${!isUnlocked ? 'blur-[8px] select-none pointer-events-none' : ''}`}>
                {['废标条款', '实质性响应', '资质要求', '报价限制', '时间约束', '格式要求'].map((kw) => (
                  <div key={kw} className="flex items-center gap-4 p-3 rounded-xl bg-[#0f0f1a]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{kw}</span>
                        <span className="text-xs text-[#10b981]">✓ 已覆盖</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                        <span>权重: 92</span>
                        <span>出现: 14次</span>
                      </div>
                    </div>
                    <div className="w-20 bg-[#1e1e2e] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#10b981]" style={{ width: '92%' }} />
                    </div>
                  </div>
                ))}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="glass-card p-8 text-center max-w-md" style={{ borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 8px 40px rgba(124,58,237,0.2)' }}>
                    <Lock className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                    <h3 className="text-white font-bold text-lg mb-2">深度分析结果已生成</h3>
                    <p className="text-sm text-[#9ca3af] mb-4">包含潜在废标风险 | 评分关键项 | 容易失分项 | 准备分工项目包</p>
                    <button onClick={handleUnlock} className="btn-primary w-full justify-center py-3">🔑 解锁本项目 ¥19</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
