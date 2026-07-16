const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const testData = {
  basicInfo: {
    projectName: '测试项目名称',
    projectCode: 'TEST-2024-001',
    tenderer: '测试招标企业',
    contactPerson: '张三',
    contactPhone: '13800138000',
    agency: '测试代理机构',
    informationSource: '政府采购网',
    caRequirement: '需要CA证书',
    bidOpeningMethod: '公开招标',
    bidOpeningLocation: '北京市海淀区',
    registrationMethod: '在线报名',
    location: '北京市朝阳区'
  },
  financialInfo: {
    fundingSource: '财政资金',
    budget: 1000000,
    maxPrice: 950000,
    preInvestment: '无',
    paymentMethod: '验收后付款',
    bidDocumentFee: '500元',
    bidBond: '20000元',
    performanceBond: '合同金额的10%',
    qualityBond: '合同金额的5%',
    confidentialityBond: '无',
    agencyFee: '无'
  },
  qualificationRequirements: [{
    jointBid: '不允许',
    subcontracting: '不允许',
    companyScaleReq: '无特殊要求',
    specialQualification: '无',
    specialPersonnelReq: '无',
    specialNotes: '无',
    policyBenefits: '无',
    qualificationReview: '资格性审查',
    complianceReview: '符合性审查',
    creditRequirements: '无不良记录'
  }],
  scoringRules: {
    totalScore: 100,
    priceScore: 30,
    commercialScore: 20,
    technicalScore: 50,
    winningMethod: '综合评分法',
    evaluationMethod: '综合评分法',
    objectiveSubjectiveRatio: '40:60',
    voidBidExplanation: '无废标条款',
    specialScoringRequirements: '无',
    requiredCompanyCertificates: ['营业执照', '税务登记证'],
    requiredPersonnelCertificates: ['项目经理证书'],
    requiredProductReports: ['产品检测报告'],
    commercialScoreDetail: '商务分评审明细内容',
    technicalScoreDetail: '技术分评审明细内容'
  },
  timeRequirements: {
    documentAcquisitionDeadline: '2024-12-31',
    preBidQuestionDeadline: '2024-12-20',
    bidOpeningTime: '2025-01-10',
    winningDeliveryTime: '2025-02-01',
    contractPerformancePeriod: '12个月'
  },
  projectInfo: {
    substantialRequirements: '实质性要求',
    deviationResult: '偏离结果',
    drawingsProvided: '是',
    drawingDepthRequirement: '施工图深度',
    drawingList: ['建筑图', '结构图'],
    siteSurveyRequired: '是',
    siteSurveyConfirmation: '需确认问题',
    controlPoints: '控标点',
    businessRequirements: '商务需求',
    technicalRequirements: '技术需求',
    coreServiceRequirements: '核心服务需求',
    projectOutcomeRequirements: '项目成果要求',
    finalDelivery: '最终交付',
    specialProjectPoints: '特别提到点',
    originalCopies: '正本1份，副本3份',
    bidSubmissionMarking: '需标记',
    sealingRequirements: '密封包装盖章要求',
    signatureRequirements: '签字要求',
    acceptanceRequirements: '验收要求'
  },
  phoneQuestions: [
    { question: '问题1：关于付款方式' },
    { question: '问题2：关于交货时间' }
  ],
  risks: [
    { description: '风险1：付款周期较长' },
    { description: '风险2：技术要求较高' }
  ],
  checklist: [
    { category: '商务文件', items: ['营业执照', '税务登记证'] },
    { category: '技术文件', items: ['技术方案', '产品检测报告'] }
  ],
  recommendation: 'bid',
  reasons: ['利润空间大', '技术要求匹配']
};

function testExcelExport() {
  console.log('=== 测试Excel导出 ===');

  const rows = [];
  let rowNum = 0;

  const addSeparator = (title) => {
    rows.push({ no: '', fieldName: '', data: title, source: '', isSeparator: true, categoryLabel: title });
  };

  const addRow = (fieldName, data, source = '') => {
    rowNum++;
    rows.push({ no: String(rowNum), fieldName, data, source });
  };

  addSeparator('第一类：基本信息');
  const basicInfo = testData.basicInfo;
  addRow('项目名称', basicInfo.projectName, '');
  addRow('项目编号', basicInfo.projectCode, '');
  addRow('招标企业', basicInfo.tenderer, '');
  addRow('招标联系人', basicInfo.contactPerson, '');
  addRow('联系电话', basicInfo.contactPhone, '');
  addRow('代理机构', basicInfo.agency, '');
  addRow('信息来源', basicInfo.informationSource, '');
  addRow('CA需求', basicInfo.caRequirement, '');
  addRow('开标方式', basicInfo.bidOpeningMethod, '');
  addRow('开标地点', basicInfo.bidOpeningLocation, '');
  addRow('如何报名/获取招标文件', basicInfo.registrationMethod, '');
  addRow('项目地点', basicInfo.location, '');

  addSeparator('第二类：财务信息');
  const fin = testData.financialInfo;
  addRow('资金来源', fin.fundingSource, '');
  addRow('预算金额(元)', `${fin.budget}元`, '');
  addRow('最高限价(元)', `${fin.maxPrice}元`, '');
  addRow('需要预先投资金额', fin.preInvestment, '');
  addRow('付款方式', fin.paymentMethod, '');
  addRow('标书费', fin.bidDocumentFee, '');
  addRow('投标保证金', fin.bidBond, '');
  addRow('履约保证金', fin.performanceBond, '');
  addRow('质量保证金', fin.qualityBond, '');
  addRow('保密保证金', fin.confidentialityBond, '');
  addRow('代理费', fin.agencyFee, '');

  addSeparator('第三类：资质要求');
  const q = testData.qualificationRequirements[0];
  addRow('联合体投标', q.jointBid, '');
  addRow('分包转包', q.subcontracting, '');
  addRow('企业规模要求', q.companyScaleReq, '');
  addRow('特别资质', q.specialQualification, '');
  addRow('特别人员要求', q.specialPersonnelReq, '');
  addRow('特别说明', q.specialNotes, '');
  addRow('政策优惠', q.policyBenefits, '');
  addRow('资格性审查', q.qualificationReview, '');
  addRow('符合性审查', q.complianceReview, '');
  addRow('信用要求', q.creditRequirements, '');

  addSeparator('第四类：评分规则');
  const sc = testData.scoringRules;
  addRow('总分', `${sc.totalScore}分`, '');
  addRow('价格分', `${sc.priceScore}分`, '');
  addRow('商务分', `${sc.commercialScore}分`, '');
  addRow('技术分', `${sc.technicalScore}分`, '');
  addRow('中标方式', sc.winningMethod, '');
  addRow('评标方式', sc.evaluationMethod, '');
  addRow('客观分/主观分比例', sc.objectiveSubjectiveRatio, '');
  addRow('废标说明', sc.voidBidExplanation, '');
  addRow('评分特别要求', sc.specialScoringRequirements, '');
  addRow('要求企业资质证书', sc.requiredCompanyCertificates.join('、'), '');
  addRow('要求人员资质证书', sc.requiredPersonnelCertificates.join('、'), '');
  addRow('要求产品检测报告', sc.requiredProductReports.join('、'), '');
  addRow('商务分评审明细', sc.commercialScoreDetail, '');
  addRow('技术分评审明细', sc.technicalScoreDetail, '');

  addSeparator('第五类：时间要求');
  const timeReqs = testData.timeRequirements;
  addRow('获取招标文件截止时间', timeReqs.documentAcquisitionDeadline, '');
  addRow('标前提问截止时间', timeReqs.preBidQuestionDeadline, '');
  addRow('开标时间', timeReqs.bidOpeningTime, '');
  addRow('中标交货时间/项目实施期', timeReqs.winningDeliveryTime, '');
  addRow('合同履约期限', timeReqs.contractPerformancePeriod, '');

  addSeparator('第六类：项目信息');
  const proj = testData.projectInfo;
  addRow('▲★※要求', proj.substantialRequirements, '');
  addRow('偏离▲★※的结果', proj.deviationResult, '');
  addRow('图纸提供情况', proj.drawingsProvided, '');
  addRow('图纸深度要求', proj.drawingDepthRequirement, '');
  addRow('图纸清单', proj.drawingList.join('、'), '');
  addRow('现场踏勘', proj.siteSurveyRequired, '');
  addRow('踏勘需要确认问题', proj.siteSurveyConfirmation, '');
  addRow('控标点', proj.controlPoints, '');
  addRow('商务需求', proj.businessRequirements, '');
  addRow('技术需求（技术参数）', proj.technicalRequirements, '');
  addRow('核心服务需求', proj.coreServiceRequirements, '');
  addRow('项目成果要求', proj.projectOutcomeRequirements, '');
  addRow('最终交付', proj.finalDelivery, '');
  addRow('项目特别提到点', proj.specialProjectPoints, '');
  addRow('正本副本', proj.originalCopies, '');
  addRow('报价文件提交标记', proj.bidSubmissionMarking, '');
  addRow('密封包装盖章要求', proj.sealingRequirements, '');
  addRow('签字要求', proj.signatureRequirements, '');
  addRow('验收要求', proj.acceptanceRequirements, '');

  addSeparator('特殊行');
  addRow('1、电话问题', testData.phoneQuestions.map(q => q.question).join('；'), '');
  addRow('2、风险清单', testData.risks.map(r => r.description).join('；'), '');
  addRow('3、准备分工', testData.checklist.map(t => `${t.category}${t.items.join('、')}`).join('；'), '');
  addRow('4、投标建议', `建议投标；${testData.reasons.join('；')}`, '');

  const wsData = [];
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
  ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 100 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, ws, '投标决策评估表');

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const desktopPath = path.join('C:\\Users\\ips\\Desktop', 'test-report.xlsx');
  fs.writeFileSync(desktopPath, xlsxBuffer);
  console.log(`Excel导出成功: ${desktopPath}`);
  console.log(`共 ${rowNum} 行数据`);

  const fieldNames = rows.filter(r => !r.isSeparator).map(r => r.fieldName);
  console.log('\n=== 字段列表 ===');
  fieldNames.forEach((f, i) => console.log(`${i+1}. ${f}`));
}

testExcelExport();
