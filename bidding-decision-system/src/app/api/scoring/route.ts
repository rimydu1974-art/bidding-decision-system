import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/call-ai';
import { parseFile } from '@/lib/parsers';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { checkAiQuota, incrementAiUsage } from '@/lib/quota';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ScoringCriteria {
  name: string;
  weight: number;
  description: string;
}

interface ScoringResult {
  criteria: string;
  score: number;
  maxScore: number;
  suggestion: string;
  status: 'good' | 'warning' | 'bad';
}

const DEFAULT_CRITERIA: ScoringCriteria[] = [
  { name: '技术方案', weight: 30, description: '技术路线、实施方案、创新点' },
  { name: '商务资质', weight: 25, description: '企业资质、业绩案例、财务状况' },
  { name: '报价合理性', weight: 20, description: '价格竞争力、成本分析' },
  { name: '项目团队', weight: 15, description: '人员配置、经验能力' },
  { name: '服务承诺', weight: 10, description: '售后服务、质量保证' },
];

const FILE_CATEGORIES: Record<string, string> = {
  tender: '招标文件',
  qualification: '资质证明文件',
  price: '价格文件',
  technical: '商务技术文件',
  other: '其他文件',
};

// POST: 实时评分预测
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 检查额度
    const quotaCheck = await checkAiQuota(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let allContent = '';
    let projectId: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // 多文件上传模式
      const formData = await request.formData();
      projectId = formData.get('projectId') as string | null;
      const projectName = formData.get('projectName') as string || '投标文件';

      // 支持两种文件上传模式
      const fileCount = parseInt(formData.get('fileCount') as string) || 0;
      const files = formData.getAll('files') as File[];

      if (fileCount === 0 && files.length === 0) {
        return NextResponse.json({ error: '请上传投标文件' }, { status: 400 });
      }

      // 解析所有文件
      if (files.length > 0) {
        // 新模式：files 数组
        for (const file of files) {
          if (file.size > 100 * 1024 * 1024) {
            return NextResponse.json(
              { error: `文件 ${file.name} 超过100MB大小限制` },
              { status: 400 }
            );
          }
          const parsedDoc = await parseFile(file);
          allContent += `\n\n=== 投标文件: ${file.name} ===\n${parsedDoc.content}`;
        }
      } else {
        // 旧模式：file_${i}
        for (let i = 0; i < fileCount; i++) {
          const file = formData.get(`file_${i}`) as File;
          const category = formData.get(`category_${i}`) as string;

          if (file) {
            if (file.size > 100 * 1024 * 1024) {
              return NextResponse.json(
                { error: `文件 ${file.name} 超过100MB大小限制` },
                { status: 400 }
              );
            }
            const parsedDoc = await parseFile(file);
            const categoryLabel = FILE_CATEGORIES[category] || category;
            allContent += `\n\n=== ${categoryLabel}: ${file.name} ===\n${parsedDoc.content}`;
          }
        }
      }
    } else {
      // JSON模式
      const body = await request.json();
      allContent = body.content || '';
      projectId = body.projectId || null;
    }

    if (!allContent || allContent.length < 10) {
      return NextResponse.json(
        { error: '文档内容为空或无法解析' },
        { status: 400 }
      );
    }

    // 截取内容避免超出token限制
    const maxContentLength = 25000;
    const truncatedContent = allContent.length > maxContentLength
      ? allContent.substring(0, maxContentLength)
      : allContent;

    // 第一步：从招标文件中提取评分标准
    const extractPrompt = `你是一位资深的投标评审专家。请从招标文件中提取评分标准/评分细则。

## 文件内容
${truncatedContent}

## 要求
请仔细阅读招标文件，找到评分标准部分，提取以下信息：
1. 评分维度名称（如：技术方案、商务资质、报价等）
2. 每个维度的满分分值
3. 评分要点/评分细则

请以JSON格式返回，格式如下：
{
  "scoringCriteria": [
    {
      "name": "评分维度名称",
      "maxScore": 该维度满分分值,
      "description": "评分要点描述"
    }
  ]
}

重要：
- 请从招标文件中找到真实的评分标准
- 如果文件中有"评分办法"、"评分标准"、"评分细则"等章节，请重点关注
- 每个维度的maxScore是该维度的满分分值，不是百分比

请返回JSON：`;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // AI调用辅助函数
    const callAIWithQuota = async (prompt: string, maxTokens: number) => {
      return callAI({
        userId: session.user.id,
        prompt,
        useUserApiKey: !!(quotaCheck.useUserApiKey && user?.userApiKey),
        userApiKey: user?.userApiKey || undefined,
        maxTokens,
        temperature: 0.1,
      });
    };

    console.log('[Scoring] 步骤1: 提取评分标准...');

    const extractResponse = await callAIWithQuota(extractPrompt, 1024);
    console.log('[Scoring] 评分标准响应:', extractResponse.content.substring(0, 500));

    // 解析评分标准
    let scoringCriteria: ScoringCriteria[] = DEFAULT_CRITERIA;
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = extractResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.scoringCriteria && Array.isArray(parsed.scoringCriteria)) {
          scoringCriteria = parsed.scoringCriteria.map((item: {
            name: string;
            maxScore: number;
            description: string;
          }) => ({
            name: item.name,
            weight: item.maxScore, // 这里weight存储的是满分分值
            description: item.description,
          }));
        }
      }
    } catch (e) {
      console.log('[Scoring] 解析评分标准失败，使用默认标准', e);
    }

    console.log('[Scoring] 使用评分标准:', JSON.stringify(scoringCriteria));

    // 第二步：根据评分标准进行评分
    const scoringPrompt = `你是一位资深的投标评审专家。请根据以下招标文件的评分标准，对投标方案进行评分。

## 评分标准
${scoringCriteria.map((c: ScoringCriteria) => `- ${c.name}（满分${c.weight}分）：${c.description}`).join('\n')}

## 招标文件内容
${truncatedContent}

## 要求
请严格按照评分标准，为每个维度打分。格式如下：

## 评分结果

### 1. ${scoringCriteria[0]?.name || '技术方案'}
- 得分：XX/${scoringCriteria[0]?.weight || 100}
- 评分依据：...
- 扣分原因：...（如有）

### 2. ${scoringCriteria[1]?.name || '商务资质'}
- 得分：XX/${scoringCriteria[1]?.weight || 100}
- 评分依据：...
- 扣分原因：...（如有）

（依次类推）

## 综合评价
- 预测总分：XX/${scoringCriteria.reduce((sum, c) => sum + c.weight, 0)}
- 整体评价：...
- 建议改进点：...

请开始评分：`;

    console.log('[Scoring] 步骤2: 进行评分...');
    const scoringResponse = await callAIWithQuota(scoringPrompt, 2048);
    console.log('[Scoring] 评分响应:', scoringResponse.content.substring(0, 500));

    // 增加使用次数
    await incrementAiUsage(session.user.id);

    // 解析评分结果
    const results = parseScoringResults(scoringResponse.content, scoringCriteria);
    console.log('[Scoring] 解析结果:', JSON.stringify(results));

    // 计算总分（直接累加，因为weight存储的是分值）
    const totalMaxScore = scoringCriteria.reduce((sum, c) => sum + c.weight, 0);
    let totalScore = 0;
    results.forEach((result) => {
      totalScore += result.score;
    });

    const responseData: Record<string, unknown> = {
      results,
      totalScore: Math.round(totalScore),
      totalMaxScore,
      rawResponse: scoringResponse.content,
      criteria: scoringCriteria,
    };

    // 如果有projectId，保存投标分析到Assessment
    if (projectId) {
      try {
        const assessment = await prisma.assessment.findUnique({
          where: { id: projectId },
        });

        if (assessment && assessment.userId === session.user.id) {
          const existingAiResult = assessment.aiResult ? JSON.parse(assessment.aiResult as string) : {};
          const bidAnalysis = {
            scoringResults: results,
            totalScore: Math.round(totalScore),
            totalMaxScore,
            rawResponse: scoringResponse.content,
            criteria: scoringCriteria,
            analyzedAt: new Date().toISOString(),
          };

          await prisma.assessment.update({
            where: { id: projectId },
            data: {
              aiResult: JSON.stringify({
                ...existingAiResult,
                bidAnalysis,
              }),
            },
          });

          // 更新项目标记
          await prisma.project.updateMany({
            where: {
              id: projectId,
              userId: session.user.id,
            },
            data: {
              hasBidAnalysis: true,
            },
          });

          responseData.projectId = projectId;
          responseData.analysisType = 'deep';
          console.log('[Scoring] 已保存投标分析到项目:', projectId);
        }
      } catch (saveError) {
        console.error('[Scoring] 保存投标分析失败:', saveError);
        // 不影响返回结果
      }
    } else {
      responseData.analysisType = 'shallow';
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Scoring prediction error:', error);
    return NextResponse.json(
      { error: '评分预测失败' },
      { status: 500 }
    );
  }
}

function parseScoringResults(
  aiResponse: string,
  criteria: ScoringCriteria[]
): ScoringResult[] {
  const results: ScoringResult[] = [];

  for (const criterion of criteria) {
    let score = 60; // 默认值
    let suggestion = '暂无具体建议';

    // 尝试多种正则匹配分数
    const patterns = [
      // 匹配 "技术方案\n- 得分：85/100" 或 "技术方案：85分"
      new RegExp(`${criterion.name}[：:]*\\s*[\\-\\s]*(?:得分|分数|评分)[：:]\\s*(\\d+)\\s*[/／]?\\s*100?`, 'i'),
      // 匹配 "技术方案 85分"
      new RegExp(`${criterion.name}[：:]*\\s*(\\d+)\\s*分`, 'i'),
      // 匹配 "技术方案：85"
      new RegExp(`${criterion.name}[：:]\\s*(\\d+)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        score = parseInt(match[1]);
        if (score >= 0 && score <= 100) break;
      }
    }

    // 尝试提取建议
    const suggestionPatterns = [
      // 匹配 "建议：xxx" 或 "建议:xxx"
      new RegExp(`${criterion.name}[\\s\\S]*?(?:建议|点评|评语)[：:]\\s*([\\s\\S]*?)(?=\\n##|\\n\\n|$)`, 'i'),
      // 匹配 "技术方案...建议：xxx"
      new RegExp(`(?:建议|点评)[：:]\\s*([\\s\\S]*?)(?=\\n##|\\n\\n|$)`, 'i'),
    ];

    for (const pattern of suggestionPatterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1].trim().length > 5) {
        suggestion = match[1].trim().substring(0, 200);
        break;
      }
    }

    let status: 'good' | 'warning' | 'bad' = 'good';
    if (score < 60) status = 'bad';
    else if (score < 80) status = 'warning';

    results.push({
      criteria: criterion.name,
      score,
      maxScore: 100,
      suggestion,
      status,
    });
  }

  return results;
}
