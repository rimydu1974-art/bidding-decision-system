'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface IndustryRule {
  id: string;
  category: string;
  title: string;
  content: string;
  industry: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categories = [
  { value: '投标流程', label: '投标流程', color: 'bg-blue-100 text-blue-700' },
  { value: '资格要求', label: '资格要求', color: 'bg-green-100 text-green-700' },
  { value: '技术标准', label: '技术标准', color: 'bg-purple-100 text-purple-700' },
  { value: '商务要求', label: '商务要求', color: 'bg-orange-100 text-orange-700' },
];

const industries = [
  { value: '军队采购', label: '军队采购' },
  { value: '政府采购', label: '政府采购' },
  { value: '企业采购', label: '企业采购' },
  { value: null, label: '通用' },
];

export default function IndustryRulesPage() {
  const [rules, setRules] = useState<IndustryRule[]>([]);
  const [editingRule, setEditingRule] = useState<IndustryRule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/industry-rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesCategory = filter === 'all' || rule.category === filter;
    const matchesIndustry = industryFilter === 'all' || rule.industry === industryFilter;
    const matchesSearch = searchTerm === '' || 
      rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesIndustry && matchesSearch;
  });

  const handleSave = async (rule: IndustryRule) => {
    try {
      const method = rule.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/industry-rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchRules();
        setEditingRule(null);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此规则吗？')) return;
    try {
      const res = await fetch(`/api/admin/industry-rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/industry-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (res.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${cat?.color || 'bg-gray-100 text-gray-700'}`}>
        {cat?.label || category}
      </span>
    );
  };

  const getIndustryBadge = (industry: string | null) => {
    const ind = industries.find(i => i.value === industry);
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
        {ind?.label || '通用'}
      </span>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">行业规则管理</h1>
          <p className="text-gray-500">管理各行业投标规则和自查清单</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRules} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加规则
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索规则标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有分类</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有行业</option>
            {industries.map(ind => (
              <option key={ind.value || 'all'} value={ind.value || 'all'}>{ind.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              暂无行业规则，请添加规则
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{rule.title}</span>
                      {getCategoryBadge(rule.category)}
                      {getIndustryBadge(rule.industry)}
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? '启用' : '禁用'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{rule.content}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      创建时间：{new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(rule.id, rule.isActive)}
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
                      onClick={() => handleDelete(rule.id)}
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

      {/* 添加/编辑规则弹窗 */}
      {(isAdding || editingRule) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingRule ? '编辑规则' : '添加规则'}</CardTitle>
            </CardHeader>
            <CardContent>
              <RuleForm
                rule={editingRule}
                onSave={handleSave}
                onCancel={() => {
                  setEditingRule(null);
                  setIsAdding(false);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RuleForm({ 
  rule, 
  onSave, 
  onCancel 
}: { 
  rule: IndustryRule | null;
  onSave: (rule: IndustryRule) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<IndustryRule>(
    rule || {
      id: '',
      category: '投标流程',
      title: '',
      content: '',
      industry: null,
      isActive: true,
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
        <label className="block text-sm font-medium text-gray-700 mb-1">规则标题</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">行业分类</label>
          <select
            value={formData.industry || ''}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {industries.map(ind => (
              <option key={ind.value || 'all'} value={ind.value || ''}>{ind.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">规则内容</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={8}
          required
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
