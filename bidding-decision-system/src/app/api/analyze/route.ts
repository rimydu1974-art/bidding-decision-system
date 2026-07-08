import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { callAI } from '@/lib/ai/call-ai';
import { TENDER_ANALYSIS_PROMPT } from '@/lib/ai/prompts/tender-analysis';
import { generateId } from '@/lib/utils';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { checkAiQuota, incrementAiUsageForFile } from '@/lib/quota';
import { calculateFileHash, checkFileExists, saveFileHash } from '@/lib/file-hash';
import { cleanDocumentForAI, getCleaningStats } from '@/lib/document-cleaner';
import { injectPageAnchors } from '@/lib/source-trace';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import prisma from '@/lib/db';
import { RuleEngine, TenderData } from '@/lib/rules';
import { ALL_RULES } from '@/lib/rules/definitions';
import { trackBehavior } from '@/lib/behavior';
import { extractAllRules, RuleExtractionResult } from '@/lib/rule-extractors';
import { extractAllSymbolItems } from '@/lib/rule-extractors/symbol-extractor';

export const dynamic = 'force-dynamic';

const CHINESE_DATE_PATTERNS: Array<[RegExp, (m: RegExpExecArray) => Date]> = [
  [/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/g, (m) => new Date(+m[1], +m[2] - 1, +m[3])],
  [/(\d{4})-(\d{1,2})-(\d{1,2})/g, (m) => new Date(+m[1], +m[2] - 1, +m[3])],
  [/(\d{4})\/(\d{1,2})\/(\d{1,2})/g, (m) => new Date(+m[1], +m[2] - 1, +m[3])],
];

function extractDate(value: unknown): Date {
  if (!value || value === '招标文件未提及') return new Date();
  const str = String(value);

  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) return isoDate;

  for (const [pattern, resolver] of CHINESE_DATE_PATTERNS) {
    const match = pattern.exec(str);
    if (match) {
      const d = resolver(match);
      if (!isNaN(d.getTime())) {
        pattern.lastIndex = 0;
        return d;
      }
    }
    pattern.lastIndex = 0;
  }

  return new Date();
}

function fixTruncatedJson(str: string): string {
  let fixed = str;
  // Remove everything before first { and after last } using bracket-depth tracking
  const firstBrace = fixed.indexOf('{');
  if (firstBrace === -1) return fixed;
  fixed = fixed.substring(firstBrace);

  let depth = 0;
  let lastValidBrace = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < fixed.length; i++) {
    const ch = fixed[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { depth++; }
    if (ch === '}') { depth--; if (depth === 0) { lastValidBrace = i; } }
  }
  if (lastValidBrace > 0) {
    fixed = fixed.substring(0, lastValidBrace + 1);
  }

  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  // Count remaining unclosed brackets and close them
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

    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`ai-analyze:${session.user.id}:${ip}`, RATE_LIMITS.ai);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const quotaCheck = await checkAiQuota(session.user.id);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    // 判断用户类型，确定输出token限制
    const userInfo = await prisma.user.findUnique({ where: { id: session.user.id } });
    const now = new Date();
    const isPro = !!(userInfo?.plan === 'pro' && userInfo?.planExpiresAt && userInfo.planExpiresAt > now);
    const isEnterprise = !!(userInfo?.plan === 'enterprise' && userInfo?.planExpiresAt && userInfo.planExpiresAt > now);
    const hasTempAccess = !!(userInfo?.tempExpiresAt && userInfo.tempExpiresAt > now);
    const isPaidUser = isPro || isEnterprise || hasTempAccess;
    // 免费用户：10000 token（约5000-7000字）；付费用户：16000 token（约10000-12000字）
    const maxTokens = isPaidUser ? 16000 : 10000;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过100MB' }, { status: 400 });
    }

    console.log(`[Analyze] 开始处理文件: ${file.name}, 大小: ${file.size} bytes`);

    // 文件Hash去重检查
    const fileHash = await calculateFileHash(file);
    const existingFile = await checkFileExists(fileHash);
    if (existingFile.exists && existingFile.assessmentId) {
      console.log(`[Analyze] 文件已存在, Hash: ${fileHash}`);
      const cachedAssessment = await prisma.assessment.findUnique({
        where: { id: existingFile.assessmentId },
      });
      if (cachedAssessment) {
        // 如果缓存的assessment属于当前用户，直接返回
        if (cachedAssessment.userId === session.user.id) {
          console.log(`[Analyze] 返回缓存结果 (同一用户)`);
          return NextResponse.json({ 
            assessment: cachedAssessment,
            cached: true,
            message: '该文件已分析过，返回缓存结果'
          });
        }
        // 如果属于其他用户，为当前用户复制一份
        console.log(`[Analyze] 缓存属于其他用户，为当前用户创建副本`);
        const clonedAssessment = await prisma.assessment.create({
          data: {
            userId: session.user.id,
            projectName: cachedAssessment.projectName,
            projectCode: cachedAssessment.projectCode,
            budget: cachedAssessment.budget,
            riskLevel: cachedAssessment.riskLevel,
            recommendation: cachedAssessment.recommendation,
            fileName: file.name,
            aiResult: cachedAssessment.aiResult,
            basicInfo: cachedAssessment.basicInfo,
            risks: cachedAssessment.risks,
            tasks: cachedAssessment.tasks,
            scoringRules: cachedAssessment.scoringRules,
            qualificationReqs: cachedAssessment.qualificationReqs,
            technicalResponse: cachedAssessment.technicalResponse,
            riskAggregation: cachedAssessment.riskAggregation,
            bidDeadline: cachedAssessment.bidDeadline,
            bidOpeningTime: cachedAssessment.bidOpeningTime,
            queryDeadline: cachedAssessment.queryDeadline,
          },
        });
        return NextResponse.json({ 
          assessment: clonedAssessment,
          cached: true,
          message: '该文件已分析过，返回缓存结果'
        });
      }
    }

    const parsedDoc = await parseFile(file);
    console.log(`[Analyze] 文件解析完成, 内容长度: ${parsedDoc.content.length}`);

    if (!parsedDoc.content || parsedDoc.content.length < 10) {
      return NextResponse.json(
        { error: '文件内容为空或无法解析，请上传有效的招标文件' },
        { status: 400 }
      );
    }

    // 在文档清洗前提取▲★※符号，确保不丢失
    const originalSymbols = extractAllSymbolItems(parsedDoc.content);
    console.log(`[Analyze] 原始▲★※提取完成, 共${originalSymbols.length}项`);

    // 正则清洗 - 过滤非必要内容，降本防幻觉
    const cleanResult = cleanDocumentForAI(parsedDoc.content);
    console.log(`[Analyze] 文档清洗完成, 原始: ${cleanResult.originalLength}字符, 清洗后: ${cleanResult.cleanedLength}字符, 过滤: ${cleanResult.filteredReasons.join(', ')}`);

    // 规则提取 - 确定性数据，零幻觉
    const ruleResult = extractAllRules(cleanResult.cleaned);
    // 合并原始提取的符号，确保不丢失
    ruleResult.symbols = originalSymbols;
    console.log(`[Analyze] 规则提取完成, 耗时: ${ruleResult.extractionTime}ms`);
    console.log(`[Analyze] 废标条件: ${ruleResult.voidBid.conditions.length}条, 金额: ${ruleResult.financial.amounts.length}项, 时间: ${ruleResult.timelines.length}项, 资质: ${ruleResult.qualifications.length}项, 符号: ${ruleResult.symbols.length}项`);

    // 注入页码标记 - 5D溯源
    const contentWithAnchors = injectPageAnchors(cleanResult.cleaned);

    const maxContentLength = 20000;
    const truncatedContent = contentWithAnchors.length > maxContentLength
      ? contentWithAnchors.substring(0, maxContentLength) + '\n\n[... 文件内容过长，已截取前20000字符]'
      : contentWithAnchors;

    // 构建控标参考规则库（注入到prompt中供AI参考）
    const controlRules = ALL_RULES.filter((r: any) =>
      ['collusion-signal', 'collusion-boundary', 'bid-invalidity', 'hard-rejection'].includes(r.category)
    );
    const rulesRef = controlRules.length > 0
      ? '\n\n## 控标参考规则库（请在提取controlPoints时参考以下规则）\n' +
        controlRules.map((r: any) => `- [${r.id}] ${r.name}：${r.description || r.message || ''}`).join('\n')
      : '';

    // 构建规则提取结果摘要（注入到prompt中供AI参考）
    const ruleExtractionRef = `
## 规则提取结果（已由程序自动提取，请在AI提取时参考并补充语义内容）

### 废标/无效报价条件（共${ruleResult.voidBid.conditions.length}条）
${ruleResult.voidBid.conditions.map((c, i) => `${i + 1}. [${c.category}] ${c.condition.substring(0, 100)}... → 后果：${c.consequence}`).join('\n')}

### 资格性审查项
${ruleResult.voidBid.summary.qualificationItems.length > 0 ? ruleResult.voidBid.summary.qualificationItems.join('\n') : '未识别到明确的资格性审查项，请AI补充'}

### 符合性审查项
${ruleResult.voidBid.summary.complianceItems.length > 0 ? ruleResult.voidBid.summary.complianceItems.join('\n') : '未识别到明确的符合性审查项，请AI补充'}

### 金额信息
${ruleResult.financial.amounts.map(a => `- ${a.field}：${a.value} (${a.unit})`).join('\n') || '未识别到金额信息'}

### 时间节点
${ruleResult.timelines.map(t => `- ${t.field}：${t.value}${t.isUrgent ? ' ⚠️紧急' : ''}`).join('\n') || '未识别到时间节点'}

### 资质证书
${ruleResult.qualifications.map(q => `- ${q.name} (${q.isRequired ? '必须' : '建议'})`).join('\n') || '未识别到资质证书要求'}

### ▲★※标记
${ruleResult.symbols.map(s => `- ${s.symbol} ${s.content.substring(0, 80)}`).join('\n') || '未识别到▲★※标记'}

### 密封/签字/盖章/包装要求
${ruleResult.documentRequirements.rawSections.length > 0 ? ruleResult.documentRequirements.rawSections.join('\n') : '未识别到密封签字盖章要求，请AI从原文中提取'}

### 评分数字
${ruleResult.scoring.map(s => `- ${s.field}：${s.value}${s.unit}`).join('\n') || '未识别到评分数字'}
`;

    // 在prompt中插入控标参考规则库和规则提取结果
    const promptWithRules = TENDER_ANALYSIS_PROMPT.replace(
      '## 招标文件内容',
      rulesRef + '\n\n' + ruleExtractionRef + '\n\n## 招标文件内容'
    );
    const finalPrompt = promptWithRules.replace('{document_content}', truncatedContent);
    console.log(`[Analyze] Prompt构建完成, 长度: ${finalPrompt.length}, 文档内容长度: ${truncatedContent.length}`);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const aiResponse = await callAI({
      userId: session.user.id,
      prompt: finalPrompt,
      useUserApiKey: !!(quotaCheck.useUserApiKey && user?.userApiKey),
      userApiKey: user?.userApiKey || undefined,
      maxTokens,
      temperature: 0.1,
    });
    
    console.log(`[Analyze] AI响应完成, 内容长度: ${aiResponse.content.length}`);
    console.log(`[Analyze] AI响应前500字: ${aiResponse.content.substring(0, 500)}`);
    console.log(`[Analyze] AI响应后500字: ${aiResponse.content.substring(aiResponse.content.length - 500)}`);

    await incrementAiUsageForFile(session.user.id, file.name);

    trackBehavior({ userId: session.user.id, action: 'upload' });
    trackBehavior({ userId: session.user.id, action: 'analyze' });

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
        console.log('[Analyze] AI返回字段:', Object.keys(analysisResult).join(', '));
        console.log('[Analyze] risks数量:', (analysisResult.risks || []).length);
        console.log('[Analyze] checklist数量:', (analysisResult.checklist || []).length);
        console.log('[Analyze] phoneQuestions数量:', (analysisResult.phoneQuestions || []).length);
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      console.error('[Analyze] JSON解析失败:', parseError);
      console.error('[Analyze] AI原始响应:', aiResponse.content.substring(0, 2000));
      return NextResponse.json(
        { error: `分析结果解析失败，请重试` },
        { status: 500 }
      );
    }

    // 验证AI返回是否包含7个必要字段
    const requiredFields = [
      'basicInfo', 'financialInfo', 'qualificationRequirements',
      'scoringRules', 'timeRequirements', 'projectInfo', 'phoneQuestions'
    ];
    const missingFields = requiredFields.filter(field => !analysisResult[field]);
    
    if (missingFields.length > 0) {
      console.warn(`[Analyze] AI返回缺少字段: ${missingFields.join(', ')}`);
      // 为缺失的字段提供默认值
      for (const field of missingFields) {
        if (field === 'phoneQuestions') {
          analysisResult[field] = [];
        } else if (field === 'qualificationRequirements') {
          analysisResult[field] = [];
        } else {
          analysisResult[field] = {};
        }
      }
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
        objectiveScore: Number(analysisResult.scoringRules?.objectiveScore) || 0,
        subjectiveScore: Number(analysisResult.scoringRules?.subjectiveScore) || 0,
        priceScore: Number(analysisResult.scoringRules?.priceScore) || 0,
        commercialScore: Number(analysisResult.scoringRules?.commercialScore) || 0,
        technicalScore: Number(analysisResult.scoringRules?.technicalScore) || 0,
        winningMethod: analysisResult.scoringRules?.winningMethod || '',
        evaluationMethod: analysisResult.scoringRules?.evaluationMethod || '',
        objectiveSubjectiveRatio: analysisResult.scoringRules?.objectiveSubjectiveRatio || '',
        voidBidExplanation: analysisResult.scoringRules?.voidBidExplanation || '',
        specialScoringRequirements: analysisResult.scoringRules?.specialScoringRequirements || '',
        priceScoreDetail: analysisResult.scoringRules?.priceScoreDetail || '',
        commercialScoreDetail: analysisResult.scoringRules?.commercialScoreDetail || '',
        technicalScoreDetail: analysisResult.scoringRules?.technicalScoreDetail || '',
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
        sealingRequirements: analysisResult.projectInfo?.sealingRequirements || ruleResult.documentRequirements.sealing || '',
        packagingRequirements: analysisResult.projectInfo?.packagingRequirements || ruleResult.documentRequirements.packaging || '',
        stampingRequirements: analysisResult.projectInfo?.stampingRequirements || ruleResult.documentRequirements.stamping || '',
        signatureRequirements: analysisResult.projectInfo?.signatureRequirements || ruleResult.documentRequirements.signature || '',
        acceptanceRequirements: analysisResult.projectInfo?.acceptanceRequirements || '',
        voidBidConditions: ruleResult.voidBid.conditions.map(c => c.condition).join('\n'),
        qualificationReviewItems: ruleResult.voidBid.summary.qualificationItems.join('\n'),
        complianceReviewItems: ruleResult.voidBid.summary.complianceItems.join('\n'),
        _source: _sources,
      },
      phoneQuestions: (analysisResult.phoneQuestions || []).map(
        (q: Record<string, unknown>) => ({
          id: generateId(),
          question: q.question || '',
          answer: q.answer || '',
          reason: q.reason || '',
          priority: q.priority || 'medium',
          category: q.category || '其他',
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
      ruleExtraction: {
        voidBidConditions: ruleResult.voidBid.conditions,
        financialAmounts: ruleResult.financial.amounts,
        priceRiskNotes: ruleResult.financial.riskNotes,
        timelines: ruleResult.timelines,
        qualifications: ruleResult.qualifications,
        documentRequirements: ruleResult.documentRequirements,
        scoringNumbers: ruleResult.scoring,
        symbolItems: ruleResult.symbols,
        extractionTime: ruleResult.extractionTime,
      },
      createdAt: new Date(),
    };

    // 规则引擎检查 - 完整TenderData映射
    const ruleEngine = new RuleEngine();

    // 从AI分析结果中提取结构化字段
    const qualReqs = analysisResult.qualificationRequirements || [];
    const firstQual = qualReqs[0] || {};
    const finInfo = analysisResult.financialInfo || {};
    const scoring = analysisResult.scoringRules || {};
    const timeInfo = analysisResult.timeRequirements || {};
    const projInfo = analysisResult.projectInfo || {};

    // 提取实质性要求文本
    const substantialText = projInfo.substantialRequirements || '';
    const substantialLines = substantialText
      .split(/[\n,，。；;]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 2);

    // 分类标注符号的实质性要求
    const starRequirements = substantialLines.filter((s: string) => s.startsWith('★'));
    const asteriskRequirements = substantialLines.filter((s: string) => s.startsWith('*'));
    const solidTriangleReqs = substantialLines.filter((s: string) => s.startsWith('▲'));

    // 计算差异天数
    const salePeriodDaysValue = timeInfo.documentAcquisitionDeadline
      ? (() => { const d = extractDate(timeInfo.documentAcquisitionDeadline); const now = new Date(); return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)); })()
      : undefined;

    const tenderData: TenderData = {
      // ===== 已有映射（保留） =====
      scoringRules: {
        technicalScore: assessment.scoringRules.technicalScore,
        priceScore: assessment.scoringRules.priceScore,
        totalScore: assessment.scoringRules.totalScore,
        items: assessment.scoringRules.items.map((item: any) => ({
          name: item.name,
          maxScore: item.maxScore,
        })),
      },
      budget: assessment.budget,
      maxPrice: Number(finInfo.maxPrice) || 0,
      bidOpeningTime: assessment.bidOpeningTime,
      sealingRequirements: assessment.projectInfo.sealingRequirements,
      originalCopies: assessment.projectInfo.originalCopies,

      // ===== 新补全的字段 =====
      // H1 - 实质性偏离检测
      substantialDeviations: substantialLines,
      substantialDeviationScores: (() => {
        const scores: Record<string, number> = {};
        const items = scoring.items || [];
        for (const req of substantialLines) {
          const matchedItem = items.find((it: any) => req.includes(it.name) || it.name?.includes(req));
          if (matchedItem) scores[req] = Number(matchedItem.maxScore) || 5;
        }
        return scores;
      })(),
      substantialDeviationMaxScore: Number(scoring.totalScore) || 100,

      // H2 - 资格性审查
      qualificationReviewFailed: !!firstQual.qualificationReview &&
        firstQual.qualificationReview !== '通过',

      // H3 - 符合性审查（签字、盖章、格式）
      complianceReviewFailed: !!firstQual.complianceReview &&
        firstQual.complianceReview !== '通过',

      // H4 - 投标有效期
      bidValidityDays: (() => {
        const bidOpeningDate = extractDate(timeInfo.bidOpeningTime);
        const now = new Date();
        return Math.ceil((bidOpeningDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      })(),
      requiredBidValidityDays: 30,

      // H5 - 投标文件逾期送达
      submissionTime: new Date(),
      bidDeadline: extractDate(timeInfo.bidOpeningTime) || undefined,

      // H6 - 缺少必须资质证书
      requiredCertificates: qualReqs
        .filter((q: any) => q.specialQualification && q.isRequired !== false)
        .map((q: any) => q.specialQualification)
        .filter(Boolean),
      ourCertificates: [],

      // H7 & H8 - 符号偏离检测
      symbolDefinitions: substantialText,
      substantialRequirements: substantialLines,
      starRequirements,
      asteriskRequirements,
      ourCapabilities: {},

      // R01 - 投标保证金
      bidBondAmount: Number(finInfo.bidBond) || undefined,
      estimatedPrice: Number(finInfo.budget) || Number(assessment.budget),

      // R02 - 履约保证金
      performanceBondAmount: Number(finInfo.performanceBond) || undefined,
      contractPrice: Number(finInfo.budget) || Number(assessment.budget),

      // R04 - 招标文件发售期
      salePeriodDays: salePeriodDaysValue && salePeriodDaysValue > 0
        ? salePeriodDaysValue
        : undefined,
      tenderIssueDate: new Date(),

      // R10 - 联合体投标
      jointBid: firstQual.jointBid || false,
      isJointBid: !!firstQual.jointBid,

      // R6 - 交付周期
      deliveryPeriod: timeInfo.winningDeliveryTime
        ? (() => {
            const t = typeof timeInfo.winningDeliveryTime === 'string'
              ? parseInt(timeInfo.winningDeliveryTime, 10)
              : Number(timeInfo.winningDeliveryTime);
            return isNaN(t) ? undefined : t;
          })()
        : undefined,
      projectComplexity: assessment.scoringRules.items?.length
        ? assessment.scoringRules.items.length * 5
        : undefined,

      // R5 - 业绩要求
      ourPerformanceCount: undefined,
    };

    const hardRejectionCheckResult = ruleEngine.checkHardRejectionRules(tenderData);
    const softRejectionResults = ruleEngine.checkSoftRejectionRules(tenderData);

    const hardRejectionsForAggregation = hardRejectionCheckResult.violations.map((v: any) => ({
      ruleId: v.ruleId,
      ruleName: v.ruleName,
      triggered: true,
      message: v.message,
      suggestion: v.suggestion,
    }));

    const riskAggregation = ruleEngine.aggregateRiskResults(
      hardRejectionsForAggregation,
      softRejectionResults,
      tenderData
    );

    (assessment as any).riskAggregation = riskAggregation;

    // 如果有硬排斥触发，覆盖recommendation为no-bid
    if (hardRejectionCheckResult.violations.length > 0) {
      (assessment as any).recommendation = 'no-bid';
      (assessment as any).riskLevel = 'critical';
    } else {
      (assessment as any).riskLevel = riskAggregation.overallRiskLevel;
      (assessment as any).recommendation = riskAggregation.recommendation;
    }

    // 保存评估结果到数据库
    const savedAssessment = await prisma.assessment.create({
      data: {
        userId: session.user.id,
        projectName: assessment.projectName,
        projectCode: assessment.basicInfo.projectCode || null,
        budget: assessment.budget,
        riskLevel: assessment.riskLevel,
        recommendation: assessment.recommendation,
        fileName: file.name,
        aiResult: JSON.stringify(assessment),
        basicInfo: JSON.stringify(assessment.basicInfo),
        risks: JSON.stringify(assessment.risks),
        tasks: JSON.stringify(assessment.tasks),
        scoringRules: JSON.stringify(assessment.scoringRules),
        qualificationReqs: JSON.stringify(assessment.qualificationRequirements),
        technicalResponse: JSON.stringify([]),
        riskAggregation: JSON.stringify((assessment as any).riskAggregation || {}),
        bidDeadline: assessment.deadline,
        bidOpeningTime: assessment.bidOpeningTime,
        queryDeadline: assessment.queryDeadline,
      },
    });

    console.log(`[Analyze] 评估结果已保存, ID: ${savedAssessment.id}`);

    // 保存文件Hash（用于去重）- 在assessment创建成功后执行
    await saveFileHash(fileHash, file.name, file.size, session.user.id, savedAssessment.id).catch(console.error);

    return NextResponse.json({ assessment: savedAssessment });
  } catch (error) {
    console.error('[Analyze] 分析错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const sanitizedError = process.env.NODE_ENV === 'production'
      ? '分析失败，请重试'
      : `分析失败: ${errorMessage}`;
    return NextResponse.json(
      { error: sanitizedError },
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
