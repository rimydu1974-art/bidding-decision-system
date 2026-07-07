'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Database,
  RefreshCw
} from 'lucide-react';
import { ALL_RULES } from '@/lib/rules';

interface ExtractionRule {
  id: string;
  category: string;
  name: string;
  keywords: string[];
  patterns: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AssessmentRule {
  id: string;
  name: string;
  category: 'hard-rejection' | 'soft-rejection' | 'scoring' | 'risk' | 'other';
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  conditions: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultAssessmentRules: AssessmentRule[] = ALL_RULES.map((rule) => {
  const priorityMap: Record<string, AssessmentRule['priority']> = {
    critical: 'high',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };

  return {
    id: rule.id,
    name: rule.name,
    category: (rule.category === 'hard-rejection' || rule.category === 'soft-rejection'
      ? rule.category
      : 'other') as AssessmentRule['category'],
    description: rule.description,
    enabled: true,
    priority: priorityMap[rule.riskLevel] || 'medium',
    conditions: rule.note || rule.legalBasis || '',
    action: rule.uiNote || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

const extractionCategories = [
  { value: 'void-bid', label: '废标/无效报价', color: 'bg-red-100 text-red-700' },
  { value: 'financial', label: '金额/保证金', color: 'bg-blue-100 text-blue-700' },
  { value: 'timeline', label: '日期/截止时间', color: 'bg-purple-100 text-purple-700' },
  { value: 'qualification', label: '资质证书', color: 'bg-green-100 text-green-700' },
  { value: 'document-req', label: '密封/签字/盖章', color: 'bg-orange-100 text-orange-700' },
  { value: 'scoring', label: '评分数字', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'symbol', label: '▲★※标记', color: 'bg-pink-100 text-pink-700' },
];

export default function RulesManagementPage() {
  const [activeTab, setActiveTab] = useState<'assessment' | 'extraction'>('extraction');
  const [extractionRules, setExtractionRules] = useState<ExtractionRule[]>([]);
  const [assessmentRules, setAssessmentRules] = useState<AssessmentRule[]>(defaultAssessmentRules);
  const [editingRule, setEditingRule] = useState<ExtractionRule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExtractionRules();
  }, []);

  const fetchExtractionRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rules');
      if (res.ok) {
        const data = await res.json();
        const parsed = (data.rules || []).map((r: any) => ({
          ...r,
          keywords: typeof r.keywords === 'string' ? JSON.parse(r.keywords) : r.keywords,
          patterns: typeof r.patterns === 'string' ? JSON.parse(r.patterns) : r.patterns,
        }));
        setExtractionRules(parsed);
      } else {
        console.error('API error:', res.status, await res.text());
      }
    } catch (error) {
      console.error('Failed to fetch extraction rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExtractionRules = filter === 'all' 
    ? extractionRules 
    : extractionRules.filter(r => r.category === filter);

  const filteredAssessmentRules = filter === 'all' 
    ? assessmentRules 
    : assessmentRules.filter(r => r.category === filter);

  const handleSaveExtraction = async (rule: ExtractionRule) => {
    try {
      const method = rule.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchExtractionRules();
        setEditingRule(null);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteExtraction = async (id: string) => {
    if (!confirm('确定要删除此规则吗？')) return;
    try {
      const res = await fetch(`/api/admin/rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchExtractionRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleExtraction = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (res.ok) {
        await fetchExtractionRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleSaveAssessment = (rule: AssessmentRule) => {
    if (editingRule) {
      setAssessmentRules(assessmentRules.map(r => r.id === rule.id ? rule : r));
    } else {
      setAssessmentRules([...assessmentRules, { ...rule, id: String(assessmentRules.length + 1) }]);
    }
    setEditingRule(null);
    setIsAdding(false);
  };

  const handleDeleteAssessment = (id: string) => {
    if (confirm('确定要删除此规则吗？')) {
      setAssessmentRules(assessmentRules.filter(r => r.id !== id));
    }
  };

  const handleToggleAssessment = (id: string) => {
    setAssessmentRules(assessmentRules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const getExtractionCategoryBadge = (category: string) => {
    const cat = extractionCategories.find(c => c.value === category);
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${cat?.color || 'bg-gray-100 text-gray-700'}`}>
        {cat?.label || category}
      </span>
    );
  };

  const getAssessmentCategoryBadge = (category: AssessmentRule['category']) => {
    const styles = {
      'hard-rejection': 'bg-red-100 text-red-700',
      'soft-rejection': 'bg-orange-100 text-orange-700',
      'scoring': 'bg-blue-100 text-blue-700',
      'risk': 'bg-yellow-100 text-yellow-700',
      'other': 'bg-gray-100 text-gray-700'
    };
    const labels = {
      'hard-rejection': '硬排斥',
      'soft-rejection': '软排斥',
      'scoring': '评分',
      'risk': '风险',
      'other': '其他'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[category]}`}>
        {labels[category]}
      </span>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">规则管理</h1>
          <p className="text-gray-500">管理投标决策系统的分析规则和提取规则</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchExtractionRules} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加规则
          </Button>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={activeTab === 'extraction' ? 'default' : 'outline'}
          onClick={() => setActiveTab('extraction')}
        >
          <Database className="h-4 w-4 mr-2" />
          数据提取规则
        </Button>
        <Button 
          variant={activeTab === 'assessment' ? 'default' : 'outline'}
          onClick={() => setActiveTab('assessment')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          AI评估规则
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        {activeTab === 'extraction' ? (
          extractionCategories.map(cat => (
            <Button 
              key={cat.value}
              variant={filter === cat.value ? 'default' : 'outline'}
              onClick={() => setFilter(cat.value)}
            >
              {cat.label}
            </Button>
          ))
        ) : (
          <>
            <Button 
              variant={filter === 'hard-rejection' ? 'default' : 'outline'}
              onClick={() => setFilter('hard-rejection')}
            >
              硬排斥
            </Button>
            <Button 
              variant={filter === 'soft-rejection' ? 'default' : 'outline'}
              onClick={() => setFilter('soft-rejection')}
            >
              软排斥
            </Button>
            <Button 
              variant={filter === 'scoring' ? 'default' : 'outline'}
              onClick={() => setFilter('scoring')}
            >
              评分
            </Button>
            <Button 
              variant={filter === 'risk' ? 'default' : 'outline'}
              onClick={() => setFilter('risk')}
            >
              风险
            </Button>
          </>
        )}
      </div>

      {/* 数据提取规则列表 */}
      {activeTab === 'extraction' && (
        <div className="space-y-4">
          {filteredExtractionRules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                暂无提取规则，请添加规则
              </CardContent>
            </Card>
          ) : (
            filteredExtractionRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{rule.name}</span>
                        {getExtractionCategoryBadge(rule.category)}
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? '启用' : '禁用'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">关键词：</span>
                        {rule.keywords.join('、')}
                      </div>
                      {rule.patterns.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">正则：</span>
                          {rule.patterns.join('、')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExtraction(rule.id, rule.isActive)}
                      >
                        {rule.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExtraction(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* AI评估规则列表 */}
      {activeTab === 'assessment' && (
        <div className="space-y-4">
          {filteredAssessmentRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      {getAssessmentCategoryBadge(rule.category)}
                      <Badge variant={rule.priority === 'high' ? 'destructive' : rule.priority === 'medium' ? 'default' : 'secondary'}>
                        {rule.priority === 'high' ? '高' : rule.priority === 'medium' ? '中' : '低'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">条件：</span>{rule.conditions}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">动作：</span>{rule.action}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAssessment(rule.id)}
                    >
                      {rule.enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(rule as any)}
                      >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssessment(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加/编辑规则弹窗 */}
      {(isAdding || editingRule) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingRule ? '编辑规则' : '添加规则'}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'extraction' ? (
                <ExtractionRuleForm
                  rule={editingRule}
                  onSave={handleSaveExtraction}
                  onCancel={() => {
                    setEditingRule(null);
                    setIsAdding(false);
                  }}
                />
              ) : (
                <AssessmentRuleForm
                  rule={editingRule as unknown as AssessmentRule}
                  onSave={handleSaveAssessment}
                  onCancel={() => {
                    setEditingRule(null);
                    setIsAdding(false);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ExtractionRuleForm({ 
  rule, 
  onSave, 
  onCancel 
}: { 
  rule: ExtractionRule | null;
  onSave: (rule: ExtractionRule) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ExtractionRule>(
    rule || {
      id: '',
      category: 'void-bid',
      name: '',
      keywords: [],
      patterns: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );
  const [keywordsInput, setKeywordsInput] = useState(rule?.keywords.join('\n') || '');
  const [patternsInput, setPatternsInput] = useState(rule?.patterns.join('\n') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      keywords: keywordsInput.split('\n').filter(k => k.trim()),
      patterns: patternsInput.split('\n').filter(p => p.trim()),
      updatedAt: new Date()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {extractionCategories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">关键词（每行一个）</label>
        <textarea
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={4}
          placeholder="废标&#10;无效报价&#10;否决"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">正则模式（每行一个）</label>
        <textarea
          value={patternsInput}
          onChange={(e) => setPatternsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={3}
          placeholder="废标[：:].+"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">启用规则</label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}

function AssessmentRuleForm({ 
  rule, 
  onSave, 
  onCancel 
}: { 
  rule: AssessmentRule | null;
  onSave: (rule: AssessmentRule) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<AssessmentRule>(
    rule || {
      id: '',
      name: '',
      category: 'other',
      description: '',
      enabled: true,
      priority: 'medium',
      conditions: '',
      action: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, updatedAt: new Date() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as AssessmentRule['category'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hard-rejection">硬排斥</option>
          <option value="soft-rejection">软排斥</option>
          <option value="scoring">评分</option>
          <option value="risk">风险</option>
          <option value="other">其他</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">触发条件</label>
        <input
          type="text"
          value={formData.conditions}
          onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">执行动作</label>
        <input
          type="text"
          value={formData.action}
          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="enabled" className="text-sm text-gray-700">启用规则</label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}
