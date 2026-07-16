'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Search,
  Trash2,
  Eye,
  FileText,
  Building2,
  Eye as EyeIcon,
} from 'lucide-react';

interface CaseItem {
  id: string;
  title: string;
  source: string;
  industry: string | null;
  content: string;
  summary: string | null;
  status: string;
  isPublic: boolean;
  expertComment: string | null;
  tags: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface IndustryStat {
  name: string;
  count: number;
}

interface SourceStat {
  name: string;
  count: number;
}

export default function CasesAdminPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [industries, setIndustries] = useState<IndustryStat[]>([]);
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [selectedItem, setSelectedItem] = useState<CaseItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (industryFilter !== 'all') params.set('industry', industryFilter);

      const res = await fetch(`/api/admin/cases?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setIndustries(data.industries);
        setSources(data.sources);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, industryFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此招标案例吗？')) return;
    try {
      const res = await fetch(`/api/admin/cases?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  };

  const getIndustryBadge = (industry: string | null) => {
    if (!industry) {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
          未分类
        </span>
      );
    }
    const colors: Record<string, string> = {
      办公用品: 'bg-purple-100 text-purple-700',
      三维模型: 'bg-indigo-100 text-indigo-700',
      医疗耗材: 'bg-red-100 text-red-700',
      教育培训: 'bg-yellow-100 text-yellow-700',
      环保监测: 'bg-green-100 text-green-700',
      物业服务: 'bg-blue-100 text-blue-700',
      养老服务: 'bg-pink-100 text-pink-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[industry] || 'bg-gray-100 text-gray-700'}`}>
        {industry}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      published: '已发布',
      pending: '待审核',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">招标案例管理</h1>
          <p className="text-gray-500">管理所有招标案例（共 {total.toLocaleString()} 条）</p>
        </div>
        <Button variant="outline" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总案例数</p>
                <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">行业数</p>
                <p className="text-2xl font-bold">{industries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <EyeIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总浏览量</p>
                <p className="text-2xl font-bold">
                  {items.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有行业</option>
            {industries.map(ind => (
              <option key={ind.name} value={ind.name}>{ind.name} ({ind.count})</option>
            ))}
          </select>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </div>

      {/* 案例列表 */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              加载中...
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              暂无招标案例
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      {getIndustryBadge(item.industry)}
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {item.summary || item.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>来源: {item.source}</span>
                      <span>浏览: {item.views}</span>
                      <span>创建时间: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
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

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            共 {total.toLocaleString()} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedItem.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {getIndustryBadge(selectedItem.industry)}
                {getStatusBadge(selectedItem.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">摘要</p>
                <p className="text-sm">{selectedItem.summary || '无'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">内容</p>
                <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
              </div>
              {selectedItem.expertComment && (
                <div>
                  <p className="text-sm text-gray-500">专家点评</p>
                  <p className="text-sm">{selectedItem.expertComment}</p>
                </div>
              )}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>来源: {selectedItem.source}</span>
                <span>浏览: {selectedItem.views}</span>
                <span>公开: {selectedItem.isPublic ? '是' : '否'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
