import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('投标决策评估表');

    sheet.columns = [
      { header: '类别', key: 'category', width: 18 },
      { header: '字段名称', key: 'fieldName', width: 30 },
      { header: '项目数据', key: 'projectData', width: 50 },
      { header: '来源/备注', key: 'reference', width: 35 },
      { header: '风险等级', key: 'riskLevel', width: 12 },
      { header: '是否影响废标', key: 'affectsVoid', width: 14 },
      { header: '是否影响得分', key: 'affectsScore', width: 14 },
      { header: '建议动作', key: 'suggestion', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // 辅助函数
    let currentRow = 2;
    const addRow = (category: string, fieldName: string, projectData: string, reference: string = '', riskLevel: string = '', affectsVoid: string = '', affectsScore: string = '', suggestion: string = '') => {
      sheet.addRow({ category, fieldName, projectData, reference, riskLevel, affectsVoid, affectsScore, suggestion });
      currentRow++;
    };

    // ==================== 第1类：基本信息 ====================
    const basicInfo = data.basicInfo || {};
    const basicFields = [
      { fieldName: '项目名称', value: basicInfo.projectName || data.projectName || '-' },
      { fieldName: '项目编号', value: basicInfo.projectCode || '-' },
      { fieldName: '招标企业（采购人）', value: basicInfo.tenderer || '-' },
      { fieldName: '招标联系人', value: basicInfo.contactPerson || '-' },
      { fieldName: '联系电话', value: basicInfo.contactPhone || '-' },
      { fieldName: '代理机构', value: basicInfo.agency || '-' },
      { fieldName: '信息来源', value: basicInfo.informationSource || '-' },
      { fieldName: 'CA需求', value: basicInfo.caRequirement || '-' },
      { fieldName: '开标方式', value: basicInfo.bidOpeningMethod || '-' },
      { fieldName: '开标地点', value: basicInfo.bidOpeningLocation || '-' },
      { fieldName: '如何报名/获取招标文件', value: basicInfo.registrationMethod || '-' },
      { fieldName: '项目地点', value: basicInfo.location || '-' },
    ];
    basicFields.forEach(f => addRow('第1类：基本信息', f.fieldName, f.value, (data._sources as any)?.[f.fieldName] || ''));

    // ==================== 第2类：财务信息 ====================
    const financialInfo = data.financialInfo || {};
    const formatMoney = (v: any) => v && v !== '招标文件未提及' ? `${v}元` : v || '-';
    const financialFields = [
      { fieldName: '资金来源', value: financialInfo.fundingSource || '-' },
      { fieldName: '预算金额', value: formatMoney(financialInfo.budget) },
      { fieldName: '最高限价', value: formatMoney(financialInfo.maxPrice) },
      { fieldName: '需要预先投资金额', value: financialInfo.preInvestment || '-' },
      { fieldName: '付款方式', value: financialInfo.paymentMethod || '-' },
      { fieldName: '标书费', value: formatMoney(financialInfo.bidDocumentFee) },
      { fieldName: '投标保证金', value: financialInfo.bidBond || '-' },
      { fieldName: '履约保证金', value: financialInfo.performanceBond || '-' },
      { fieldName: '质量保证金', value: financialInfo.qualityBond || '-' },
      { fieldName: '保密保证金', value: financialInfo.confidentialityBond || '-' },
      { fieldName: '代理费', value: financialInfo.agencyFee || '-' },
    ];
    financialFields.forEach(f => addRow('第2类：财务信息', f.fieldName, f.value));

    // ==================== 第3类：资质要求 ====================
    const qualReqs = data.qualificationRequirements || [];
    qualReqs.forEach((q: Record<string, any>) => {
      addRow('第3类：资质要求', '联合体投标', q.jointBid || '-', '', q.isSubstantial ? '▲' : '');
      addRow('第3类：资质要求', '分包转包', q.subcontracting || '-');
      addRow('第3类：资质要求', '企业规模要求', q.companyScaleReq || '-');
      addRow('第3类：资质要求', '特别资质', q.specialQualification || '-');
      addRow('第3类：资质要求', '特别人员要求', q.specialPersonnelReq || '-');
      addRow('第3类：资质要求', '特别说明', q.specialNotes || '-');
      addRow('第3类：资质要求', '政策优惠', q.policyBenefits || '-');
      addRow('第3类：资质要求', '资格性审查', q.qualificationReview || '-');
      addRow('第3类：资质要求', '符合性审查', q.complianceReview || '-');
      addRow('第3类：资质要求', '信用要求', q.creditRequirements || '-');
    });

    // ==================== 第4类：评分规则 ====================
    const scoringRules = data.scoringRules || {};
    addRow('第4类：评分规则', '总分', `${scoringRules.totalScore || 100}分`, '', '', '', '是');
    addRow('第4类：评分规则', '客观分', `${scoringRules.objectiveScore || 42}分`, '', '', '', '是');
    addRow('第4类：评分规则', '主观分', `${scoringRules.subjectiveScore || 58}分`, '', '', '', '是');
    addRow('第4类：评分规则', '价格分', `${scoringRules.priceScore || 10}分`, '', '', '', '是');
    addRow('第4类：评分规则', '商务分', `${scoringRules.commercialScore || 1}分`, '', '', '', '是');
    addRow('第4类：评分规则', '技术分', `${scoringRules.technicalScore || 41}分`, '', '', '', '是');
    addRow('第4类：评分规则', '中标方式', scoringRules.winningMethod || '-');
    addRow('第4类：评分规则', '评标方式', scoringRules.evaluationMethod || '-');
    addRow('第4类：评分规则', '客观分：主观分比例', scoringRules.objectiveSubjectiveRatio || '-');
    if (scoringRules.voidBidExplanation) {
      addRow('第4类：评分规则', '废标说明', scoringRules.voidBidExplanation, '', '高', '是', '', '重点关注');
    }
    if (scoringRules.specialScoringRequirements) {
      addRow('第4类：评分规则', '评分特别要求', scoringRules.specialScoringRequirements, '', '中');
    }

    // 评分项明细
    const scoringItems = scoringRules.items || [];
    scoringItems.forEach((item: Record<string, any>) => {
      addRow('第4类：评分规则', `评分项: ${item.name || '-'}`, 
        `[${item.category || '-'}] 最高${item.maxScore || 0}分 | ${item.description || '-'}`,
        item.calculationMethod || '', '', '', '是');
    });

    // 要求的证书
    const companyCerts = scoringRules.requiredCompanyCertificates || [];
    if (companyCerts.length > 0 && companyCerts[0] !== '招标文件未提及') {
      addRow('第4类：评分规则', '要求企业资质证书', companyCerts.join('、'), '', '高', '', '是', '确认是否具备');
    }
    const personnelCerts = scoringRules.requiredPersonnelCertificates || [];
    if (personnelCerts.length > 0 && personnelCerts[0] !== '招标文件未提及') {
      addRow('第4类：评分规则', '要求人员资质证书', Array.isArray(personnelCerts) ? personnelCerts.join('、') : String(personnelCerts), '', '高', '', '是', '确认是否具备');
    }
    const productReports = scoringRules.requiredProductReports || [];
    if (productReports.length > 0 && productReports[0] !== '招标文件未提及') {
      addRow('第4类：评分规则', '要求产品检测报告', productReports.join('、'), '', '高', '', '是', '提前准备');
    }

    // ==================== 第5类：时间要求 ====================
    const timeReqs = data.timeRequirements || {};
    const timeFields = [
      { fieldName: '获取招标文件截止时间', value: timeReqs.documentAcquisitionDeadline || '-' },
      { fieldName: '标前提问截止时间', value: timeReqs.preBidQuestionDeadline || '-' },
      { fieldName: '开标时间', value: timeReqs.bidOpeningTime || '-' },
      { fieldName: '中标交货时间/项目实施期', value: timeReqs.winningDeliveryTime || '-' },
      { fieldName: '合同履约期限', value: timeReqs.contractPerformancePeriod || '-' },
    ];
    timeFields.forEach(f => addRow('第5类：时间要求', f.fieldName, f.value));

    // ==================== 第6类：项目信息 ====================
    const projectInfo = data.projectInfo || {};
    addRow('第6类：项目信息', '▲★※的满足要求', projectInfo.substantialRequirements || '-');
    addRow('第6类：项目信息', '偏离▲★※的结果', projectInfo.deviationResult || '-');
    addRow('第6类：项目信息', '图纸提供情况', projectInfo.drawingsProvided || '-');
    addRow('第6类：项目信息', '现场踏勘', projectInfo.siteSurveyRequired || '-');
    addRow('第6类：项目信息', '踏勘需要确认问题', projectInfo.siteSurveyConfirmation || '-');
    addRow('第6类：项目信息', '控标点', projectInfo.controlPoints || '-');
    addRow('第6类：项目信息', '商务需求', projectInfo.businessRequirements || '-');
    addRow('第6类：项目信息', '技术需求（技术参数）', projectInfo.technicalRequirements || '-');
    addRow('第6类：项目信息', '核心服务需求', projectInfo.coreServiceRequirements || '-');
    addRow('第6类：项目信息', '项目成果要求', projectInfo.projectOutcomeRequirements || '-');
    addRow('第6类：项目信息', '最终交付', projectInfo.finalDelivery || '-');
    addRow('第6类：项目信息', '项目特别提到点', projectInfo.specialProjectPoints || '-');
    addRow('第6类：项目信息', '正本副本', projectInfo.originalCopies || '-');
    addRow('第6类：项目信息', '报价文件提交标记', projectInfo.bidSubmissionMarking || '-');
    addRow('第6类：项目信息', '密封包装盖章要求', projectInfo.sealingRequirements || '-');
    addRow('第6类：项目信息', '验收要求', projectInfo.acceptanceRequirements || '-');

    // ==================== 第7类：电话问题（AI分析生成） ====================
    const phoneQuestions = data.phoneQuestions || [];
    if (phoneQuestions.length > 0) {
      phoneQuestions.forEach((q: Record<string, any>, idx: number) => {
        const priority = q.priority || 'medium';
        const riskLevel = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';
        addRow('第7类：应该电话问题', `问题${idx + 1}: ${q.question || '-'}`, 
          q.reason || '-', q.category || '', riskLevel, '', '', '电话确认');
      });
    }

    // ==================== 风险清单 ====================
    const risks = data.risks || [];
    risks.forEach((risk: Record<string, any>) => {
      const levelMap: Record<string, string> = { critical: '严重', high: '高', medium: '中', low: '低' };
      addRow('风险清单', risk.title || '风险项', risk.description || '', risk.source || '',
        levelMap[risk.level] || '中', risk.category === 'void' ? '是' : '否',
        risk.category === 'score' ? '是' : '否', risk.suggestion || '');
    });

    // ==================== 投标建议 ====================
    const recMap: Record<string, string> = { bid: '建议投标', noBid: '不建议投标', caution: '谨慎投标' };
    addRow('投标建议', '建议', recMap[data.recommendation] || data.recommendation || '谨慎投标', 
      (data.reasons || []).join('；'));

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bid-assessment-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: '生成报告失败' }, { status: 500 });
  }
}
