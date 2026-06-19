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
    console.log(`[${this.displayName}] 调用API, 模型: ${model}`);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
      }),
    });

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
  }
}
