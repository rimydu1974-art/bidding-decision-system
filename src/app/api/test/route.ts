import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const provider = process.env.AI_PROVIDER;
  
  console.log('[Test] AI_PROVIDER:', provider);
  console.log('[Test] DEEPSEEK_API_KEY exists:', !!apiKey);
  console.log('[Test] DEEPSEEK_API_KEY length:', apiKey?.length);
  console.log('[Test] DEEPSEEK_API_KEY prefix:', apiKey?.substring(0, 10));

  // 测试DeepSeek连接
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: '你好，请回复OK' }],
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      provider,
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length,
      response: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      provider,
      apiKeyExists: !!apiKey,
    });
  }
}
