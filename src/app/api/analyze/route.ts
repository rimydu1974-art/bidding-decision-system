import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { getAIService } from '@/lib/ai';
import { TENDER_ANALYSIS_PROMPT } from '@/lib/ai/prompts/tender-analysis';
import { Assessment } from '@/types';
import { generateId } from '@/lib/utils';

function safeParseDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return isNaN(value.getTime()) ? new Date() : value;
  const str = String(value);
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }

    console.log(`[Analyze] 开始处理文件: ${file.name}, 大小: ${file.size} bytes`);

    // 解析文件
    const parsedDoc = await parseFile(file);
    console.log(`[Analyze] 文件解析完成, 内容长度: ${parsedDoc.content.length}`);

    if (!parsedDoc.content || parsedDoc.content.length < 10) {
      return NextResponse.json(
        { error: '文件内容为空或无法解析，请上传有效的招标文件' },
        { status: 400 }
      );
    }

    // 截取内容避免超出token限制（DeepSeek最多32K tokens，约4万字）
    const maxContentLength = 30000;
    const truncatedContent = parsedDoc.content.length > maxContentLength
      ? parsedDoc.content.substring(0, maxContentLength) + '\n\n[... 文件内容过长，已截取前30000字符]'
      : parsedDoc.content;

    // 构建分析提示词
    const prompt = TENDER_ANALYSIS_PROMPT.replace(
      '{document_content}',
      truncatedContent
    );
    console.log(`[Analyze] Prompt构建完成, 长度: ${prompt.length}`);

    // 调用AI服务
    const aiService = getAIService();
    console.log(`[Analyze] 调用AI服务, 提供商: ${aiService.getDefaultProvider()}`);
    
    const aiResponse = await aiService.analyze(prompt);
    console.log(`[Analyze] AI响应完成, 内容长度: ${aiResponse.content.length}`);
    console.log(`[Analyze] AI响应前200字: ${aiResponse.content.substring(0, 200)}`);

    // 解析AI响应
    let analysisResult;
    try {
      // 尝试提取JSON
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
        console.log('[Analyze] JSON解析成功');
      } else {
        console.error('[Analyze] 无法从AI响应中提取JSON');
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      console.error('[Analyze] JSON解析失败:', parseError);
      console.error('[Analyze] AI原始响应:', aiResponse.content.substring(0, 500));
      return NextResponse.json(
        { error: `分析结果解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}` },
        { status: 500 }
      );
    }

    // 构建评估对象
    const assessment: Assessment = {
      id: generateId(),
      projectId: generateId(),
      projectName: analysisResult.basicInfo?.projectName || parsedDoc.title,
      budget: Number(analysisResult.basicInfo?.budget) || 0,
      deadline: safeParseDate(analysisResult.basicInfo?.bidDeadline),
      bidOpeningTime: safeParseDate(analysisResult.basicInfo?.bidOpeningTime),
      queryDeadline: safeParseDate(analysisResult.basicInfo?.queryDeadline),
      riskLevel: calculateRiskLevel(analysisResult.risks || []),
      recommendation: analysisResult.recommendation || 'caution',
      basicInfo: {
        projectName: analysisResult.basicInfo?.projectName || parsedDoc.title,
        projectCode: analysisResult.basicInfo?.projectCode || '',
        tenderer: analysisResult.basicInfo?.tenderer || '',
        contactPerson: analysisResult.basicInfo?.contactPerson || '',
        contactPhone: analysisResult.basicInfo?.contactPhone || '',
        budget: Number(analysisResult.basicInfo?.budget) || 0,
        bidDeadline: safeParseDate(analysisResult.basicInfo?.bidDeadline),
        bidOpeningTime: safeParseDate(analysisResult.basicInfo?.bidOpeningTime),
        queryDeadline: safeParseDate(analysisResult.basicInfo?.queryDeadline),
        location: analysisResult.basicInfo?.location || '',
      },
      qualificationRequirements: analysisResult.qualificationRequirements || [],
      scoringRules: analysisResult.scoringRules || {
        totalScore: 100,
        commercialScore: 30,
        technicalScore: 50,
        priceScore: 20,
        items: [],
      },
      risks: (analysisResult.risks || []).map((risk: Record<string, unknown>, index: number) => ({
        id: generateId(),
        category: risk.category || 'other',
        level: risk.level || 'medium',
        title: risk.title || `风险 ${index + 1}`,
        description: risk.description || '',
        source: risk.source || '',
        impact: risk.impact || '',
        suggestion: risk.suggestion || '',
      })),
      scorePoints: (analysisResult.scorePoints || []).map((point: Record<string, unknown>) => ({
        id: generateId(),
        category: point.category || '',
        name: point.name || '',
        maxScore: point.maxScore || 0,
        description: point.description || '',
        isImportant: point.isImportant || false,
      })),
      tasks: (analysisResult.tasks || []).map((task: Record<string, unknown>) => ({
        id: generateId(),
        name: task.name || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
      })),
      technicalResponse: (analysisResult.technicalResponse || []).map(
        (item: Record<string, unknown>) => ({
          id: generateId(),
          requirement: item.requirement || '',
          response: item.response || '',
          isCompliant: item.isCompliant || 'not-applicable',
          evidence: item.evidence || '',
          note: item.note || '',
        })
      ),
      createdAt: new Date(),
    };

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('[Analyze] 分析错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('[Analyze] 错误详情:', errorMessage);
    return NextResponse.json(
      { error: `分析失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function calculateRiskLevel(
  risks: Array<{ level?: string }>
): 'low' | 'medium' | 'high' | 'critical' {
  if (risks.some((r) => r.level === 'critical')) return 'critical';
  if (risks.some((r) => r.level === 'high')) return 'high';
  if (risks.some((r) => r.level === 'medium')) return 'medium';
  return 'low';
}
