import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai';
import { parseFile } from '@/lib/parsers';

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

// POST: 实时评分预测
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let content = '';
    let scoringCriteria = DEFAULT_CRITERIA;

    if (contentType.includes('multipart/form-data')) {
      // 文件上传模式
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: '请上传文件' }, { status: 400 });
      }

      const parsedDoc = await parseFile(file);
      content = parsedDoc.content;
    } else {
      // JSON模式（文本内容）
      const body = await request.json();
      content = body.content || '';
      if (body.criteria) {
        scoringCriteria = body.criteria;
      }
    }

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: '文档内容为空或无法解析' },
        { status: 400 }
      );
    }

    // 截取内容避免超出token限制
    const maxContentLength = 25000;
    const truncatedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength)
      : content;

    // 构建AI评分提示词
    const prompt = `你是一位资深的投标评审专家。请根据以下招标文件内容，对投标方案进行实时评分预测。

## 评分维度
${scoringCriteria.map((c: ScoringCriteria) => `- ${c.name}（权重${c.weight}%）：${c.description}`).join('\n')}

## 招标文件内容
${truncatedContent}

## 要求
请为每个评分维度打分（0-100分），并给出具体建议。格式如下：

## 技术方案
- 得分：XX/100
- 建议：...

## 商务资质
- 得分：XX/100
- 建议：...

## 报价合理性
- 得分：XX/100
- 建议：...

## 项目团队
- 得分：XX/100
- 建议：...

## 服务承诺
- 得分：XX/100
- 建议：...

## 综合评价
- 预测总分：XX/100
- 整体建议：...

请开始评分：`;

    // 调用AI进行评分
    const aiService = getAIService();
    console.log('[Scoring] 调用AI服务进行评分...');
    const aiResponse = await aiService.analyze(prompt, undefined, {
      maxTokens: 2048,
    });
    console.log('[Scoring] AI响应内容:', aiResponse.content.substring(0, 500));

    // 解析AI评分结果
    const results = parseScoringResults(aiResponse.content, scoringCriteria);
    console.log('[Scoring] 解析结果:', JSON.stringify(results));

    // 计算加权总分
    let totalScore = 0;
    results.forEach((result, index) => {
      const weight = scoringCriteria[index]?.weight || 20;
      totalScore += (result.score / 100) * weight;
    });

    return NextResponse.json({
      results,
      totalScore: Math.round(totalScore),
      rawResponse: aiResponse.content,
      criteria: scoringCriteria,
    });
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
