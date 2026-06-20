import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai';

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
    const { content, criteria } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '请提供文档内容' }, { status: 400 });
    }

    const scoringCriteria = criteria || DEFAULT_CRITERIA;

    // 构建AI评分提示词
    const prompt = `你是一位资深的投标评审专家。请根据以下招标文件内容，对投标方案进行实时评分预测。

## 评分维度
${scoringCriteria.map((c: ScoringCriteria) => `- ${c.name}（权重${c.weight}%）：${c.description}`).join('\n')}

## 招标文件内容
${content.substring(0, 3000)}

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
    const aiResponse = await aiService.analyze(prompt, undefined, {
      maxTokens: 2048,
    });

    // 解析AI评分结果
    const results = parseScoringResults(aiResponse.content, scoringCriteria);

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
    // 尝试从AI响应中提取分数
    const scoreRegex = new RegExp(
      `${criterion.name}[\\s\\S]*?(?:得分|分数)[：:]\\s*(\\d+)\\s*/?\\s*100`,
      'i'
    );
    const scoreMatch = aiResponse.match(scoreRegex);

    const suggestionRegex = new RegExp(
      `${criterion.name}[\\s\\S]*?建议[：:]\\s*([\\s\\S]*?)(?=##|\\z)`,
      'i'
    );
    const suggestionMatch = aiResponse.match(suggestionRegex);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 60;
    const suggestion = suggestionMatch
      ? suggestionMatch[1].trim().substring(0, 200)
      : '暂无具体建议';

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
