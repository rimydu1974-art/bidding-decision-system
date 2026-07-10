import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { canUserExport } from '@/lib/quota';

let cachedFontBase64: string | null = null;

async function getChineseFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;

  const possiblePaths = [
    join(process.cwd(), 'public', 'fonts', 'simhei.ttf'),
    'C:\\Windows\\Fonts\\simhei.ttf',
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    '/usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    '/System/Library/Fonts/PingFang.ttc',
  ];

  for (const fontPath of possiblePaths) {
    if (existsSync(fontPath)) {
      const fontBuffer = readFileSync(fontPath);
      cachedFontBase64 = fontBuffer.toString('base64');
      return cachedFontBase64;
    }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opencheck.com.cn';
    const res = await fetch(`${baseUrl}/fonts/simhei.ttf`);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const fontBuffer = Buffer.from(arrayBuffer);
      cachedFontBase64 = fontBuffer.toString('base64');
      return cachedFontBase64;
    }
  } catch (e) {
    console.error('Font fetch fallback failed:', e);
  }

  throw new Error('未找到中文字体文件。请将 simhei.ttf 放置在 public/fonts/ 目录下');
}

export async function POST(request: NextRequest) {
  try {
    // 服务端验证导出权限
    const token = getTokenFromRequest(request);
    if (token) {
      const session = await validateSession(token);
      if (session) {
        const canExport = await canUserExport(session.user.id);
        if (!canExport) {
          return NextResponse.json({ 
            error: '7天有效期已过，可以查看结果但不能导出。如需继续使用请再次购买' 
          }, { status: 403 });
        }
      }
    }

    const reqBody = await request.json();
    let data = reqBody.assessment || reqBody;
    // Merge aiResult sub-fields as fallback (financialInfo, timeRequirements, projectInfo etc. live only in aiResult)
    const aiResult = typeof data.aiResult === 'string' ? JSON.parse(data.aiResult) : (data.aiResult || {});
    data = {
      ...data,
      financialInfo: data.financialInfo || aiResult.financialInfo || {},
      timeRequirements: data.timeRequirements || aiResult.timeRequirements || {},
      projectInfo: data.projectInfo || aiResult.projectInfo || {},
      qualificationRequirements: data.qualificationRequirements || data.qualificationReqs || aiResult.qualificationRequirements || [],
      phoneQuestions: data.phoneQuestions || aiResult.phoneQuestions || [],
      risks: data.risks || aiResult.risks || [],
      checklist: data.checklist || aiResult.checklist || [],
      _sources: data._sources || aiResult._sources || {},
    };
    const isPaid = reqBody.isPaid || false;

    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('l', 'mm', 'a4');

    const fontBase64 = await getChineseFontBase64();
    (doc as any).addFileToVFS('SimHei.ttf', fontBase64);
    (doc as any).addFont('SimHei.ttf', 'SimHei', 'normal');
    (doc as any).addFont('SimHei.ttf', 'SimHei', 'bold');
    doc.setFont('SimHei');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    const colors = {
      brandPurple: [124, 58, 237] as [number, number, number],
      brandCyan: [6, 182, 212] as [number, number, number],
      header1: [41, 128, 185] as [number, number, number],
      header2: [52, 152, 219] as [number, number, number],
      header3: [243, 156, 18] as [number, number, number],
      header4: [39, 174, 96] as [number, number, number],
      header5: [155, 89, 182] as [number, number, number],
      header6: [230, 126, 34] as [number, number, number],
      header7: [22, 160, 133] as [number, number, number],
      danger: [231, 76, 60] as [number, number, number],
      success: [39, 174, 96] as [number, number, number],
      warning: [243, 156, 18] as [number, number, number],
      light: [245, 245, 245] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      black: [51, 51, 51] as [number, number, number],
      gray: [128, 128, 128] as [number, number, number],
    };

    // 封面页 - 顶部装饰条
    doc.setFillColor(...colors.brandPurple);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(...colors.brandCyan);
    doc.rect(0, 5, pageWidth, 2, 'F');

    // 封面内容 - 垂直居中布局
    const coverStartY = 55;
    let currentY = coverStartY;

    doc.setFontSize(30);
    doc.setTextColor(...colors.brandPurple);
    doc.setFont('SimHei', 'bold');
    doc.text('OpenCheck', pageWidth / 2, currentY, { align: 'center' });
    currentY += 13;
    doc.setFontSize(11);
    doc.setTextColor(139, 155, 180);
    doc.setFont('SimHei', 'normal');
    doc.text('BID DECISION OS', pageWidth / 2, currentY, { align: 'center' });

    currentY += 28;
    doc.setFontSize(24);
    doc.setTextColor(...colors.black);
    doc.setFont('SimHei', 'bold');
    doc.text('投标决策评估报告', pageWidth / 2, currentY, { align: 'center' });

    currentY += 20;
    doc.setFontSize(12);
    doc.setTextColor(...colors.gray);
    doc.setFont('SimHei', 'normal');
    doc.text(`项目名称：${data.basicInfo?.projectName || data.projectName || '-'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    doc.text(`项目编号：${data.basicInfo?.projectCode || '-'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    const budget = data.financialInfo?.budget;
    doc.text(`预算金额：${budget ? `¥${Number(budget).toLocaleString()}` : '-'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    doc.text(`生成时间：${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, currentY, { align: 'center' });

    const riskLevelMap: Record<string, { text: string; color: [number, number, number] }> = {
      critical: { text: '高风险', color: colors.danger },
      high: { text: '较高风险', color: colors.warning },
      medium: { text: '中等风险', color: [243, 156, 18] as [number, number, number] },
      low: { text: '低风险', color: colors.success },
    };
    const riskInfo = riskLevelMap[data.riskLevel || 'medium'] || riskLevelMap.medium;
    currentY += 18;
    doc.setFillColor(...riskInfo.color);
    const tagWidth = 42;
    (doc as any).roundedRect(pageWidth / 2 - tagWidth / 2, currentY - 5, tagWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('SimHei', 'bold');
    doc.text(riskInfo.text, pageWidth / 2, currentY + 1.5, { align: 'center' });
    doc.setFont('SimHei', 'normal');

    const recMap: Record<string, { text: string; color: [number, number, number] }> = {
      bid: { text: '建议投标', color: colors.success },
      caution: { text: '谨慎投标', color: colors.warning },
      'no-bid': { text: '不建议投标', color: colors.danger },
    };
    const recInfo = recMap[data.recommendation] || recMap.caution;
    currentY += 16;
    doc.setFillColor(...recInfo.color);
    (doc as any).roundedRect(pageWidth / 2 - tagWidth / 2, currentY - 5, tagWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('SimHei', 'bold');
    doc.text(recInfo.text, pageWidth / 2, currentY + 1.5, { align: 'center' });
    doc.setFont('SimHei', 'normal');

    // 封面页 - 底部装饰条
    doc.setFillColor(...colors.brandPurple);
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
    doc.setFillColor(...colors.brandCyan);
    doc.rect(0, pageHeight - 7, pageWidth, 2, 'F');

    // 来源格式化 - 紧凑格式B
    const formatSource = (raw: string): string => {
      if (!raw || raw === '招标文件' || raw === '评分标准' || raw === '废标条款' || raw === '来源未定位') return '';
      if (raw.startsWith('章节：') || raw.startsWith('章节:')) {
        const pdfMatch = raw.match(/PDF第(\d+)页/);
        const textMatch = raw.match(/正文第(\d+)页/);
        const quoteMatch = raw.match(/引用原文[：:]"([^"]+)"/);
        const chapterMatch = raw.match(/章节[：:]([^；;]+)/);
        const parts: string[] = [];
        if (chapterMatch) parts.push(chapterMatch[1].trim());
        if (textMatch) parts.push(`P${textMatch[1]}`);
        if (pdfMatch) parts.push(`PDF${pdfMatch[1]}`);
        let result = parts.length > 0 ? `[${parts.join('/')}]` : '';
        if (quoteMatch) {
          const quote = quoteMatch[1].substring(0, 40);
          result += ` 摘自：${quote}${quoteMatch[1].length > 40 ? '...' : ''}`;
        }
        return result;
      }
      return raw.length > 50 ? raw.substring(0, 50) + '...' : raw;
    };

    // ==================== 构建5列表格数据 ====================
    type TableRow = { no: string; fieldName: string; keyPoint: string; detail: string; source: string; isSeparator?: boolean; separatorColor?: [number, number, number]; isCritical?: boolean };

    const rows: TableRow[] = [];
    let rowNum = 0;

    const addSeparator = (title: string, color: [number, number, number]) => {
      rows.push({ no: '', fieldName: '', keyPoint: title, detail: '', source: '', isSeparator: true, separatorColor: color });
    };

    const addRow = (fieldName: string, keyPoint: string, detail: string = '', source: string = '', isCritical: boolean = false) => {
      rowNum++;
      rows.push({ no: String(rowNum), fieldName, keyPoint, detail, source, isCritical });
    };

    const getS = (section: any, key: string): string => {
      const src = section?._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      for (const v of Object.values(src)) {
        if (typeof v === 'string' && (v.includes('PDF第') || v.includes('第') && v.includes('页'))) return formatSource(v);
      }
      return '';
    };

    // ==================== 第1类：基本信息 ====================
    addSeparator('第1类：基本信息', colors.header1);
    const basicInfo = data.basicInfo || {};
    addRow('项目名称', basicInfo.projectName || data.projectName || '-', '', getS(basicInfo, 'projectName'));
    addRow('项目编号', basicInfo.projectCode || '-', '', getS(basicInfo, 'projectCode'));
    addRow('招标企业', basicInfo.tenderer || '-', '', getS(basicInfo, 'tenderer'));
    addRow('招标联系人', basicInfo.contactPerson || '-', basicInfo.contactPhone || '', getS(basicInfo, 'contactPerson'));
    addRow('代理机构', basicInfo.agency || '-', '', getS(basicInfo, 'agency'));
    addRow('信息来源', basicInfo.informationSource || '-', '', getS(basicInfo, 'informationSource'));
    addRow('CA需求', basicInfo.caRequirement || '-', '', getS(basicInfo, 'caRequirement'));
    addRow('开标方式', basicInfo.bidOpeningMethod || '-', '', getS(basicInfo, 'bidOpeningMethod'));
    addRow('开标地点', basicInfo.bidOpeningLocation || '-', '', getS(basicInfo, 'bidOpeningLocation'));
    addRow('报名方式', basicInfo.registrationMethod || '-', '', getS(basicInfo, 'registrationMethod'));
    addRow('项目地点', basicInfo.location || '-', '', getS(basicInfo, 'location'));

    // ==================== 第2类：财务信息 ====================
    addSeparator('第2类：财务信息', colors.header2);
    const financialInfo = data.financialInfo || {};
    addRow('资金来源', financialInfo.fundingSource || '-', '', getS(financialInfo, 'fundingSource'));
    addRow('预算金额', financialInfo.budget ? `${Number(financialInfo.budget).toLocaleString()}元` : '-', '', getS(financialInfo, 'budget'), true);
    if (financialInfo.maxPrice) {
      addRow('最高限价', `${Number(financialInfo.maxPrice).toLocaleString()}元`, '超出无效', getS(financialInfo, 'maxPrice'), true);
    }
    addRow('付款方式', financialInfo.paymentMethod || '-', '', getS(financialInfo, 'paymentMethod'));
    addRow('标书费', financialInfo.bidDocumentFee ? `${financialInfo.bidDocumentFee}元` : '0元（免费）', '', getS(financialInfo, 'bidDocumentFee'));
    addRow('投标保证金', financialInfo.bidBond || '不收取', '', getS(financialInfo, 'bidBond'));
    addRow('履约保证金', financialInfo.performanceBond || '-', '', getS(financialInfo, 'performanceBond'));
    addRow('质量保证金', financialInfo.qualityBond || '-', '', getS(financialInfo, 'qualityBond'));
    addRow('代理费', financialInfo.agencyFee || '无', '', getS(financialInfo, 'agencyFee'));

    // ==================== 第3类：资质要求 ====================
    addSeparator('第3类：资质要求', colors.header3);
    const qualReqs = data.qualificationRequirements || [];
    qualReqs.forEach((q: Record<string, any>) => {
      const qSrc = (key: string) => {
        const src = q._source;
        if (!src || typeof src !== 'object') return '';
        if (src[key]) return formatSource(src[key]);
        return '';
      };
      if (q.jointBid && q.jointBid !== '招标文件未提及') addRow('联合体投标', q.jointBid, q.isSubstantial ? '实质性要求' : '', qSrc('jointBid'));
      if (q.subcontracting && q.subcontracting !== '招标文件未提及') addRow('分包转包', q.subcontracting, '', qSrc('subcontracting'));
      if (q.specialQualification && q.specialQualification !== '招标文件未提及') addRow('特别资质', q.specialQualification, '', qSrc('specialQualification'), true);
      if (q.specialPersonnelReq && q.specialPersonnelReq !== '招标文件未提及') addRow('特别人员要求', q.specialPersonnelReq, '', qSrc('specialPersonnelReq'));
      if (q.specialNotes && q.specialNotes !== '招标文件未提及') addRow('特别说明', q.specialNotes, '', qSrc('specialNotes'));
      if (q.policyBenefits && q.policyBenefits !== '招标文件未提及') addRow('政策优惠', q.policyBenefits, '', qSrc('policyBenefits'));
      if (q.qualificationReview && q.qualificationReview !== '招标文件未提及') addRow('资格性审查', q.qualificationReview, '一票否决', qSrc('qualificationReview'), true);
      if (q.complianceReview && q.complianceReview !== '招标文件未提及') addRow('符合性审查', q.complianceReview, '一票否决', qSrc('complianceReview'), true);
      if (q.creditRequirements && q.creditRequirements !== '招标文件未提及') addRow('信用要求', q.creditRequirements, '', qSrc('creditRequirements'));
    });

    // ==================== 第4类：评分规则 ====================
    addSeparator('第4类：评分规则', colors.header4);
    const scoringRules = data.scoringRules || {};
    const scSrc = (key: string) => {
      const src = scoringRules._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    addRow('总分', `${scoringRules.totalScore || 100}分`, '', scSrc('totalScore'));
    addRow('客观分', `${scoringRules.objectiveScore || 0}分`, '', scSrc('objectiveScore'));
    addRow('主观分', `${scoringRules.subjectiveScore || 0}分`, '', scSrc('subjectiveScore'));
    addRow('价格分', `${scoringRules.priceScore || 0}分`, scoringRules.priceScoreDetail || '低价优先法', scSrc('priceScore'));
    addRow('商务分', `${scoringRules.commercialScore || 0}分`, scoringRules.commercialScoreDetail || '', scSrc('commercialScore'));
    addRow('技术分', `${scoringRules.technicalScore || 0}分`, scoringRules.technicalScoreDetail || '', scSrc('technicalScore'));
    addRow('中标方式', scoringRules.winningMethod || '-', '', scSrc('winningMethod'));
    addRow('评标方式', scoringRules.evaluationMethod || '-', '', scSrc('evaluationMethod'));
    if (scoringRules.voidBidExplanation) addRow('废标说明', scoringRules.voidBidExplanation, '重点！', scSrc('voidBidExplanation'), true);
    if (scoringRules.specialScoringRequirements) addRow('评分特别要求', scoringRules.specialScoringRequirements, '', scSrc('specialScoringRequirements'));

    const companyCerts = scoringRules.requiredCompanyCertificates || [];
    if (companyCerts.length > 0 && companyCerts[0] !== '招标文件未提及') addRow('要求企业证书', Array.isArray(companyCerts) ? companyCerts.join('、') : String(companyCerts), '', scSrc('requiredCompanyCertificates'));
    const personnelCerts = scoringRules.requiredPersonnelCertificates || [];
    if (personnelCerts.length > 0 && personnelCerts[0] !== '招标文件未提及') addRow('要求人员证书', Array.isArray(personnelCerts) ? personnelCerts.join('、') : String(personnelCerts), '', scSrc('requiredPersonnelCertificates'));

    // ==================== 第5类：时间要求 ====================
    addSeparator('第5类：时间要求', colors.header5);
    const timeReqs = data.timeRequirements || {};
    const tSrc = (key: string) => {
      const src = timeReqs._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    addRow('获取招标文件截止', timeReqs.documentAcquisitionDeadline || '-', '', tSrc('documentAcquisitionDeadline'));
    addRow('标前提问截止', timeReqs.preBidQuestionDeadline || '-', '', tSrc('preBidQuestionDeadline'));
    addRow('开标时间', timeReqs.bidOpeningTime || '-', '', tSrc('bidOpeningTime'), true);
    addRow('中标交货时间', timeReqs.winningDeliveryTime || '-', '', tSrc('winningDeliveryTime'));
    addRow('合同履约期限', timeReqs.contractPerformancePeriod || '-', '', tSrc('contractPerformancePeriod'));

    // ==================== 第6类：项目信息 ====================
    addSeparator('第6类：项目信息', colors.header6);
    const projectInfo = data.projectInfo || {};
    const pSrc = (key: string) => {
      const src = projectInfo._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    if (projectInfo.substantialRequirements) addRow('▲★※满足要求', projectInfo.substantialRequirements, '重点！必须全部响应', pSrc('substantialRequirements'), true);
    if (projectInfo.deviationResult) addRow('偏离▲★※结果', projectInfo.deviationResult, '一项不满足即废标', pSrc('deviationResult'), true);
    // Post-process voidBidConditions: extract only lines containing void-bid keywords, format as ①②③
    const formatVoidBid = (text: string): string => {
      if (!text || text === '-') return text;
      // Split by clause boundaries: after 。|；|\n, before 九、十、※十一、1.、etc.
      const clauses = text
        .split(/(?<=[。；\n])|(?=[一二三四五六七八九十]+[、．.]|※[一二三四五六七八九十]+[、．.]|\d+[、．.])/)
        .map(c => c.replace(/\n/g, '').trim())
        .filter(c => c);
      const kw = /废标|无效报价|视为无效|投标无效|按无效处理|否决投标|不予受理|拒收|取消资格|作废|不得参加|无效。/u;
      const matches = clauses.filter(c => kw.test(c));
      // Deduplicate by first 50 chars
      const seen = new Set<string>();
      const unique = matches.filter(c => {
        const key = c.substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      if (unique.length === 0) return text.substring(0, 200).replace(/\n/g, ' ');
      const CIRCLE = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'];
      return unique.map((s, i) => (CIRCLE[i] || `${i+1}.`) + s).join('\n');
    };
    if (projectInfo.voidBidConditions) addRow('废标/无效报价', formatVoidBid(projectInfo.voidBidConditions), '重点！', '', true);
    if (projectInfo.qualificationReviewItems) addRow('资格性审查项', projectInfo.qualificationReviewItems, '一票否决', '', true);
    if (projectInfo.complianceReviewItems) addRow('符合性审查项', projectInfo.complianceReviewItems, '一票否决', '', true);
    if (projectInfo.drawingsProvided) addRow('图纸提供', projectInfo.drawingsProvided, '', pSrc('drawingsProvided'));
    addRow('现场踏勘', projectInfo.siteSurveyRequired || '-', '', pSrc('siteSurveyRequired'));
    if (projectInfo.controlPoints) addRow('控标点', projectInfo.controlPoints, '', pSrc('controlPoints'));
    if (projectInfo.businessRequirements) addRow('商务需求', projectInfo.businessRequirements, '', pSrc('businessRequirements'));
    if (projectInfo.technicalRequirements) addRow('技术需求', projectInfo.technicalRequirements, '', pSrc('technicalRequirements'));
    if (projectInfo.coreServiceRequirements) addRow('核心服务需求', projectInfo.coreServiceRequirements, '', pSrc('coreServiceRequirements'));
    if (projectInfo.projectOutcomeRequirements) addRow('项目成果要求', projectInfo.projectOutcomeRequirements, '', pSrc('projectOutcomeRequirements'));
    if (projectInfo.finalDelivery) addRow('最终交付', projectInfo.finalDelivery, '', pSrc('finalDelivery'));
    if (projectInfo.specialProjectPoints) addRow('项目特别提到点', projectInfo.specialProjectPoints, '', pSrc('specialProjectPoints'));
    addRow('正本副本', projectInfo.originalCopies || '-', '', pSrc('originalCopies'));
    addRow('密封要求', projectInfo.sealingRequirements || '-', '', pSrc('sealingRequirements'));
    addRow('包装要求', projectInfo.packagingRequirements || '-', '', pSrc('packagingRequirements'));
    addRow('盖章要求', projectInfo.stampingRequirements || '-', '', pSrc('stampingRequirements'));
    addRow('签字要求', projectInfo.signatureRequirements || '-', '', pSrc('signatureRequirements'));
    addRow('验收要求', projectInfo.acceptanceRequirements || '-', '', pSrc('acceptanceRequirements'));

    // ==================== 第7类：老板总结 ====================
    addSeparator('第7类：老板总结', colors.brandPurple);
    const phoneQuestions = data.phoneQuestions || [];
    const risks = data.risks || [];
    const checklistCount = (data.checklist || []).length;

    if (isPaid) {
      if (risks.length > 0) {
        risks.forEach((risk: Record<string, any>) => {
          const levelMap: Record<string, string> = { critical: '严重', high: '高', medium: '中', low: '低' };
          addRow(`风险：${levelMap[risk.level] || '中'}`, risk.title || '风险项', risk.description || '', risk.suggestion || '', risk.level === 'critical');
        });
      }
      if (checklistCount > 0) {
        const checklist = data.checklist || [];
        const groups: Record<string, string[]> = {};
        checklist.forEach((c: any) => {
          const cat = c.category || '其他';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(`${c.item}${c.required ? '(必)' : ''}${c.scoreWeight ? `[${c.scoreWeight}分]` : ''}`);
        });
        Object.entries(groups).forEach(([cat, items]) => {
          addRow(`准备分工：${cat}`, items.join('、'), '', '');
        });
      }
      if (phoneQuestions.length > 0) {
        phoneQuestions.forEach((q: Record<string, any>, idx: number) => {
          addRow(`电话问题${idx + 1}`, q.question || '-', q.reason || '', '');
        });
      }
      const recLabel: Record<string, string> = { bid: '建议投标', 'no-bid': '不建议投标', caution: '谨慎投标' };
      addRow('投标建议', recLabel[data.recommendation || 'caution'] || '谨慎投标', (data.reasons || []).join('；'), '', true);
    } else {
      addRow('风险清单', `${risks.length}条`, '付费后查看详细内容', '');
      addRow('准备分工', `${checklistCount}条`, '付费后查看详细内容', '');
      addRow('电话问题', `${phoneQuestions.length}条`, '付费后查看详细内容', '');
      addRow('投标建议', '付费后查看', '', '');
    }

    // ==================== 渲染 autoTable ====================
    doc.addPage();

    // 明细分项格式化：将长文本按编号拆分展示
    const formatNumberedItems = (text: string): string => {
      if (!text || text === '-') return text;
      // 检测是否包含编号模式
      const hasNumberedPattern = /[①②③④⑤⑥⑦⑧⑨⑩]/.test(text) ||
        /\d+[.、）)]\s*/.test(text) ||
        /[•●■◆▪]\s*/.test(text) ||
        /[-—]\s{2,}/.test(text);
      if (!hasNumberedPattern) return text;
      // 在编号前添加换行，保留编号
      let formatted = text
        .replace(/([①②③④⑤⑥⑦⑧⑨⑩])/g, '\n$1')
        .replace(/(\d+[.、）)])\s*/g, '\n$1')
        .replace(/([•●■◆▪])\s*/g, '\n$1')
        .replace(/\n{2,}/g, '\n')
        .trim();
      return formatted;
    };

    // 添加①②③编号到多条目内容
    const CIRCLE_NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩',
                            '⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];
    function addCircleNumbers(text: string): string {
      if (!text || text === '-') return text;
      // 已有圆圈编号 → 跳过
      if (/[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return text;
      // 分割并编号
      const parts = text.split(/[；;]\s*|\n\s*/).filter(p => p.trim().length > 0);
      if (parts.length <= 1) return text;
      return parts.map((p, i) => (CIRCLE_NUMBERS[i] || `${i+1}.`) + p).join(' ');
    }

    // 对所有行的keyPoint和detail列应用分项格式化
    rows.forEach(row => {
      if (!row.isSeparator) {
        row.keyPoint = formatNumberedItems(addCircleNumbers(row.keyPoint));
        row.detail = formatNumberedItems(row.detail);
      }
    });

    const head = [['编号', '字段名称', '项目数据要点', '备注', '来源定位']];
    const body = rows.map((r) => {
      if (r.isSeparator) return [{ content: '' }, { content: r.keyPoint || '', colSpan: 4, styles: { fillColor: r.separatorColor || colors.brandPurple, textColor: colors.white, fontStyle: 'bold', fontSize: 10 } }, {}, {}, {}];
      return [r.no, r.fieldName, r.keyPoint, r.detail, r.source];
    });

    (autoTable as any)(doc, {
      startY: 15,
      head,
      body: body as any,
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 9 },    // 编号
        1: { cellWidth: 24 },   // 字段名称
        2: { cellWidth: 75 },   // 项目数据要点
        3: { cellWidth: 68 },   // 备注
        4: { cellWidth: 34 },   // 来源定位
      },
      styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', font: 'SimHei', lineHeight: 1.4 } as any,
      headStyles: { fillColor: colors.brandPurple, textColor: colors.white, fontStyle: 'bold', fontSize: 8 } as any,
      alternateRowStyles: { fillColor: [248, 248, 252] },
      didParseCell: (data: any) => {
        const row = rows[data.row.index];
        if (!row) return;

        if (row.isSeparator && row.separatorColor) {
          for (let i = 0; i < 5; i++) {
            data.cell.styles.fillColor = row.separatorColor;
            data.cell.styles.textColor = colors.white;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
          }
        }

        if (row.isCritical && !row.isSeparator) {
          if (data.column.index >= 0) {
            data.cell.styles.fillColor = [255, 245, 238];
          }
          if (data.column.index === 2) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    const finalY = (doc as any).lastAutoTable.finalY || 15;
    doc.setFontSize(8);
    doc.setTextColor(139, 155, 180);
    doc.setFont('SimHei', 'bold');
    doc.text('OpenCheck', margin, pageHeight - 8);
    doc.setFont('SimHei', 'normal');
    doc.text('BID DECISION OS', margin + 35, pageHeight - 8);
    doc.text(`共 ${doc.getNumberOfPages()} 页`, pageWidth - margin, pageHeight - 8, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bid-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: '生成PDF失败' }, { status: 500 });
  }
}
