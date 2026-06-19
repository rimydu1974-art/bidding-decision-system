import { AIOptions, AIResponse } from '@/types';

export interface AIProvider {
  name: string;
  displayName: string;
  analyze(prompt: string, options?: AIOptions): Promise<AIResponse>;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export function getProviderConfig(providerName: string): AIConfig | null {
  const configs: Record<string, AIConfig> = {
    deepseek: {
      provider: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    tongyi: {
      provider: 'tongyi',
      apiKey: process.env.TONGYI_API_KEY || '',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
      model: process.env.TONGYI_MODEL || 'qwen-max',
    },
    zhipu: {
      provider: 'zhipu',
      apiKey: process.env.ZHIPU_API_KEY || '',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: process.env.ZHIPU_MODEL || 'glm-4-plus',
    },
    baidu: {
      provider: 'baidu',
      apiKey: process.env.BAIDU_API_KEY || '',
      baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
      model: process.env.BAIDU_MODEL || 'ernie-4.0',
    },
    kimi: {
      provider: 'kimi',
      apiKey: process.env.KIMI_API_KEY || '',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: process.env.KIMI_MODEL || 'moonshot-v1-128k',
    },
    yi: {
      provider: 'yi',
      apiKey: process.env.YI_API_KEY || '',
      baseUrl: 'https://api.lingyiwanwu.com/v1',
      model: process.env.YI_MODEL || 'yi-large',
    },
    spark: {
      provider: 'spark',
      apiKey: process.env.SPARK_API_KEY || '',
      baseUrl: 'https://spark-api-open.xf-yun.com/v1',
      model: process.env.SPARK_MODEL || 'generalv3.5',
    },
    hunyuan: {
      provider: 'hunyuan',
      apiKey: process.env.HUNYUAN_API_KEY || '',
      baseUrl: 'https://hunyuan.cloud.tencent.com',
      model: process.env.HUNYUAN_MODEL || 'hunyuan-pro',
    },
    doubao: {
      provider: 'doubao',
      apiKey: process.env.DOUBAO_API_KEY || '',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      model: process.env.DOUBAO_MODEL || 'doubao-pro-4k',
    },
    minimax: {
      provider: 'minimax',
      apiKey: process.env.MINIMAX_API_KEY || '',
      baseUrl: 'https://api.minimax.chat/v1',
      model: process.env.MINIMAX_MODEL || 'abab6.5-chat',
    },
    qihoo: {
      provider: 'qihoo',
      apiKey: process.env.QIHOO_API_KEY || '',
      baseUrl: 'https://api.360.cn',
      model: process.env.QIHOO_MODEL || '360gpt-pro',
    },
    skywork: {
      provider: 'skywork',
      apiKey: process.env.SKYWORK_API_KEY || '',
      baseUrl: 'https://api.skywork.ai/v1',
      model: process.env.SKYWORK_MODEL || 'SkyWork-Max',
    },
  };

  return configs[providerName] || null;
}
