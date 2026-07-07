import { getAIService } from './index';
import { AIResponse, AIOptions } from '@/types';
import prisma from '@/lib/db';

export interface CallAIParams {
  userId: string;
  prompt: string;
  useUserApiKey?: boolean;
  userApiKey?: string;
  userApiProvider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
}

// AI提供商配置
const PROVIDER_CONFIG: Record<string, { url: string; model: string }> = {
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

// 统一AI调用，处理用户自有Key和平台Key两种路径
export async function callAI(params: CallAIParams): Promise<AIResponse> {
  const {
    userId,
    prompt,
    useUserApiKey = false,
    userApiKey,
    userApiProvider,
    model,
    maxTokens = 8192,
    temperature = 0.1,
    provider,
  } = params;

  let response: AIResponse;

  if (useUserApiKey && userApiKey) {
    // 根据用户选择的provider确定API URL和模型
    const providerKey = userApiProvider || 'deepseek';
    const config = PROVIDER_CONFIG[providerKey] || PROVIDER_CONFIG.deepseek;
    const apiUrl = config.url;
    const modelName = model || config.model;

    // 使用用户自己的API Key，添加超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120秒超时

    try {
      // Anthropic使用不同的请求格式
      if (providerKey === 'anthropic') {
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': userApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: modelName,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!apiResponse.ok) {
          throw new Error(`AI调用失败: HTTP ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const promptTokens = data.usage?.input_tokens || 0;
        const completionTokens = data.usage?.output_tokens || 0;
        response = {
          content: data.content?.[0]?.text || '',
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        };
      } else {
        // OpenAI兼容格式
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!apiResponse.ok) {
          throw new Error(`AI调用失败: HTTP ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;
        response = {
          content: data.choices?.[0]?.message?.content || '',
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        };
      }
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } else {
    // 使用平台AI服务
    const aiService = getAIService();
    const options: AIOptions = {
      maxTokens,
      temperature,
    };
    response = await aiService.analyze(prompt, provider, options);
  }

  // 记录AI使用（异步，不阻塞响应）
  recordAIUsage(userId, response, useUserApiKey).catch(console.error);

  return response;
}

// 记录AI使用到数据库（用于成本监控）
async function recordAIUsage(
  userId: string,
  response: AIResponse,
  useUserApiKey: boolean
): Promise<void> {
  try {
    // 基础成本估算（DeepSeek价格）
    const promptCostPer1K = 0.001;
    const completionCostPer1K = 0.002;
    const cost = (response.usage.promptTokens / 1000 * promptCostPer1K) +
                 (response.usage.completionTokens / 1000 * completionCostPer1K);

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // 使用Prisma类型安全操作，try-catch保护table不存在的情况
    try {
      await (prisma as any).aiUsage?.create?.({
        data: {
          id,
          userId,
          model: 'deepseek-chat',
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost,
          useUserApiKey,
          createdAt: new Date(),
        },
      });
    } catch {
      // aiUsage表可能还不存在，使用raw SQL作为fallback
      await prisma.$executeRawUnsafe(`
        INSERT INTO ai_usage (id, userId, model, promptTokens, completionTokens, totalTokens, cost, useUserApiKey, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        id, userId, 'deepseek-chat',
        response.usage.promptTokens,
        response.usage.completionTokens,
        response.usage.totalTokens,
        cost, useUserApiKey ? 1 : 0,
        new Date().toISOString()
      );
    }
  } catch (error) {
    console.error('[callAI] 记录AI使用失败:', error);
  }
}
