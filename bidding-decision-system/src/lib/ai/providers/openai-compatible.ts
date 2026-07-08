import { AIProvider } from '../types';
import { AIOptions, AIResponse } from '@/types';

export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  displayName: string;
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(
    name: string,
    displayName: string,
    baseUrl: string,
    apiKey: string,
    defaultModel: string
  ) {
    this.name = name;
    this.displayName = displayName;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async analyze(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const model = options?.model || this.defaultModel;

    // 智能检测baseUrl是否已包含版本路径，避免重复拼接 /v1
    let url: string;
    if (this.baseUrl.endsWith('/v1') || this.baseUrl.endsWith('/v4')) {
      // 已包含版本路径，直接拼接
      url = `${this.baseUrl}/chat/completions`;
    } else if (this.name === 'doubao') {
      // 豆包特殊处理：baseURL已经是完整路径，不需要再加 /v1
      // doubao baseURL: https://ark.cn-beijing.volces.com/api/v3
      // 正确endpoint: https://ark.cn-beijing.volces.com/api/v3/chat/completions
      url = `${this.baseUrl}/chat/completions`;
    } else {
      // 其他厂商：添加 /v1 前缀
      url = `${this.baseUrl}/v1/chat/completions`;
    }

    console.log(`[${this.displayName}] 开始请求, model: ${model}, prompt长度: ${prompt.length}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120秒超时

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 8192,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log(`[${this.displayName}] 响应状态: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`[${this.displayName}] API错误: ${error}`);
        throw new Error(`${this.displayName} API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice?.message?.content) {
        console.error(`[${this.displayName}] 响应为空:`, JSON.stringify(data).substring(0, 500));
        throw new Error(`${this.displayName} 返回内容为空`);
      }

      console.log(`[${this.displayName}] 响应成功, 内容长度: ${choice.message.content.length}`);

      return {
        content: choice.message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`${this.displayName} 请求超时（120秒）`);
      }
      throw error;
    }
  }
}
