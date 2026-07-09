import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body.assessment || body;
    const isPaid = body.isPaid || false;

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('投标决策评估表');

    sheet.columns = [
      { header: '编号', key: 'no', width: 6 },
      { header: '字段名称', key: 'fieldName', width: 22 },
      { header: '项目数据要点', key: 'keyPoint', width: 60 },
      { header: '备注', key: 'detail', width: 40 },
      { header: 'Document Locator', key: 'source', width: 55 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 22;
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    let rowNumber = 0;

    const formatDocLocator = (raw: string): string => {
      if (!raw || raw === '招标文件' || raw === '评分标准' || raw === '废标条款' || raw === '来源未定位') return raw || '—';
      if (raw.startsWith('章节：') || raw.startsWith('章节:')) return raw;
      if (raw.includes('｜') || raw.includes('|')) {
        const sep = raw.includes('｜') ? '｜' : '|';
        const parts = raw.split(sep);
        const pdfPage = parts[1] ? parts[1].replace('系统第', '').replace('页', '') : '';
        const textPage = parts[2] ? parts[2].replace('正文页码第', '').replace('页', '').trim() : '';
        const chapter = parts[3] || '';
        const quote = parts[4] || '';
        const pdfPart = pdfPage ? `PDF第${pdfPage}页` : '';
        const textPart = textPage && textPage !== pdfPage ? `正文第${textPage}页` : '';
        const chapterPart = chapter ? `章节：${chapter}` : '';
        const quotePart = quote ? `引用原文："${quote}"` : '';
        return [chapterPart, pdfPart, textPart, quotePart].filter(Boolean).join('；');
      }
      if (raw.length > 120) return raw.substring(0, 120) + '...';
      return raw;
    };

    const sectionColors: Record<string, string> = {
      '基本信息': 'FF2980B9',
      '财务信息': 'FF3498DB',
      '资质要求': 'FFF39C12',
      '评分规则': 'FF27AE60',
      '时间要求': 'FF9B59B6',
      '项目信息': 'FFE67E22',
      '老板总结': 'FF7C3AED',
    };

    const addSeparatorRow = (title: string) => {
      const row = sheet.addRow({ no: '', fieldName: '', keyPoint: title, detail: '', source: '' });
      row.height = 20;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionColors[title.replace(/第\d+类：/, '')] || 'FF7C3AED' } };
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle' };
      });
      sheet.mergeCells(row.number, 1, row.number, 5);
    };

    const addRow = (fieldName: string, keyPoint: string, detail: string = '', source: string = '', isCritical: boolean = false) => {
      rowNumber++;
      const row = sheet.addRow({ no: rowNumber, fieldName, keyPoint, detail, source });
      row.alignment = { vertical: 'top', wrapText: true };
      if (isCritical) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5EE' } };
          cell.font = { bold: true };
        });
      }
    };

    const getS = (section: any, key: string): string => {
      if (!section || !section._source) return '—';
      if (section._source[key]) return formatDocLocator(section._source[key]);
      for (const v of Object.values(section._source)) {
        if (typeof v === 'string' && (v.includes('PDF第') || v.includes('系统第') || (v.includes('第') && v.includes('页'))))
          return formatDocLocator(v);
      }
      return '—';
    };

    // ==================== 第1类：基本信息 ====================
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
    addSeparatorRow('第2类：财务信息');
    const financialInfo = data.financialInfo || {};
    addRow('资金来源', financialInfo.fundingSource || '-', '', getS(financialInfo, 'fundingSource'));
    addRow('预算金额', financialInfo.budget ? `${Number(financialInfo.budget).toLocaleString()}元` : '-', '', getS(financialInfo, 'budget'), true);
    if (financialInfo.maxPrice) addRow('最高限价', `${Number(financialInfo.maxPrice).toLocaleString()}元`, '超出无效', getS(financialInfo, 'maxPrice'), true);
    addRow('付款方式', financialInfo.paymentMethod || '-', '', getS(financialInfo, 'paymentMethod'));
    addRow('标书费', financialInfo.bidDocumentFee ? `${financialInfo.bidDocumentFee}元` : '0元（免费）', '', getS(financialInfo, 'bidDocumentFee'));
    addRow('投标保证金', financialInfo.bidBond || '不收取', '', getS(financialInfo, 'bidBond'));
    addRow('履约保证金', financialInfo.performanceBond || '-', '', getS(financialInfo, 'performanceBond'));
    addRow('质量保证金', financialInfo.qualityBond || '-', '', getS(financialInfo, 'qualityBond'));
    addRow('代理费', financialInfo.agencyFee || '无', '', getS(financialInfo, 'agencyFee'));

    // ==================== 第3类：资质要求 ====================
    addSeparatorRow('第3类：资质要求');
    const qualReqs = data.qualificationRequirements || [];
    qualReqs.forEach((q: Record<string, any>) => {
      const qS = (k: string) => getS(q, k);
      if (q.jointBid && q.jointBid !== '招标文件未提及') addRow('联合体投标', q.jointBid, q.isSubstantial ? '实质性要求' : '', qS('jointBid'));
      if (q.subcontracting && q.subcontracting !== '招标文件未提及') addRow('分包转包', q.subcontracting, '', qS('subcontracting'));
      if (q.specialQualification && q.specialQualification !== '招标文件未提及') addRow('特别资质', q.specialQualification, '', qS('specialQualification'), true);
      if (q.specialPersonnelReq && q.specialPersonnelReq !== '招标文件未提及') addRow('特别人员要求', q.specialPersonnelReq, '', qS('specialPersonnelReq'));
      if (q.specialNotes && q.specialNotes !== '招标文件未提及') addRow('特别说明', q.specialNotes, '', qS('specialNotes'));
      if (q.policyBenefits && q.policyBenefits !== '招标文件未提及') addRow('政策优惠', q.policyBenefits, '', qS('policyBenefits'));
      if (q.qualificationReview && q.qualificationReview !== '招标文件未提及') addRow('资格性审查', q.qualificationReview, '一票否决', qS('qualificationReview'), true);
      if (q.complianceReview && q.complianceReview !== '招标文件未提及') addRow('符合性审查', q.complianceReview, '一票否决', qS('complianceReview'), true);
      if (q.creditRequirements && q.creditRequirements !== '招标文件未提及') addRow('信用要求', q.creditRequirements, '', qS('creditRequirements'));
    });

    // ==================== 第4类：评分规则 ====================
    addSeparatorRow('第4类：评分规则');
    const scoringRules = data.scoringRules || {};
    const scS = (k: string) => getS(scoringRules, k);
    addRow('总分', `${scoringRules.totalScore || 100}分`, '', scS('totalScore'));
    addRow('客观分', `${scoringRules.objectiveScore || 0}分`, '', scS('objectiveScore'));
    addRow('主观分', `${scoringRules.subjectiveScore || 0}分`, '', scS('subjectiveScore'));
    addRow('价格分', `${scoringRules.priceScore || 0}分`, scoringRules.priceScoreDetail || '低价优先法', scS('priceScore'));
    addRow('商务分', `${scoringRules.commercialScore || 0}分`, scoringRules.commercialScoreDetail || '', scS('commercialScore'));
    addRow('技术分', `${scoringRules.technicalScore || 0}分`, scoringRules.technicalScoreDetail || '', scS('technicalScore'));
    addRow('中标方式', scoringRules.winningMethod || '-', '', scS('winningMethod'));
    addRow('评标方式', scoringRules.evaluationMethod || '-', '', scS('evaluationMethod'));
    if (scoringRules.voidBidExplanation) addRow('废标说明', scoringRules.voidBidExplanation, '重点！', scS('voidBidExplanation'), true);
    if (scoringRules.specialScoringRequirements) addRow('评分特别要求', scoringRules.specialScoringRequirements, '', scS('specialScoringRequirements'));
    const companyCerts = scoringRules.requiredCompanyCertificates || [];
    if (companyCerts.length > 0 && companyCerts[0] !== '招标文件未提及') addRow('要求企业证书', Array.isArray(companyCerts) ? companyCerts.join('、') : String(companyCerts), '', scS('requiredCompanyCertificates'));
    const personnelCerts = scoringRules.requiredPersonnelCertificates || [];
    if (personnelCerts.length > 0 && personnelCerts[0] !== '招标文件未提及') addRow('要求人员证书', Array.isArray(personnelCerts) ? personnelCerts.join('、') : String(personnelCerts), '', scS('requiredPersonnelCertificates'));

    // 评分项明细 - 每项单独一行
    const scoringItems = scoringRules.items || [];
    if (scoringItems.length > 0) {
      scoringItems.forEach((item: Record<string, any>) => {
        const category = item.category || '评分项';
        const name = item.name || '-';
        const maxScore = item.maxScore || 0;
        const desc = item.description || '';
        const calc = item.calculationMethod || '';
        addRow(category, `${name}（${maxScore}分）`, desc || calc, '');
      });
    }

    // ==================== 第5类：时间要求 ====================
    addSeparatorRow('第5类：时间要求');
    const timeReqs = data.timeRequirements || {};
    const tS = (k: string) => getS(timeReqs, k);
    addRow('获取招标文件截止', timeReqs.documentAcquisitionDeadline || '-', '', tS('documentAcquisitionDeadline'));
    addRow('标前提问截止', timeReqs.preBidQuestionDeadline || '-', '', tS('preBidQuestionDeadline'));
    addRow('开标时间', timeReqs.bidOpeningTime || '-', '', tS('bidOpeningTime'), true);
    addRow('中标交货时间', timeReqs.winningDeliveryTime || '-', '', tS('winningDeliveryTime'));
    addRow('合同履约期限', timeReqs.contractPerformancePeriod || '-', '', tS('contractPerformancePeriod'));

    // ==================== 第6类：项目信息 ====================
    addSeparatorRow('第6类：项目信息');
    const projectInfo = data.projectInfo || {};
    const pS = (k: string) => getS(projectInfo, k);
    if (projectInfo.substantialRequirements) addRow('▲★※满足要求', projectInfo.substantialRequirements, '重点！必须全部响应', pS('substantialRequirements'), true);
    if (projectInfo.deviationResult) addRow('偏离▲★※结果', projectInfo.deviationResult, '一项不满足即废标', pS('deviationResult'), true);
    if (projectInfo.voidBidConditions) addRow('废标/无效报价', projectInfo.voidBidConditions, '重点！', '', true);
    if (projectInfo.qualificationReviewItems) addRow('资格性审查项', projectInfo.qualificationReviewItems, '一票否决', '', true);
    if (projectInfo.complianceReviewItems) addRow('符合性审查项', projectInfo.complianceReviewItems, '一票否决', '', true);
    if (projectInfo.drawingsProvided) addRow('图纸提供', projectInfo.drawingsProvided, '', pS('drawingsProvided'));
    addRow('现场踏勘', projectInfo.siteSurveyRequired || '-', '', pS('siteSurveyRequired'));
    if (projectInfo.controlPoints) addRow('控标点', projectInfo.controlPoints, '', pS('controlPoints'));
    if (projectInfo.businessRequirements) addRow('商务需求', projectInfo.businessRequirements, '', pS('businessRequirements'));
    if (projectInfo.technicalRequirements) addRow('技术需求', projectInfo.technicalRequirements, '', pS('technicalRequirements'));
    if (projectInfo.coreServiceRequirements) addRow('核心服务需求', projectInfo.coreServiceRequirements, '', pS('coreServiceRequirements'));
    if (projectInfo.projectOutcomeRequirements) addRow('项目成果要求', projectInfo.projectOutcomeRequirements, '', pS('projectOutcomeRequirements'));
    if (projectInfo.finalDelivery) addRow('最终交付', projectInfo.finalDelivery, '', pS('finalDelivery'));
    if (projectInfo.specialProjectPoints) addRow('项目特别提到点', projectInfo.specialProjectPoints, '', pS('specialProjectPoints'));
    addRow('正本副本', projectInfo.originalCopies || '-', '', pS('originalCopies'));
    addRow('密封要求', projectInfo.sealingRequirements || '-', '', pS('sealingRequirements'));
    addRow('包装要求', projectInfo.packagingRequirements || '-', '', pS('packagingRequirements'));
    addRow('盖章要求', projectInfo.stampingRequirements || '-', '', pS('stampingRequirements'));
    addRow('签字要求', projectInfo.signatureRequirements || '-', '', pS('signatureRequirements'));
    addRow('验收要求', projectInfo.acceptanceRequirements || '-', '', pS('acceptanceRequirements'));

    // ==================== 第7类：老板总结 ====================
    addSeparatorRow('第7类：老板总结');
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


    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `bid-assessment-${Date.now()}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    const errorDetail = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    console.error('Report generation error:', errorDetail);
    return NextResponse.json({ error: '生成报告失败' }, { status: 500 });
  }
}
