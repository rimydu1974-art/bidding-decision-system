'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadFileToStorage, formatFileSize } from '@/lib/chunk-upload';
import {
  ArrowLeft,
  FileText,
  Upload,
  X,
  File,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface UploadedFile {
  file: File;
  category: string;
}

const FILE_CATEGORIES = [
  { id: 'tender', name: '招标文件', description: '招标文件（用于提取评分标准）' },
  { id: 'qualification', name: '资质证明文件', description: '企业资质、证书、业绩等' },
  { id: 'price', name: '价格文件', description: '报价单、成本分析等' },
  { id: 'technical', name: '商务技术文件', description: '技术方案、实施方案等' },
];

export default function ScoringPage() {
  const router = useRouter();
  const [scoring, setScoring] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('tender');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      newFiles.push({
        file: files[i],
        category: selectedCategory,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const hasTender = uploadedFiles.some((f) => f.category === 'tender');
    if (!hasTender) {
      alert('请先上传招标文件（用于提取评分标准）');
      return;
    }

    setLoading(true);
    try {
      // Upload all files using Supabase Storage
      const formData = new FormData();
      for (let i = 0; i < uploadedFiles.length; i++) {
        const item = uploadedFiles[i];
        const uploadResult = await uploadFileToStorage(item.file, (progress) => {
          console.log(`Upload ${item.file.name}: ${progress.percent}%`);
        });
        if (uploadResult.complete) {
          formData.append(`fileUrl_${i}`, uploadResult.fileUrl);
          formData.append(`fileName_${i}`, item.file.name);
          formData.append(`category_${i}`, item.category);
        }
      }
      formData.append('fileCount', uploadedFiles.length.toString());

      const scoringResponse = await fetch('/api/scoring', { method: 'POST', body: formData });

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
            <Card>
              <CardHeader>
                <CardTitle>投标文件评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold">上传招标文件</h3>
                    <p className="text-sm text-gray-600">
                      上传招标文件，AI自动提取评分标准和权重
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Upload className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold">上传投标文件</h3>
                    <p className="text-sm text-gray-600">
                      上传您的投标文件（资质、报价、技术方案等）
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <FileText className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold">智能评分</h3>
                    <p className="text-sm text-gray-600">
                      AI根据评分标准自动评分，给出预测得分和改进建议
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>上传文件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  必须上传招标文件，AI将从中提取评分标准和权重
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择文件类型
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FILE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-2 rounded-lg text-left text-sm ${
                          selectedCategory === cat.id
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-gray-500">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    选择文件
                  </Button>
                  <span className="text-sm text-gray-500">
                    支持 PDF、Word、Excel 格式，可多选
                  </span>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      已选文件 ({uploadedFiles.length}个)
                    </label>
                    <div className="space-y-2">
                      {uploadedFiles.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium text-sm">{item.file.name}</div>
                              <div className="text-xs text-gray-500">
                                {FILE_CATEGORIES.find((c) => c.id === item.category)?.name}
                                {' · '}
                                {(item.file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={uploadedFiles.length === 0 || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      分析中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      开始评分预测
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setScoring(null)}>
              ← 重新上传
            </Button>

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

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{result.suggestion}</p>
                      </div>

                      <div className="mt-3">{getStatusBadge(result.score)}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

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
