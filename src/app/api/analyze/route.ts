import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { getAIService } from '@/lib/ai';
import { TENDER_ANALYSIS_PROMPT } from '@/lib/ai/prompts/tender-analysis';
import { generateId } from '@/lib/utils';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { checkAiQuota, incrementAiUsageForFile } from '@/lib/quota';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

function extractDate(value: unknown): Date {
  if (!value || value === '招标文件未提及') return new Date();
  const str = String(value);
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function fixTruncatedJson(str: string): string {
  let fixed = str;
  // Remove everything before first { and after last }
  const firstBrace = fixed.indexOf('{');
  const lastBrace = fixed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    fixed = fixed.substring(firstBrace, lastBrace + 1);
  }
  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  // Count unclosed brackets and close them
  const opens = (fixed.match(/{/g) || []).length;
  const closes = (fixed.match(/}/g) || []).length;
  for (let i = 0; i < opens - closes; i++) fixed += '}';
  const squareOpens = (fixed.match(/\[/g) || []).length;
  const squareCloses = (fixed.match(/]/g) || []).length;
  for (let i = 0; i < squareOpens - squareCloses; i++) fixed += ']';
  return fixed;
}

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

    const quotaCheck = await checkAiQuota(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }

    console.log(`[Analyze] 开始处理文件: ${file.name}, 大小: ${file.size} bytes`);

    const parsedDoc = await parseFile(file);
    console.log(`[Analyze] 文件解析完成, 内容长度: ${parsedDoc.content.length}`);

    if (!parsedDoc.content || parsedDoc.content.length < 10) {
      return NextResponse.json(
        { error: '文件内容为空或无法解析，请上传有效的招标文件' },
        { status: 400 }
      );
    }

    const maxContentLength = 30000;
    const truncatedContent = parsedDoc.content.length > maxContentLength
      ? parsedDoc.content.substring(0, maxContentLength) + '\n\n[... 文件内容过长，已截取前30000字符]'
      : parsedDoc.content;

    const prompt = TENDER_ANALYSIS_PROMPT.replace(
      '{document_content}',
      truncatedContent
    );
    console.log(`[Analyze] Prompt构建完成, 长度: ${prompt.length}`);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    let aiResponse;
    if (quotaCheck.useUserApiKey && user?.userApiKey) {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.userApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8192,
          temperature: 0.1,
        }),
      });
      const data = await response.json();
      aiResponse = { content: data.choices[0]?.message?.content || '' };
    } else {
      const aiService = getAIService();
      console.log(`[Analyze] 调用AI服务, 提供商: ${aiService.getDefaultProvider()}`);
      aiResponse = await aiService.analyze(prompt);
    }
    
    console.log(`[Analyze] AI响应完成, 内容长度: ${aiResponse.content.length}`);

    await incrementAiUsageForFile(session.user.id, file.name);

    let analysisResult;
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        try {
          analysisResult = JSON.parse(jsonStr);
        } catch {
          const fixed = fixTruncatedJson(jsonStr);
          analysisResult = JSON.parse(fixed);
        }
        console.log('[Analyze] JSON解析成功');
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      console.error('[Analyze] JSON解析失败:', parseError);
      return NextResponse.json(
        { error: `分析结果解析失败，请重试` },
        { status: 500 }
      );
    }

    const _sources = analysisResult._sources || {};
    const assessment = {
      id: generateId(),
      projectId: generateId(),
      projectName: analysisResult.basicInfo?.projectName || parsedDoc.title,
      budget: Number(analysisResult.financialInfo?.budget) || 0,
      deadline: extractDate(analysisResult.timeRequirements?.bidOpeningTime),
      bidOpeningTime: extractDate(analysisResult.timeRequirements?.bidOpeningTime),
      queryDeadline: extractDate(analysisResult.timeRequirements?.preBidQuestionDeadline),
      riskLevel: calculateRiskLevel(analysisResult.risks || []),
      recommendation: analysisResult.recommendation || 'caution',
      basicInfo: {
        projectName: analysisResult.basicInfo?.projectName || parsedDoc.title,
        projectCode: analysisResult.basicInfo?.projectCode || '',
        tenderer: analysisResult.basicInfo?.tenderer || '',
        contactPerson: analysisResult.basicInfo?.contactPerson || '',
        contactPhone: analysisResult.basicInfo?.contactPhone || '',
        agency: analysisResult.basicInfo?.agency || '',
        informationSource: analysisResult.basicInfo?.informationSource || '',
        caRequirement: analysisResult.basicInfo?.caRequirement || '',
        bidOpeningMethod: analysisResult.basicInfo?.bidOpeningMethod || '',
        bidOpeningLocation: analysisResult.basicInfo?.bidOpeningLocation || '',
        registrationMethod: analysisResult.basicInfo?.registrationMethod || '',
        location: analysisResult.basicInfo?.location || '',
        _source: _sources,
      },
      financialInfo: {
        fundingSource: analysisResult.financialInfo?.fundingSource || '',
        budget: Number(analysisResult.financialInfo?.budget) || 0,
        maxPrice: Number(analysisResult.financialInfo?.maxPrice) || 0,
        preInvestment: Number(analysisResult.financialInfo?.preInvestment) || 0,
        paymentMethod: analysisResult.financialInfo?.paymentMethod || '',
        bidDocumentFee: Number(analysisResult.financialInfo?.bidDocumentFee) || 0,
        bidBond: Number(analysisResult.financialInfo?.bidBond) || 0,
        performanceBond: Number(analysisResult.financialInfo?.performanceBond) || 0,
        qualityBond: Number(analysisResult.financialInfo?.qualityBond) || 0,
        confidentialityBond: Number(analysisResult.financialInfo?.confidentialityBond) || 0,
        agencyFee: Number(analysisResult.financialInfo?.agencyFee) || 0,
        _source: _sources,
      },
      qualificationRequirements: (analysisResult.qualificationRequirements || []).map(
        (q: Record<string, unknown>) => ({
          id: generateId(),
          name: q.name || '',
          description: q.description || '',
          isSubstantial: q.isSubstantial || false,
          isRequired: q.isRequired !== false,
          jointBid: q.jointBid || false,
          subcontracting: q.subcontracting || false,
          companyScaleReq: q.companyScaleReq || '',
          specialQualification: q.specialQualification || '',
          specialPersonnelReq: q.specialPersonnelReq || '',
          specialNotes: q.specialNotes || '',
          policyBenefits: q.policyBenefits || '',
          qualificationReview: q.qualificationReview || '',
          complianceReview: q.complianceReview || '',
          creditRequirements: q.creditRequirements || '',
          _source: _sources,
        })
      ),
      scoringRules: {
        totalScore: Number(analysisResult.scoringRules?.totalScore) || 100,
        commercialScore: Number(analysisResult.scoringRules?.commercialScore) || 30,
        technicalScore: Number(analysisResult.scoringRules?.technicalScore) || 50,
        priceScore: Number(analysisResult.scoringRules?.priceScore) || 20,
        winningMethod: analysisResult.scoringRules?.winningMethod || '',
        evaluationMethod: analysisResult.scoringRules?.evaluationMethod || '',
        objectiveSubjectiveRatio: analysisResult.scoringRules?.objectiveSubjectiveRatio || '',
        voidBidExplanation: analysisResult.scoringRules?.voidBidExplanation || '',
        specialScoringRequirements: analysisResult.scoringRules?.specialScoringRequirements || '',
        requiredCompanyCertificates: analysisResult.scoringRules?.requiredCompanyCertificates || [],
        requiredPersonnelCertificates: analysisResult.scoringRules?.requiredPersonnelCertificates || [],
        requiredProductReports: analysisResult.scoringRules?.requiredProductReports || [],
        items: (analysisResult.scoringRules?.items || []).map(
          (item: Record<string, unknown>) => ({
            id: generateId(),
            category: item.category || '',
            name: item.name || '',
            maxScore: Number(item.maxScore) || 0,
            description: item.description || '',
            calculationMethod: item.calculationMethod || '',
            _source: _sources,
          })
        ),
        _source: _sources,
      },
      timeRequirements: {
        documentAcquisitionDeadline: analysisResult.timeRequirements?.documentAcquisitionDeadline || '',
        preBidQuestionDeadline: analysisResult.timeRequirements?.preBidQuestionDeadline || '',
        bidOpeningTime: analysisResult.timeRequirements?.bidOpeningTime || '',
        winningDeliveryTime: analysisResult.timeRequirements?.winningDeliveryTime || '',
        contractPerformancePeriod: analysisResult.timeRequirements?.contractPerformancePeriod || '',
        _source: _sources,
      },
      projectInfo: {
        substantialRequirements: analysisResult.projectInfo?.substantialRequirements || '',
        deviationResult: analysisResult.projectInfo?.deviationResult || '',
        drawingsProvided: analysisResult.projectInfo?.drawingsProvided || '',
        drawingList: analysisResult.projectInfo?.drawingList || '',
        drawingDepthRequirement: analysisResult.projectInfo?.drawingDepthRequirement || '',
        siteSurveyRequired: analysisResult.projectInfo?.siteSurveyRequired || '',
        siteSurveyConfirmation: analysisResult.projectInfo?.siteSurveyConfirmation || '',
        controlPoints: analysisResult.projectInfo?.controlPoints || '',
        businessRequirements: analysisResult.projectInfo?.businessRequirements || '',
        technicalRequirements: analysisResult.projectInfo?.technicalRequirements || '',
        coreServiceRequirements: analysisResult.projectInfo?.coreServiceRequirements || '',
        projectOutcomeRequirements: analysisResult.projectInfo?.projectOutcomeRequirements || '',
        finalDelivery: analysisResult.projectInfo?.finalDelivery || '',
        specialProjectPoints: analysisResult.projectInfo?.specialProjectPoints || '',
        originalCopies: analysisResult.projectInfo?.originalCopies || '',
        bidSubmissionMarking: analysisResult.projectInfo?.bidSubmissionMarking || '',
        sealingRequirements: analysisResult.projectInfo?.sealingRequirements || '',
        acceptanceRequirements: analysisResult.projectInfo?.acceptanceRequirements || '',
        _source: _sources,
      },
      phoneQuestions: (analysisResult.phoneQuestions || []).map(
        (q: Record<string, unknown>) => ({
          id: generateId(),
          question: q.question || '',
          answer: q.answer || '',
          _source: q._source || '',
        })
      ),
      risks: (analysisResult.risks || []).map((risk: Record<string, unknown>) => ({
        id: generateId(),
        category: risk.category || 'other',
        level: risk.level || 'medium',
        title: risk.title || '风险',
        description: risk.description || '',
        source: risk.source || '',
        impact: risk.impact || '',
        suggestion: risk.suggestion || '',
        _sourceLocation: risk._sourceLocation || '',
      })),
      tasks: (analysisResult.tasks || []).map((task: Record<string, unknown>) => ({
        id: generateId(),
        name: task.name || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
      })),
      checklist: (analysisResult.checklist || []).map((item: Record<string, unknown>) => ({
        id: generateId(),
        category: item.category || '',
        item: item.item || '',
        required: item.required !== false,
        status: item.status || 'pending',
        source: item.source || '',
        scoreWeight: Number(item.scoreWeight) || 0,
        note: item.note || '',
        _sourceLocation: item._sourceLocation || '',
      })),
      createdAt: new Date(),
    };

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('[Analyze] 分析错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
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
