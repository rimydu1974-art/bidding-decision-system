import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { callAI } from '@/lib/ai/call-ai';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { getOrCreateUserProfile, generateProfilePrompt } from '@/lib/user-profile';

export const dynamic = 'force-dynamic';

// AI投标助手系统提示词
const SYSTEM_PROMPT = `你是一个专业的投标助手，专门帮助用户分析招标文件、评估投标风险、制定投标策略。

你的能力包括：
1. 招标文件解读 - 帮助用户理解招标要求、评分标准、资质要求等
2. 风险评估 - 分析投标风险，提供风险等级和应对建议
3. 策略制定 - 根据项目特点制定投标策略
4. 标书编写 - 提供标书编写建议和模板
5. 价格分析 - 分析报价策略和价格区间
6. 资质准备 - 指导资质材料准备

请用专业但易懂的语言回答用户问题，必要时给出具体的操作建议。`;

// POST: 发送消息并获取AI回复
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const user = session.user;

    // 速率限制：每分钟最多5次
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`ai-chat:${user.id}:${ip}`, { windowMs: 60 * 1000, max: 5 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    // 检查用户权限
    const now = new Date();
    const isPro = user.plan === 'pro' && user.planExpiresAt && user.planExpiresAt > now;
    const isEnterprise = user.plan === 'enterprise' && user.planExpiresAt && user.planExpiresAt > now;
    const hasTempAccess = user.tempExpiresAt && user.tempExpiresAt > now;
    const hasUserApiKey = user.userApiKey && user.apiKeyVerified;

    if (!isPro && !isEnterprise && !hasTempAccess && !hasUserApiKey) {
      return NextResponse.json({ 
        error: '请升级专业版或配置自己的API Key后使用AI助手',
        upgradeRequired: true
      }, { status: 403 });
    }

    const body = await request.json();
    const { messages, projectId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '请输入消息' }, { status: 400 });
    }

    // 获取项目上下文（如果提供了projectId）
    let projectContext = '';
    if (projectId) {
      // 查找用户的最新评估记录
      const assessment = await prisma.assessment.findFirst({
        where: { 
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (assessment) {
        projectContext = `
当前项目信息：
- 项目名称: ${assessment.projectName}
- 预算: ${assessment.budget}
- 风险等级: ${assessment.riskLevel}
- 建议: ${assessment.recommendation}

`;
      }
    }

    // 获取用户画像上下文
    let userProfileContext = '';
    try {
      const userProfile = await getOrCreateUserProfile(user.id);
      userProfileContext = generateProfilePrompt(userProfile);
      if (userProfileContext) {
        userProfileContext = '\n\n' + userProfileContext;
      }
    } catch (e) {
      console.error('[AiChat] 获取用户画像失败:', e);
    }

    // 构建消息
    const systemMessage = {
      role: 'system' as const,
      content: SYSTEM_PROMPT + projectContext + userProfileContext
    };

    const apiMessages = [systemMessage, ...messages.slice(-10)]; // 只保留最近10条消息

    // 使用callAI调用AI服务
    const response = await callAI({
      userId: user.id,
      prompt: apiMessages.map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`).join('\n\n'),
      useUserApiKey: !!(hasUserApiKey && user.userApiKey),
      userApiKey: user.userApiKey || undefined,
      userApiProvider: user.userApiProvider || undefined,
      maxTokens: 2000,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      message: {
        role: 'assistant',
        content: response.content
      },
      usage: response.usage
    });
  } catch (error) {
    console.error('[AI Chat] 处理失败:', error);
    return NextResponse.json({ error: 'AI回复失败' }, { status: 500 });
  }
}
