import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { canUserExport } from '@/lib/quota';

const CIRCLE = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'];

const addCircleNumbers = (text: string): string => {
  if (!text || text === '-') return text;
  if (/[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return text;
  const parts = text.split(/[；;]\s*|\n\s*/).filter(p => p.trim().length > 0);
  if (parts.length <= 1) return text;
  return parts.map((p, i) => (CIRCLE[i] || `${i+1}.`) + p).join('\n');
};

export async function POST(request: NextRequest) {
  try {
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
    const aiResult = typeof data.aiResult === 'string' ? JSON.parse(data.aiResult) : (data.aiResult || {});
    data = {
      ...data,
      financialInfo: data.financialInfo || aiResult.financialInfo || {},
      timeRequirements: data.timeRequirements || aiResult.timeRequirements || {},
      projectInfo: data.projectInfo || aiResult.projectInfo || {},
      qualificationRequirements: data.qualificationRequirements || data.qualificationReqs || aiResult.qualificationRequirements || [],
      phoneQuestions: data.phoneQuestions || aiResult.phoneQuestions || [],
      risks: data.risks || aiResult.risks || [],
      preparationTasks: data.preparationTasks || aiResult.preparationTasks || [],
      _sources: data._sources || aiResult._sources || {},
    };
    const isPaid = reqBody.isPaid || false;

    const XLSX = await import('xlsx');

    type Row = { no: string; fieldName: string; data: string; source: string; isSeparator?: boolean; categoryLabel?: string };
    const rows: Row[] = [];
    let rowNum = 0;

    const addSeparator = (title: string) => {
      rows.push({ no: '', fieldName: '', data: title, source: '', isSeparator: true, categoryLabel: title });
    };

    const addRow = (fieldName: string, data: string, source: string = '') => {
      rowNum++;
      rows.push({ no: String(rowNum), fieldName, data, source });
    };

    const getS = (section: any, key: string): string => {
      const src = section?._source;
      if (!src || typeof src !== 'object') return '';
      return src[key] || '';
    };

    // ==================== Category 1: Basic Info ====================
    addSeparator('第一类：基本信息');
    const basicInfo = data.basicInfo || {};
    addRow('项目名称', basicInfo['项目名称'] || basicInfo.projectName || '-', getS(basicInfo, '项目名称'));
    addRow('项目编号', basicInfo['项目编号'] || basicInfo.projectCode || '-', getS(basicInfo, '项目编号'));
    addRow('招标企业', basicInfo['招标企业'] || basicInfo.tenderer || '-', getS(basicInfo, '招标企业'));
    addRow('招标联系人', basicInfo['招标联系人'] || basicInfo.contactPerson || '-', getS(basicInfo, '招标联系人'));
    addRow('联系电话', basicInfo['联系电话'] || basicInfo.contactPhone || '-', getS(basicInfo, '联系电话'));
    addRow('代理机构', basicInfo['代理机构'] || basicInfo.agency || '-', getS(basicInfo, '代理机构'));
    addRow('信息来源', basicInfo['信息来源'] || basicInfo.informationSource || '-', getS(basicInfo, '信息来源'));
    addRow('CA需求', basicInfo['CA需求'] || basicInfo.caRequirement || '-', getS(basicInfo, 'CA需求'));
    addRow('开标方式', basicInfo['开标方式'] || basicInfo.bidOpeningMethod || '-', getS(basicInfo, '开标方式'));
    addRow('开标地点', basicInfo['开标地点'] || basicInfo.bidOpeningLocation || '-', getS(basicInfo, '开标地点'));
    addRow('如何报名/获取招标文件', basicInfo['如何报名/获取招标文件'] || basicInfo.registrationMethod || '-', getS(basicInfo, '如何报名/获取招标文件'));
    addRow('项目地点', basicInfo['项目地点'] || basicInfo.location || '-', getS(basicInfo, '项目地点'));

    // ==================== Category 2: Financial Info ====================
    addSeparator('第二类：财务信息');
    const fin = data.financialInfo || {};
    addRow('资金来源', fin['资金来源'] || fin.fundingSource || '-', getS(fin, '资金来源'));
    addRow('预算金额(元)', fin['预算金额(元)'] || fin.budget ? `${fin['预算金额(元)'] || fin.budget}元` : '-', getS(fin, '预算金额(元)'));
    addRow('最高限价(元)', fin['最高限价(元)'] || fin.maxPrice ? `${fin['最高限价(元)'] || fin.maxPrice}元` : '-', getS(fin, '最高限价(元)'));
    addRow('需要预先投资金额', fin['需要预先投资金额'] || fin.preInvestment || '-', getS(fin, '需要预先投资金额'));
    addRow('付款方式', fin['付款方式'] || fin.paymentMethod || '-', getS(fin, '付款方式'));
    addRow('标书费', fin['标书费'] || fin.bidDocumentFee || '-', getS(fin, '标书费'));
    addRow('投标保证金', fin['投标保证金'] || fin.bidBond || '-', getS(fin, '投标保证金'));
    addRow('履约保证金', fin['履约保证金'] || fin.performanceBond || '-', getS(fin, '履约保证金'));
    addRow('质量保证金', fin['质量保证金'] || fin.qualityBond || '-', getS(fin, '质量保证金'));
    addRow('保密保证金', fin['保密保证金'] || fin.confidentialityBond || '-', getS(fin, '保密保证金'));
    addRow('代理费', fin['代理费'] || fin.agencyFee || '-', getS(fin, '代理费'));

    // ==================== Category 3: Qualification Requirements ====================
    addSeparator('第三类：资质要求');
    const qualReqs = data.qualificationRequirements || [];
    if (qualReqs.length > 0) {
      const q = qualReqs[0];
      addRow('联合体投标', q['联合体投标'] || q.jointBid || '-', getS(q, '联合体投标'));
      addRow('分包转包', q['分包转包'] || q.subcontracting || '-', getS(q, '分包转包'));
      addRow('企业规模要求', q['企业规模要求'] || q.companyScaleReq || '-', getS(q, '企业规模要求'));
      addRow('特别资质', q['特别资质'] || q.specialQualification || '-', getS(q, '特别资质'));
      addRow('特别人员要求', q['特别人员要求'] || q.specialPersonnelReq || '-', getS(q, '特别人员要求'));
      addRow('特别说明', q['特别说明'] || q.specialNotes || '-', getS(q, '特别说明'));
      addRow('政策优惠', q['政策优惠'] || q.policyBenefits || '-', getS(q, '政策优惠'));
      addRow('资格性审查', q['资格性审查'] || q.qualificationReview || '-', getS(q, '资格性审查'));
      addRow('符合性审查', q['符合性审查'] || q.complianceReview || '-', getS(q, '符合性审查'));
      addRow('信用要求', q['信用要求'] || q.creditRequirements || '-', getS(q, '信用要求'));
    }

    // ==================== Category 4: Scoring Rules ====================
    addSeparator('第四类：评分规则');
    const sc = data.scoringRules || {};
    const scS = (key: string) => {
      const src = sc._source;
      if (!src || typeof src !== 'object') return '';
      return src[key] || '';
    };
    addRow('总分', `${sc['总分'] || sc.totalScore || 100}分`, scS('总分'));
    addRow('价格分', `${sc['价格分'] || sc.priceScore || 0}分`, scS('价格分'));
    addRow('商务分', `${sc['商务分'] || sc.commercialScore || 0}分`, scS('商务分'));
    addRow('技术分', `${sc['技术分'] || sc.technicalScore || 0}分`, scS('技术分'));
    addRow('中标方式', sc['中标方式'] || sc.winningMethod || '-', scS('中标方式'));
    addRow('评标方式', sc['评标方式'] || sc.evaluationMethod || '-', scS('评标方式'));
    addRow('客观分/主观分比例', sc['客观分/主观分比例'] || sc.objectiveSubjectiveRatio || '-', scS('客观分/主观分比例'));
    if (sc['废标说明'] || sc.voidBidExplanation) {
      addRow('废标说明', sc['废标说明'] || sc.voidBidExplanation || '-', scS('废标说明'));
    }
    if (sc['评分特别要求'] || sc.specialScoringRequirements) {
      addRow('评分特别要求', sc['评分特别要求'] || sc.specialScoringRequirements || '-', scS('评分特别要求'));
    }
    const companyCerts = sc['要求企业资质证书'] || sc.requiredCompanyCertificates || [];
    if (companyCerts.length > 0 && companyCerts[0] !== '招标文件未提及') {
      addRow('要求企业资质证书', Array.isArray(companyCerts) ? companyCerts.join('、') : String(companyCerts), scS('要求企业资质证书'));
    }
    const personnelCerts = sc['要求人员资质证书'] || sc.requiredPersonnelCertificates || [];
    if (personnelCerts.length > 0 && personnelCerts[0] !== '招标文件未提及') {
      addRow('要求人员资质证书', Array.isArray(personnelCerts) ? personnelCerts.join('、') : String(personnelCerts), scS('要求人员资质证书'));
    }
    const productReports = sc['要求产品检测报告'] || sc.requiredProductReports || [];
    if (productReports.length > 0 && productReports[0] !== '招标文件未提及') {
      addRow('要求产品检测报告', Array.isArray(productReports) ? productReports.join('、') : String(productReports), scS('要求产品检测报告'));
    }
    const commercialDetail = sc['商务分评审明细'] || sc.commercialScoreDetail || '';
    if (commercialDetail) {
      addRow('商务分评审明细', addCircleNumbers(commercialDetail), scS('商务分评审明细'));
    }
    const technicalDetail = sc['技术分评审明细'] || sc.technicalScoreDetail || '';
    if (technicalDetail) {
      addRow('技术分评审明细', addCircleNumbers(technicalDetail), scS('技术分评审明细'));
    }

    // ==================== Category 5: Time Requirements ====================
    addSeparator('第五类：时间要求');
    const timeReqs = data.timeRequirements || {};
    const tS = (key: string) => {
      const src = timeReqs._source;
      if (!src || typeof src !== 'object') return '';
      return src[key] || '';
    };
    addRow('获取招标文件截止时间', timeReqs['获取招标文件截止时间'] || timeReqs.documentAcquisitionDeadline || '-', tS('获取招标文件截止时间'));
    addRow('标前提问截止时间', timeReqs['标前提问截止时间'] || timeReqs.preBidQuestionDeadline || '-', tS('标前提问截止时间'));
    addRow('开标时间', timeReqs['开标时间'] || timeReqs.bidOpeningTime || '-', tS('开标时间'));
    addRow('中标交货时间/项目实施期', timeReqs['中标交货时间/项目实施期'] || timeReqs.winningDeliveryTime || '-', tS('中标交货时间/项目实施期'));
    addRow('合同履约期限', timeReqs['合同履约期限'] || timeReqs.contractPerformancePeriod || '-', tS('合同履约期限'));

    // ==================== Category 6: Project Info ====================
    addSeparator('第六类：项目信息');
    const proj = data.projectInfo || {};
    const pS = (key: string) => {
      const src = proj._source;
      if (!src || typeof src !== 'object') return '';
      return src[key] || '';
    };
    addRow('▲★※要求', proj['▲★※要求'] || proj.substantialRequirements || '-', pS('▲★※要求'));
    addRow('偏离▲★※的结果', proj['偏离▲★※的结果'] || proj.deviationResult || '-', pS('偏离▲★※的结果'));
    addRow('图纸提供情况', proj['图纸提供情况'] || proj.drawingsProvided || '-', pS('图纸提供情况'));
    addRow('现场踏勘', proj['现场踏勘'] || proj.siteSurveyRequired || '-', pS('现场踏勘'));
    addRow('踏勘需要确认问题', proj['踏勘需要确认问题'] || proj.siteSurveyConfirmation || '-', pS('踏勘需要确认问题'));
    addRow('控标点', proj['控标点'] || proj.controlPoints || '-', pS('控标点'));
    addRow('商务需求', proj['商务需求'] || proj.businessRequirements || '-', pS('商务需求'));
    addRow('技术需求（技术参数）', proj['技术需求（技术参数）'] || proj.technicalRequirements || '-', pS('技术需求（技术参数）'));
    addRow('核心服务需求', proj['核心服务需求'] || proj.coreServiceRequirements || '-', pS('核心服务需求'));
    addRow('项目成果要求', proj['项目成果要求'] || proj.projectOutcomeRequirements || '-', pS('项目成果要求'));
    addRow('最终交付', proj['最终交付'] || proj.finalDelivery || '-', pS('最终交付'));
    addRow('项目特别提到点', proj['项目特别提到点'] || proj.specialProjectPoints || '-', pS('项目特别提到点'));
    addRow('正本副本', proj['正本副本'] || proj.originalCopies || '-', pS('正本副本'));
    addRow('报价文件提交标记', proj['报价文件提交标记'] || proj.bidSubmissionMarking || '-', pS('报价文件提交标记'));
    addRow('密封包装盖章要求', proj['密封包装盖章要求'] || proj.sealingRequirements || proj.packagingRequirements || proj.stampingRequirements || '-', pS('密封包装盖章要求'));
    addRow('验收要求', proj['验收要求'] || proj.acceptanceRequirements || '-', pS('验收要求'));

    // ==================== Category 7: Special Rows ====================
    addSeparator('特殊行');
    const phoneQuestions = data.phoneQuestions || [];
    const risks = data.risks || [];
    const prepTasks = data.preparationTasks || [];

    if (isPaid) {
      if (phoneQuestions.length > 0) {
        addRow('1、电话问题', addCircleNumbers(phoneQuestions.map((q: any) => q.question || q).join('；')), '');
      }
      if (risks.length > 0) {
        addRow('2、风险清单', addCircleNumbers(risks.map((r: any) => r.description || r.title || '').join('；')), '');
      }
      if (prepTasks.length > 0) {
        addRow('3、准备分工', addCircleNumbers(prepTasks.map((t: any) => `${t.category || ''}${(t.items || []).join('、')}`).join('；')), '');
      }
      const recLabel: Record<string, string> = { bid: '建议投标', 'no-bid': '不建议投标', caution: '谨慎投标' };
      addRow('4、投标建议', `${recLabel[data.recommendation || 'caution'] || '谨慎投标'}；${(data.reasons || []).join('；')}`, '');
    } else {
      addRow('1、电话问题', `${phoneQuestions.length}条，付费后查看详细内容`, '');
      addRow('2、风险清单', `${risks.length}条，付费后查看详细内容`, '');
      addRow('3、准备分工', `${prepTasks.length}条，付费后查看详细内容`, '');
      addRow('4、投标建议', '付费后查看', '');
    }

    // ==================== Build Excel ====================
    const wsData: any[][] = [];
    wsData.push(['编号', '字段名称', '项目数据', '来源定位']);

    for (const row of rows) {
      if (row.isSeparator) {
        wsData.push(['', row.categoryLabel || row.data, '', '']);
      } else {
        wsData.push([row.no, row.fieldName, row.data, row.source]);
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths - wider for better readability
    ws['!cols'] = [
      { wch: 6 },   // 编号
      { wch: 22 },  // 字段名称
      { wch: 100 }, // 项目数据（大幅增加宽度）
      { wch: 50 },  // 来源定位
    ];

    // Set default row height
    ws['!rows'] = ws['!rows'] || [];
    for (let i = 0; i < wsData.length; i++) {
      ws['!rows'][i] = { hpt: 30 }; // 30 points height for better readability
    }

    // Merge separator rows
    let mergeRanges: any[] = [];
    let excelRow = 1; // start after header
    for (const row of rows) {
      if (row.isSeparator) {
        mergeRanges.push({ s: { r: excelRow, c: 0 }, e: { r: excelRow, c: 3 } });
      }
      excelRow++;
    }
    ws['!merges'] = mergeRanges;

    XLSX.utils.book_append_sheet(wb, ws, '投标决策评估表');

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bid-report-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json({ error: '生成Excel失败' }, { status: 500 });
  }
}
