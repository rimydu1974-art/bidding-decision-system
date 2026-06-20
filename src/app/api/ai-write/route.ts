import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

const WRITE_PROMPTS: Record<string, string> = {
  '技术方案': `你是一位资深的技术方案编写专家。请根据以下项目信息，编写一份完整的技术方案。

## 要求
1. 包含项目理解、技术路线、实施计划、质量保证等章节
2. 语言专业、逻辑清晰
3. 突出技术优势和创新点

## 项目信息
{projectInfo}

## 技术要求
{requirements}

请生成技术方案：`,

  '商务文件': `你是一位资深的商务文件编写专家。请根据以下项目信息，编写商务文件。

## 要求
1. 包含公司介绍、服务承诺、报价说明等
2. 语言正式、格式规范
3. 突出公司优势

## 项目信息
{projectInfo}

## 企业信息
{companyInfo}

请生成商务文件：`,

  '投标函': `你是一位资深的投标文件编写专家。请根据以下信息编写投标函。

## 要求
1. 格式规范，符合投标函标准格式
2. 包含投标声明、报价、有效期等要素
3. 语言正式、措辞严谨

## 项目信息
{projectInfo}

## 报价信息
{priceInfo}

请生成投标函：`,

  '资质证明': `你是一位资深的投标文件编写专家。请根据以下信息编写资质证明文件说明。

## 要求
1. 列出需要准备的资质文件清单
2. 说明每个资质文件的用途
3. 标注哪些是必备资质

## 项目信息
{projectInfo}

## 资质要求
{qualificationReqs}

请生成资质证明文件清单：`,

  '风险应对': `你是一位资深的投标风险管理专家。请根据以下信息编写风险应对方案。

## 要求
1. 识别项目潜在风险
2. 针对每个风险提供应对措施
3. 包含风险监控计划

## 项目信息
{projectInfo}

## 已识别风险
{risks}

请生成风险应对方案：`,
};

// GET: 获取可用的写作文档类型
export async function GET() {
  return NextResponse.json({
    types: Object.keys(WRITE_PROMPTS).map((key) => ({
      id: key,
      name: key,
      description: `生成${key}文档`,
    })),
  });
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

    const { type, projectInfo, requirements, companyInfo, priceInfo, qualificationReqs, risks, knowledgeIds } = await request.json();

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
    prompt = prompt.replace('{projectInfo}', projectInfo || '未提供');
    prompt = prompt.replace('{requirements}', requirements || '未提供');
    prompt = prompt.replace('{companyInfo}', companyInfo || '未提供');
    prompt = prompt.replace('{priceInfo}', priceInfo || '未提供');
    prompt = prompt.replace('{qualificationReqs}', qualificationReqs || '未提供');
    prompt = prompt.replace('{risks}', risks || '未提供');

    if (knowledgeContent) {
      prompt += `\n\n## 参考知识库内容\n${knowledgeContent}`;
    }

    // 调用AI生成
    const aiService = getAIService();
    const aiResponse = await aiService.analyze(prompt, undefined, {
      maxTokens: 4096,
    });

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
