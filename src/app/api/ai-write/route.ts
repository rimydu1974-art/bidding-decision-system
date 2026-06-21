import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { checkAiQuota, incrementAiUsage } from '@/lib/quota';

const WRITE_PROMPTS: Record<string, string> = {
  '技术方案': `你是一位资深的技术方案编写专家。请根据以下招标文件和项目信息，编写一份完整的技术方案。

## 要求
1. 包含项目理解、技术路线、实施计划、质量保证、人员配置等章节
2. 语言专业、逻辑清晰
3. 突出技术优势和创新点
4. 内容要详细，至少3000字

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 技术要求
{requirements}

## 公司资质
{companyQual}

请生成完整的技术方案：`,

  '商务文件': `你是一位资深的商务文件编写专家。请根据以下信息编写完整的商务文件。

## 要求
1. 包含公司介绍、服务承诺、报价说明、售后保障等
2. 语言正式、格式规范
3. 突出公司优势和竞争力
4. 内容要详细，至少2000字

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 企业信息
{companyInfo}

## 报价信息
{priceInfo}

请生成完整的商务文件：`,

  '投标函': `你是一位资深的投标文件编写专家。请根据以下信息编写正式的投标函。

## 要求
1. 格式规范，符合投标函标准格式
2. 包含投标声明、报价、有效期、承诺等要素
3. 语言正式、措辞严谨
4. 法律效力明确

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 报价信息
{priceInfo}

## 投标人信息
{bidderInfo}

请生成投标函：`,

  '资质证明': `你是一位资深的投标文件编写专家。请根据以下信息编写资质证明文件说明。

## 要求
1. 列出需要准备的资质文件清单
2. 说明每个资质文件的用途和重要性
3. 标注哪些是必备资质、哪些是加分项
4. 提供资质准备建议

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 资质要求
{qualificationReqs}

## 公司现有资质
{companyQual}

请生成资质证明文件清单和准备建议：`,

  '风险应对': `你是一位资深的投标风险管理专家。请根据以下信息编写风险应对方案。

## 要求
1. 识别项目潜在风险（技术风险、商务风险、执行风险等）
2. 针对每个风险提供具体应对措施
3. 包含风险监控计划
4. 提供风险预警机制

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 已识别风险
{risks}

请生成完整的风险应对方案：`,

  '完整标书': `你是一位资深的投标文件编写专家。请根据招标文件和项目信息，生成一份完整的投标文件大纲和核心内容。

## 要求
1. 按照标准投标文件结构生成
2. 包含所有必要章节
3. 每个章节提供详细的内容框架和核心要点
4. 标注需要用户补充的内容
5. 生成的内容可直接用于投标

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 公司信息
{companyInfo}

## 报价信息
{priceInfo}

请生成完整的投标文件：`,
};

// GET: 获取可用的写作文档类型
export async function GET() {
  return NextResponse.json({
    types: Object.keys(WRITE_PROMPTS).map((key) => ({
      id: key,
      name: key,
      description: getDocDescription(key),
    })),
  });
}

function getDocDescription(type: string): string {
  const descriptions: Record<string, string> = {
    '技术方案': '技术路线、实施计划、质量保证方案',
    '商务文件': '公司介绍、服务承诺、报价说明',
    '投标函': '正式投标函、投标声明',
    '资质证明': '资质文件清单、准备建议',
    '风险应对': '风险识别、应对措施、监控计划',
    '完整标书': '投标文件完整框架和核心内容',
  };
  return descriptions[type] || `生成${type}文档`;
}

// POST: 生成标书文档
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 检查AI额度
    const quotaCheck = await checkAiQuota(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const {
      type,
      tenderSummary,
      projectInfo,
      requirements,
      companyInfo,
      companyQual,
      priceInfo,
      qualificationReqs,
      risks,
      bidderInfo,
      knowledgeIds,
    } = await request.json();

    if (!type || !WRITE_PROMPTS[type]) {
      return NextResponse.json({ error: '未知的文档类型' }, { status: 400 });
    }

    // 获取知识库内容作为参考
    let knowledgeContent = '';
    if (knowledgeIds && knowledgeIds.length > 0) {
      const knowledgeItems = await prisma.knowledgeItem.findMany({
        where: {
          id: { in: knowledgeIds },
          userId: session.user.id,
        },
      });

      knowledgeContent = knowledgeItems
        .map((item) => `【${item.title}】\n${item.content}`)
        .join('\n\n');
    }

    // 构建提示词
    let prompt = WRITE_PROMPTS[type];
    prompt = prompt.replace('{tenderSummary}', tenderSummary || '未提供');
    prompt = prompt.replace('{projectInfo}', projectInfo || '未提供');
    prompt = prompt.replace('{requirements}', requirements || '未提供');
    prompt = prompt.replace('{companyInfo}', companyInfo || '未提供');
    prompt = prompt.replace('{companyQual}', companyQual || '未提供');
    prompt = prompt.replace('{priceInfo}', priceInfo || '未提供');
    prompt = prompt.replace('{qualificationReqs}', qualificationReqs || '未提供');
    prompt = prompt.replace('{risks}', risks || '未提供');
    prompt = prompt.replace('{bidderInfo}', bidderInfo || '未提供');

    if (knowledgeContent) {
      prompt += `\n\n## 参考知识库内容\n${knowledgeContent}`;
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // 调用AI生成
    let aiResponse;

    if (quotaCheck.useUserApiKey && user?.userApiKey) {
      // 使用用户自己的API Key
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.userApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      aiResponse = {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
      };
    } else {
      // 使用平台API
      const aiService = getAIService();
      aiResponse = await aiService.analyze(prompt, undefined, {
        maxTokens: 4096,
      });
    }

    // 增加使用次数
    await incrementAiUsage(session.user.id);

    return NextResponse.json({
      content: aiResponse.content,
      type,
      usage: aiResponse.usage,
    });
  } catch (error) {
    console.error('AI write error:', error);
    return NextResponse.json(
      { error: '生成文档失败' },
      { status: 500 }
    );
  }
}
