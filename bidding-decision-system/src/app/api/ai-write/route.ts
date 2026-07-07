import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/call-ai';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
import { checkAiQuota, incrementAiUsage } from '@/lib/quota';

const WRITE_PROMPTS: Record<string, string> = {
  '商务技术文件': `你是一位资深的投标文件编写专家。请根据以下招标文件和项目信息，编写商务技术文件。

## 要求
1. 包含投标函（投标声明、报价、有效期、承诺）
2. 技术方案（项目理解、技术路线、实施计划、质量保证、人员配置）
3. 商务文件（公司介绍、服务承诺、售后保障）
4. 语言专业、逻辑清晰
5. 格式规范、符合投标文件标准
6. 内容要详细，至少3000字
7. 标注需要用户补充的内容

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 技术要求
{requirements}

## 公司信息
{companyInfo}

## 公司资质
{companyQual}

## 报价信息
{priceInfo}

## 知识库参考
{knowledgeContent}

请生成完整的商务技术文件：`,

  '资质证明文件': `你是一位资深的投标文件编写专家。请根据以下信息编写资质证明文件清单和准备建议。

## 要求
1. 列出需要准备的资质文件清单
2. 说明每个资质文件的用途和重要性
3. 标注哪些是必备资质、哪些是加分项
4. 提供资质准备建议
5. 说明如何从知识库中获取现有资质

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 资质要求
{qualificationReqs}

## 公司现有资质
{companyQual}

## 知识库参考
{knowledgeContent}

请生成资质证明文件清单和准备建议：`,

  '报价文件': `你是一位资深的投标报价专家。请根据以下信息编写报价文件。

## 要求
1. 包含报价表、成本分析、报价说明
2. 报价策略建议
3. 报价文件格式规范
4. 价格分计算分析
5. 报价注意事项

## 招标文件摘要
{tenderSummary}

## 项目信息
{projectInfo}

## 公司信息
{companyInfo}

## 报价信息
{priceInfo}

## 评分规则中的价格分
{requirements}

## 知识库参考
{knowledgeContent}

请生成完整的报价文件：`,
};

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
    '商务技术文件': '投标函+技术方案+商务文件，完整框架和核心内容',
    '资质证明文件': '资质文件清单、准备建议、获取方式',
    '报价文件': '报价表、成本分析、报价策略',
  };
  return descriptions[type] || `生成${type}文档`;
}

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
      knowledgeIds,
    } = await request.json();

    if (!type || !WRITE_PROMPTS[type]) {
      return NextResponse.json({ error: '未知的文档类型' }, { status: 400 });
    }

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

    let prompt = WRITE_PROMPTS[type];
    prompt = prompt.replace('{tenderSummary}', tenderSummary || '未提供');
    prompt = prompt.replace('{projectInfo}', projectInfo || '未提供');
    prompt = prompt.replace('{requirements}', requirements || '未提供');
    prompt = prompt.replace('{companyInfo}', companyInfo || '未提供');
    prompt = prompt.replace('{companyQual}', companyQual || '未提供');
    prompt = prompt.replace('{priceInfo}', priceInfo || '未提供');
    prompt = prompt.replace('{qualificationReqs}', qualificationReqs || '未提供');
    prompt = prompt.replace('{risks}', risks || '未提供');
    prompt = prompt.replace('{knowledgeContent}', knowledgeContent || '未提供');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const aiResponse = await callAI({
      userId: session.user.id,
      prompt,
      useUserApiKey: !!(quotaCheck.useUserApiKey && user?.userApiKey),
      userApiKey: user?.userApiKey || undefined,
      maxTokens: 4096,
      temperature: 0.7,
    });

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
