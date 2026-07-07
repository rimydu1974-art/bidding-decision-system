import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedRules = [
  // 废标/无效报价
  { category: 'void-bid', name: '废标关键词', keywords: ['废标', '无效投标', '无效报价', '否决', '不予受理', '取消资格'] },
  { category: 'void-bid', name: '隐性废标关键词', keywords: ['点对点应答', '明确答复', '放弃应答', '后果由投标人承担', '未实质性响应', '非实质性偏离', '未响应则无效', '一项不满足即无效', '未提供则视为无效', '未按要求则无效'] },
  { category: 'void-bid', name: '资格性审查', keywords: ['资格性审查', '资格审查不合格', '资格不符'] },
  { category: 'void-bid', name: '符合性审查', keywords: ['符合性审查', '符合性审查不合格', '未通过符合性审查'] },
  { category: 'void-bid', name: '串通报价', keywords: ['串通', '串标', '围标', '恶意报价', '虚假报价'] },

  // 金额/保证金
  { category: 'financial', name: '预算金额', keywords: ['预算', '预算金额', '预算价', '采购预算'] },
  { category: 'financial', name: '最高限价', keywords: ['最高限价', '限价', '控制价', '招标控制价', '上限价'] },
  { category: 'financial', name: '投标保证金', keywords: ['投标保证金', '保证金', '担保金', '保函'] },
  { category: 'financial', name: '履约保证金', keywords: ['履约保证金', '履约担保'] },
  { category: 'financial', name: '代理服务费', keywords: ['代理服务费', '招标代理费', '代理费'] },
  { category: 'financial', name: '报价要求', keywords: ['报价', '投标报价', '总价', '单价', '合价'] },

  // 日期/截止时间
  { category: 'timeline', name: '投标截止时间', keywords: ['投标截止', '截止时间', '开标时间', '提交截止'] },
  { category: 'timeline', name: '公告时间', keywords: ['公告', '发布日期', '公示期', '公告期限'] },
  { category: 'timeline', name: '开标时间', keywords: ['开标', '开标日期', '开标地点'] },
  { category: 'timeline', name: '合同签订', keywords: ['签订合同', '合同签订', '签订时间'] },
  { category: 'timeline', name: '履约时间', keywords: ['供货期', '工期', '交货期', '服务期', '完工时间'] },
  { category: 'timeline', name: '质疑时间', keywords: ['质疑', '异议', '投诉'] },

  // 资质证书
  { category: 'qualification', name: '营业执照', keywords: ['营业执照', '法人资格', '企业法人'] },
  { category: 'qualification', name: '资质等级', keywords: ['资质等级', '资质要求', '资质证书', '资质条件'] },
  { category: 'qualification', name: 'ISO认证', keywords: ['ISO', 'ISO9001', 'ISO14001', 'ISO45001', '质量管理体系', '环境管理体系'] },
  { category: 'qualification', name: '财务状况', keywords: ['财务报表', '财务状况', '审计报告', '纳税证明'] },
  { category: 'qualification', name: '审计报告', keywords: ['审计报告', '备案', '编码', '审计备案号', '审计编号'] },
  { category: 'qualification', name: '业绩要求', keywords: ['类似业绩', '类似项目', '合同业绩', '业绩证明', '军采项目', '军采', '收款截图', '中标通知书', '客户反馈', '用户反馈', '验收报告'] },
  { category: 'qualification', name: '人员资格', keywords: ['项目经理', '技术负责人', '资格证书', '注册证书'] },
  { category: 'qualification', name: '社保税务', keywords: ['社保', '社会保障', '纳税', '社保证明', '完税证明'] },

  // 密封/签字/盖章
  { category: 'document-req', name: '密封要求', keywords: ['密封', '封口', '封套', '密封袋', '密封包装'] },
  { category: 'document-req', name: '盖章要求', keywords: ['盖章', '公章', '法人章', '合同章', '骑缝章', '每页盖章'] },
  { category: 'document-req', name: '签字要求', keywords: ['签字', '签名', '法定代表人签字', '授权代表签字', '手写签名'] },
  { category: 'document-req', name: '包装要求', keywords: ['包装', '正本', '副本', '电子版', '光盘', 'U盘'] },
  { category: 'document-req', name: '标签要求', keywords: ['标签', '标注', '封套标注', '标记', '项目名称'] },
  { category: 'document-req', name: '份数要求', keywords: ['正本', '副本', '份数', '数量', '纸质版', '电子版', '一式', '份'] },

  // 评分数字
  { category: 'scoring', name: '总分', keywords: ['总分', '满分', '100分', '基准分'] },
  { category: 'scoring', name: '价格分', keywords: ['价格分', '报价得分', '价格权重', '价格占比', '基准价', '评分基准价', '基准价格', '评标基准价'] },
  { category: 'scoring', name: '技术分', keywords: ['技术分', '技术评分', '技术得分', '技术权重', '技术指标'] },
  { category: 'scoring', name: '商务分', keywords: ['商务分', '商务评分', '商务得分', '商务权重', '商务条款'] },
  { category: 'scoring', name: '客观分', keywords: ['客观分', '客观评分', '客观得分', '资质证书分', '合同业绩分', '客观评审'] },
  { category: 'scoring', name: '主观分', keywords: ['主观分', '主观评分', '专家评审', '评委评分', '专家打分', '评委打分'] },

  // ▲★※标记
  { category: 'symbol', name: '三角标记', keywords: ['▲', '▲', '▲'], patterns: ['▲\\S+', '▲\\S+', '▲\\S+'] },
  { category: 'symbol', name: '星号标记', keywords: ['★', '★', '★'], patterns: ['★\\S+', '★\\S+', '★\\S+'] },
  { category: 'symbol', name: '米字号标记', keywords: ['※', '※', '※'], patterns: ['※\\S+', '※\\S+', '※\\S+'] },
];

async function main() {
  console.log('Clearing old rules...');
  await prisma.ruleConfig.deleteMany();
  
  console.log('Seeding rule configs...');
  
  for (const rule of seedRules) {
    await prisma.ruleConfig.create({
      data: {
        category: rule.category,
        name: rule.name,
        keywords: JSON.stringify(rule.keywords),
        patterns: JSON.stringify(rule.patterns || []),
        isActive: true,
      },
    });
    console.log(`  Created: ${rule.category}/${rule.name}`);
  }

  console.log(`\nDone! Created ${seedRules.length} rules.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
