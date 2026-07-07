import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const PROVIDER_VALIDATION: Record<string, { url: string; model: string; headers?: Record<string, string> }> = {
  deepseek: { url: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
  tongyi: { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' },
  zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash' },
  moonshot: { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' },
  baichuan: { url: 'https://api.baichuan-ai.com/v1/chat/completions', model: 'Baichuan4' },
  spark: { url: 'https://spark-api.xf-yun.com/v3.5/chat', model: 'generalv3.5' },
  ernie: { url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k', model: 'ernie-4.0-8k' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', model: 'gemini-pro' },
};

// POST: 保存/验证用户自己的API Key
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

    const { apiKey, provider } = await request.json();

    if (!apiKey || apiKey.trim().length < 10) {
      return NextResponse.json({ error: '无效的API Key格式' }, { status: 400 });
    }

    const providerConfig = PROVIDER_VALIDATION[provider || 'deepseek'];

    // 验证API Key有效性
    let isVerified = false;
    try {
      if (provider === 'anthropic') {
        // Anthropic 使用不同的验证方式
        const response = await fetch(providerConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: providerConfig.model,
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        if (response.status === 200 || response.status === 429) {
          isVerified = true;
        }
      } else {
        // OpenAI兼容格式验证
        const response = await fetch(providerConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: providerConfig.model,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 5,
          }),
        });
        if (response.status === 200 || response.status === 429) {
          isVerified = true;
        }
      }
    } catch (error) {
      console.log('API validation error, saving as unverified:', error);
    }

    // 保存API Key和供应商
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userApiKey: apiKey,
        userApiProvider: provider || 'deepseek',
        apiKeyVerified: isVerified,
      },
    });

    return NextResponse.json({ success: true, verified: isVerified });
  } catch (error) {
    console.error('Save API key error:', error);
    return NextResponse.json(
      { error: '保存API Key失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除用户自己的API Key
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userApiKey: null,
        userApiProvider: null,
        apiKeyVerified: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: '删除API Key失败' },
      { status: 500 }
    );
  }
}
