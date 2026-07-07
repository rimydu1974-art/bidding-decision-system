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
