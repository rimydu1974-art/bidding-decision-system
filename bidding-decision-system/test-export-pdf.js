const fs = require('fs');
const path = require('path');

const testData = {
  basicInfo: {
    projectName: '测试项目名称', projectCode: 'TEST-2024-001', tenderer: '测试招标企业',
    contactPerson: '张三', contactPhone: '13800138000', agency: '测试代理机构',
    informationSource: '政府采购网', caRequirement: '需要CA证书',
    bidOpeningMethod: '公开招标', bidOpeningLocation: '北京市海淀区',
    registrationMethod: '在线报名', location: '北京市朝阳区'
  },
  financialInfo: {
    fundingSource: '财政资金', budget: 1000000, maxPrice: 950000,
    preInvestment: '无', paymentMethod: '验收后付款', bidDocumentFee: '500元',
    bidBond: '20000元', performanceBond: '合同金额的10%', qualityBond: '合同金额的5%',
    confidentialityBond: '无', agencyFee: '无'
  },
  qualificationRequirements: [{
    jointBid: '不允许', subcontracting: '不允许', companyScaleReq: '无特殊要求',
    specialQualification: '无', specialPersonnelReq: '无', specialNotes: '无',
    policyBenefits: '无', qualificationReview: '资格性审查',
    complianceReview: '符合性审查', creditRequirements: '无不良记录'
  }],
  scoringRules: {
    totalScore: 100, priceScore: 30, commercialScore: 20, technicalScore: 50,
    winningMethod: '综合评分法', evaluationMethod: '综合评分法',
    objectiveSubjectiveRatio: '40:60', voidBidExplanation: '无废标条款',
    specialScoringRequirements: '无',
    requiredCompanyCertificates: ['营业执照', '税务登记证'],
    requiredPersonnelCertificates: ['项目经理证书'],
    requiredProductReports: ['产品检测报告'],
    commercialScoreDetail: '商务分评审明细内容',
    technicalScoreDetail: '技术分评审明细内容'
  },
  timeRequirements: {
    documentAcquisitionDeadline: '2024-12-31', preBidQuestionDeadline: '2024-12-20',
    bidOpeningTime: '2025-01-10', winningDeliveryTime: '2025-02-01',
    contractPerformancePeriod: '12个月'
  },
  projectInfo: {
    substantialRequirements: '实质性要求', deviationResult: '偏离结果',
    drawingsProvided: '是', drawingDepthRequirement: '施工图深度',
    drawingList: ['建筑图', '结构图'], siteSurveyRequired: '是',
    siteSurveyConfirmation: '需确认问题', controlPoints: '控标点',
    businessRequirements: '商务需求', technicalRequirements: '技术需求',
    coreServiceRequirements: '核心服务需求', projectOutcomeRequirements: '项目成果要求',
    finalDelivery: '最终交付', specialProjectPoints: '特别提到点',
    originalCopies: '正本1份，副本3份', bidSubmissionMarking: '需标记',
    sealingRequirements: '密封包装盖章要求', signatureRequirements: '签字要求',
    acceptanceRequirements: '验收要求'
  },
  phoneQuestions: [{ question: '问题1：关于付款方式' }, { question: '问题2：关于交货时间' }],
  risks: [{ description: '风险1：付款周期较长' }, { description: '风险2：技术要求较高' }],
  checklist: [
    { category: '商务文件', items: ['营业执照', '税务登记证'] },
    { category: '技术文件', items: ['技术方案', '产品检测报告'] }
  ],
  recommendation: 'bid', reasons: ['利润空间大', '技术要求匹配']
};

const jspdfModule = require('jspdf');
const jspdfAutoTableModule = require('jspdf-autotable');

(async () => {
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
  const autoTable = jspdfAutoTableModule.default || jspdfAutoTableModule;

  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setFont('helvetica');

  doc.setFontSize(16);
  doc.text('OpenCheck Bid Decision Report', 105, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${testData.basicInfo.projectName} | ${testData.basicInfo.projectCode}`, 105, 22, { align: 'center' });

  const d = testData;
  const proj = d.projectInfo;
  const sc = d.scoringRules;
  const fin = d.financialInfo;
  const t = d.timeRequirements;
  const q = d.qualificationRequirements[0];

  const body = [];
  let no = 0;
  const sep = (label) => body.push([{ content: label, colSpan: 3, styles: { fillColor: [224, 224, 224], fontStyle: 'bold', halign: 'center' } }]);
  const row = (f, v) => { no++; body.push([{ content: String(no), styles: { halign: 'center' } }, f, v]); };

  sep('Category 1: Basic Info');
  row('Project Name', d.basicInfo.projectName);
  row('Project Code', d.basicInfo.projectCode);
  row('Tenderer', d.basicInfo.tenderer);
  row('Contact Person', d.basicInfo.contactPerson);
  row('Contact Phone', d.basicInfo.contactPhone);
  row('Agency', d.basicInfo.agency);
  row('Info Source', d.basicInfo.informationSource);
  row('CA Required', d.basicInfo.caRequirement);
  row('Bid Opening Method', d.basicInfo.bidOpeningMethod);
  row('Bid Opening Location', d.basicInfo.bidOpeningLocation);
  row('Registration Method', d.basicInfo.registrationMethod);
  row('Project Location', d.basicInfo.location);

  sep('Category 2: Financial Info');
  row('Funding Source', fin.fundingSource);
  row('Budget', `${fin.budget}`);
  row('Max Price', `${fin.maxPrice}`);
  row('Pre-Investment', fin.preInvestment);
  row('Payment Method', fin.paymentMethod);
  row('Bid Doc Fee', fin.bidDocumentFee);
  row('Bid Bond', fin.bidBond);
  row('Performance Bond', fin.performanceBond);
  row('Quality Bond', fin.qualityBond);
  row('Confidentiality Bond', fin.confidentialityBond);
  row('Agency Fee', fin.agencyFee);

  sep('Category 3: Qualification Requirements');
  row('Joint Bid', q.jointBid);
  row('Subcontracting', q.subcontracting);
  row('Company Scale', q.companyScaleReq);
  row('Special Qualification', q.specialQualification);
  row('Special Personnel', q.specialPersonnelReq);
  row('Special Notes', q.specialNotes);
  row('Policy Benefits', q.policyBenefits);
  row('Qualification Review', q.qualificationReview);
  row('Compliance Review', q.complianceReview);
  row('Credit Requirements', q.creditRequirements);

  sep('Category 4: Scoring Rules');
  row('Total Score', `${sc.totalScore}`);
  row('Price Score', `${sc.priceScore}`);
  row('Commercial Score', `${sc.commercialScore}`);
  row('Technical Score', `${sc.technicalScore}`);
  row('Winning Method', sc.winningMethod);
  row('Evaluation Method', sc.evaluationMethod);
  row('Obj/Subj Ratio', sc.objectiveSubjectiveRatio);
  row('Void Bid', sc.voidBidExplanation);
  row('Special Scoring', sc.specialScoringRequirements);
  row('Company Certs', sc.requiredCompanyCertificates.join(', '));
  row('Personnel Certs', sc.requiredPersonnelCertificates.join(', '));
  row('Product Reports', sc.requiredProductReports.join(', '));
  row('Commercial Detail', sc.commercialScoreDetail);
  row('Technical Detail', sc.technicalScoreDetail);

  sep('Category 5: Time Requirements');
  row('Doc Acquisition Deadline', t.documentAcquisitionDeadline);
  row('Pre-Bid Question Deadline', t.preBidQuestionDeadline);
  row('Bid Opening Time', t.bidOpeningTime);
  row('Delivery Time', t.winningDeliveryTime);
  row('Contract Period', t.contractPerformancePeriod);

  sep('Category 6: Project Info');
  row('Substantial Requirements', proj.substantialRequirements);
  row('Deviation Result', proj.deviationResult);
  row('Drawings Provided', proj.drawingsProvided);
  row('Drawing Depth Requirement', proj.drawingDepthRequirement);
  row('Drawing List', Array.isArray(proj.drawingList) ? proj.drawingList.join(', ') : proj.drawingList);
  row('Site Survey Required', proj.siteSurveyRequired);
  row('Site Survey Confirmation', proj.siteSurveyConfirmation);
  row('Control Points', proj.controlPoints);
  row('Business Requirements', proj.businessRequirements);
  row('Technical Requirements', proj.technicalRequirements);
  row('Core Service Requirements', proj.coreServiceRequirements);
  row('Project Outcome', proj.projectOutcomeRequirements);
  row('Final Delivery', proj.finalDelivery);
  row('Special Points', proj.specialProjectPoints);
  row('Original/Copies', proj.originalCopies);
  row('Bid Submission Marking', proj.bidSubmissionMarking);
  row('Sealing Requirements', proj.sealingRequirements);
  row('Signature Requirements', proj.signatureRequirements);
  row('Acceptance Requirements', proj.acceptanceRequirements);

  sep('Special Rows');
  row('Phone Questions', d.phoneQuestions.map(q => q.question).join('; '));
  row('Risk List', d.risks.map(r => r.description).join('; '));
  row('Preparation Tasks', d.checklist.map(t => `${t.category}: ${t.items.join(', ')}`).join('; '));
  row('Bid Recommendation', `Recommend: ${d.recommendation}; ${d.reasons.join('; ')}`);

  autoTable(doc, {
    startY: 28,
    head: [['No.', 'Field', 'Value']],
    body: body,
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', font: 'helvetica' },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 45 }, 2: { cellWidth: 'auto' } },
    margin: { top: 28, left: 10, right: 10 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }
  });

  const outputPath = path.join('C:\\Users\\ips\\Desktop', 'test-report.pdf');
  doc.save(outputPath);
  console.log(`PDF exported: ${outputPath}`);
  console.log(`Total rows: ${no}`);
})();
