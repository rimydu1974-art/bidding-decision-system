'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Eye, EyeOff, Key, Book, BarChart3, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  curlExample: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/analyze',
    title: '投标分析',
    description: '对招标文件进行智能分析，提取关键信息和评分要点。',
    parameters: [
      { name: 'fileUrl', type: 'string', required: true, description: '招标文件URL地址' },
      { name: 'projectId', type: 'string', required: false, description: '关联项目ID' },
      { name: 'options', type: 'object', required: false, description: '分析选项配置' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "fileUrl": "https://example.com/bidding-doc.pdf",
    "projectId": "proj_12345"
  }'`,
  },
  {
    method: 'POST',
    path: '/api/scoring',
    title: '智能评分',
    description: '基于AI模型对投标文件进行自动评分和评估。',
    parameters: [
      { name: 'documentId', type: 'string', required: true, description: '投标文档ID' },
      { name: 'criteria', type: 'array', required: false, description: '评分标准列表' },
      { name: 'weightConfig', type: 'object', required: false, description: '权重配置' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/scoring \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "documentId": "doc_67890",
    "criteria": ["技术方案", "商务报价", "服务承诺"]
  }'`,
  },
  {
    method: 'POST',
    path: '/api/ai-write',
    title: 'AI写作',
    description: '利用AI生成投标文档内容，包括技术方案和商务文件。',
    parameters: [
      { name: 'template', type: 'string', required: true, description: '文档模板类型' },
      { name: 'content', type: 'string', required: true, description: '生成内容的提示描述' },
      { name: 'style', type: 'string', required: false, description: '写作风格' },
    ],
    curlExample: `curl -X POST https://your-domain.com/api/ai-write \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "template": "technical_proposal",
    "content": "为智慧城市项目编写技术方案",
    "style": "professional"
  }'`,
  },
  {
    method: 'GET',
    path: '/api/knowledge',
    title: '知识库查询',
    description: '查询投标知识库，获取相关案例和最佳实践。',
    parameters: [
      { name: 'query', type: 'string', required: true, description: '搜索关键词' },
      { name: 'category', type: 'string', required: false, description: '知识分类' },
      { name: 'limit', type: 'number', required: false, description: '返回结果数量限制' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/knowledge?query=投标策略&category=best_practices&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: 'GET',
    path: '/api/projects',
    title: '项目列表',
    description: '获取所有投标项目的列表信息。',
    parameters: [
      { name: 'status', type: 'string', required: false, description: '项目状态筛选' },
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'pageSize', type: 'number', required: false, description: '每页数量' },
    ],
    curlExample: `curl -X GET "https://your-domain.com/api/projects?status=active&page=1&pageSize=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'POST':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'DELETE':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ApiDocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'stats'>('docs');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: '生产环境密钥',
      key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: '2024-01-15',
      lastUsed: '2024-03-10',
    },
    {
      id: '2',
      name: '测试环境密钥',
      key: 'sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
      createdAt: '2024-02-01',
      lastUsed: '2024-03-08',
    },
  ]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateKey = () => {
    if (newKeyName.trim()) {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk-${Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: '从未使用',
      };
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setShowNewKeyForm(false);
    }
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
  };

  const stats = {
    totalRequests: 15234,
    todayRequests: 342,
    avgResponseTime: 245,
    successRate: 98.7,
    monthlyUsage: [
      { month: '1月', requests: 1200 },
      { month: '2月', requests: 1890 },
      { month: '3月', requests: 2340 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API 开放平台</h1>
              <p className="text-sm text-gray-500">投标决策系统 API 文档与管理</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'docs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Book className="h-4 w-4" />
            API文档
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-4 w-4" />
            API密钥
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            使用统计
          </button>
        </div>

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  认证说明
                </CardTitle>
                <CardDescription>
                  所有API请求需要在请求头中携带API密钥进行认证
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                  <span className="text-gray-400">// 请求头格式</span>
                  <br />
                  <span className="text-green-400">Authorization</span>
                  <span className="text-gray-300">: </span>
                  <span className="text-yellow-300">Bearer YOUR_API_KEY</span>
                </div>
              </CardContent>
            </Card>

            {endpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getMethodColor(endpoint.method)} font-mono`}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <CardTitle className="mt-2">{endpoint.title}</CardTitle>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">参数说明</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">参数名</th>
                            <th className="text-left px-4 py-2 font-medium">类型</th>
                            <th className="text-left px-4 py-2 font-medium">必填</th>
                            <th className="text-left px-4 py-2 font-medium">描述</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {endpoint.parameters.map((param, pIndex) => (
                            <tr key={pIndex}>
                              <td className="px-4 py-2 font-mono text-sm">{param.name}</td>
                              <td className="px-4 py-2 text-gray-600">{param.type}</td>
                              <td className="px-4 py-2">
                                {param.required ? (
                                  <Badge variant="destructive" className="text-xs">必填</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">可选</Badge>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-600">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">cURL 示例</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.curlExample)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
                      {endpoint.curlExample}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API 密钥管理</CardTitle>
                <CardDescription>创建和管理您的API访问密钥</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Button onClick={() => setShowNewKeyForm(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    创建新密钥
                  </Button>
                </div>

                {showNewKeyForm && (
                  <Card className="mb-6 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="输入密钥名称..."
                          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button onClick={handleCreateKey}>创建</Button>
                        <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Key className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{apiKey.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(apiKey.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                        {showKeys[apiKey.id]
                          ? apiKey.key
                          : apiKey.key.replace(/./g, '*').slice(0, 20) + '...'}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>创建时间: {apiKey.createdAt}</span>
                        <span>最后使用: {apiKey.lastUsed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">总请求数</div>
                  <div className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">今日请求</div>
                  <div className="text-3xl font-bold">{stats.todayRequests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">平均响应时间</div>
                  <div className="text-3xl font-bold">{stats.avgResponseTime}ms</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500">成功率</div>
                  <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>月度使用趋势</CardTitle>
                <CardDescription>最近三个月的API调用统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.monthlyUsage.map((month, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-12 text-sm text-gray-500">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(month.requests / 3000) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {month.requests.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  API 状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">所有服务运行正常</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
