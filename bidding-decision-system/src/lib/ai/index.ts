import { AIProvider } from './types';
import { AIOptions, AIResponse } from '@/types';
import { OpenAICompatibleProvider } from './providers/openai-compatible';

// 检查AI响应质量：返回9个必要字段的填充率 (0~1)
function assessResponseQuality(content: string): number {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return 0;
    const parsed = JSON.parse(jsonMatch[0]);
    const requiredFields = [
      'basicInfo', 'financialInfo', 'qualificationRequirements',
      'scoringRules', 'timeRequirements', 'projectInfo', 'phoneQuestions',
      'risks', 'checklist'
    ];
    let filled = 0;
    for (const field of requiredFields) {
      const val = parsed[field];
      if (val !== undefined && val !== null && val !== '' &&
          !(Array.isArray(val) && val.length === 0) &&
          !(typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
        filled++;
      }
    }
    return filled / requiredFields.length;
  } catch {
    return 0;
  }
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string;
  private fallbackProviders: string[];

  constructor() {
    this.defaultProvider = process.env.AI_PROVIDER || 'deepseek';
    this.fallbackProviders = (process.env.AI_FALLBACK_PROVIDERS || 'deepseek').split(',');

    this.registerProviders();

    // 启动时记录注册的提供商和默认提供商
    const registered = Array.from(this.providers.keys());
    console.log(`[AIService] 启动完成, 默认: ${this.defaultProvider}, 已注册: [${registered.join(', ')}], 备用: [${this.fallbackProviders.join(', ')}]`);
  }

  private registerProviders() {
    // DeepSeek (OpenAI兼容)
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set(
        'deepseek',
        new OpenAICompatibleProvider(
          'deepseek',
          'DeepSeek',
          'https://api.deepseek.com',
          process.env.DEEPSEEK_API_KEY,
          process.env.DEEPSEEK_MODEL || 'deepseek-chat'
        )
      );
    }

    // 通义千问 (OpenAI兼容)
    if (process.env.TONGYI_API_KEY) {
      this.providers.set(
        'tongyi',
        new OpenAICompatibleProvider(
          'tongyi',
          '通义千问',
          'https://dashscope.aliyuncs.com/api/v1',
          process.env.TONGYI_API_KEY,
          process.env.TONGYI_MODEL || 'qwen-max'
        )
      );
    }

    // 智谱AI (OpenAI兼容)
    if (process.env.ZHIPU_API_KEY) {
      this.providers.set(
        'zhipu',
        new OpenAICompatibleProvider(
          'zhipu',
          '智谱AI',
          'https://open.bigmodel.cn/api/paas/v4',
          process.env.ZHIPU_API_KEY,
          process.env.ZHIPU_MODEL || 'glm-4-plus'
        )
      );
    }

    // 月之暗面Kimi (OpenAI兼容)
    if (process.env.KIMI_API_KEY) {
      this.providers.set(
        'kimi',
        new OpenAICompatibleProvider(
          'kimi',
          'Kimi',
          'https://api.moonshot.cn',
          process.env.KIMI_API_KEY,
          process.env.KIMI_MODEL || 'moonshot-v1-128k'
        )
      );
    }

    // 零一万物 (OpenAI兼容)
    if (process.env.YI_API_KEY) {
      this.providers.set(
        'yi',
        new OpenAICompatibleProvider(
          'yi',
          '零一万物',
          'https://api.lingyiwanwu.com',
          process.env.YI_API_KEY,
          process.env.YI_MODEL || 'yi-large'
        )
      );
    }

    // 讯飞星火 (OpenAI兼容)
    if (process.env.SPARK_API_KEY) {
      this.providers.set(
        'spark',
        new OpenAICompatibleProvider(
          'spark',
          '讯飞星火',
          'https://spark-api-open.xf-yun.com',
          process.env.SPARK_API_KEY,
          process.env.SPARK_MODEL || 'generalv3.5'
        )
      );
    }

    // MiniMax (OpenAI兼容)
    if (process.env.MINIMAX_API_KEY) {
      this.providers.set(
        'minimax',
        new OpenAICompatibleProvider(
          'minimax',
          'MiniMax',
          'https://api.minimax.chat',
          process.env.MINIMAX_API_KEY,
          process.env.MINIMAX_MODEL || 'abab6.5-chat'
        )
      );
    }

    // 腾讯混元 (OpenAI兼容)
    if (process.env.HUNYUAN_API_KEY) {
      this.providers.set(
        'hunyuan',
        new OpenAICompatibleProvider(
          'hunyuan',
          '腾讯混元',
          'https://hunyuan.cloud.tencent.com',
          process.env.HUNYUAN_API_KEY,
          process.env.HUNYUAN_MODEL || 'hunyuan-pro'
        )
      );
    }

    // 字节豆包 (OpenAI兼容)
    if (process.env.DOUBAO_API_KEY) {
      this.providers.set(
        'doubao',
        new OpenAICompatibleProvider(
          'doubao',
          '字节豆包',
          'https://ark.cn-beijing.volces.com/api/v3',
          process.env.DOUBAO_API_KEY,
          process.env.DOUBAO_MODEL || 'ep-20260704123608-jk5c5'
        )
      );
    }
  }

  async analyze(
    prompt: string,
    providerName?: string,
    options?: AIOptions
  ): Promise<AIResponse> {
    const targetProvider = providerName || this.defaultProvider;
    const provider = this.providers.get(targetProvider);

    if (provider) {
      try {
        const response = await provider.analyze(prompt, options);

        // 质量检查：响应内容中9个必要字段填充率低于40%时视为无效
        const quality = assessResponseQuality(response.content);
        console.log(`[AIService] ${targetProvider} 响应质量: ${(quality * 100).toFixed(0)}%`);
        if (quality < 0.4) {
          console.warn(`[AIService] ${targetProvider} 响应质量过低(${(quality * 100).toFixed(0)}%), 触发备用模型`);
          return this.fallback(prompt, targetProvider, options);
        }

        return response;
      } catch (error) {
        console.error(`${targetProvider} failed:`, error);
        return this.fallback(prompt, targetProvider, options);
      }
    }

    return this.fallback(prompt, targetProvider, options);
  }

  private async fallback(
    prompt: string,
    excludeProvider: string,
    options?: AIOptions
  ): Promise<AIResponse> {
    for (const fallbackName of this.fallbackProviders) {
      if (fallbackName === excludeProvider) continue;

      const provider = this.providers.get(fallbackName);
      if (provider) {
        try {
          console.log(`Falling back to ${fallbackName}`);
          return await provider.analyze(prompt, options);
        } catch (error) {
          console.error(`${fallbackName} fallback failed:`, error);
        }
      }
    }

    throw new Error('All AI providers failed');
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): string {
    return this.defaultProvider;
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
