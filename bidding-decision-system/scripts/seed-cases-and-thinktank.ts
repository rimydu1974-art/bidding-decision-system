import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CASES = [
  {
    title: '某市智慧城市信息化建设项目废标分析',
    source: 'platform',
    industry: '信息技术',
    content: '某市智慧城市信息化建设项目，预算2000万元。投标截止前3天，招标人发布补充通知修改了技术参数要求，但未延长投标截止时间。最终因响应投标人不足3家导致流标。\n\n关键问题：\n1. 补充通知实质性修改招标文件，应依法延长截止时间\n2. 投标人应关注招标文件修改公告，及时评估影响\n3. 招标代理机构未依法操作，导致项目延误',
    summary: '因招标人未依法延长投标截止时间导致流标',
    status: 'published',
    isPublic: true,
    expertComment: '此类情况在实践中较为常见，投标人应学会利用质疑程序维护自身权益。',
    tags: JSON.stringify(['废标', '流标', '智慧城市', '补充通知']),
    views: 128,
  },
  {
    title: '医疗器械采购项目资质造假案例',
    source: 'platform',
    industry: '医疗健康',
    content: '某省级医院医疗设备采购项目，中标人提交的ISO13485质量管理体系证书经核查为伪造。招标人取消其中标资格，并将其列入不良行为记录名单，3年内禁止参与该省公立医院采购活动。\n\n教训总结：\n1. 资质证书必须通过官方渠道核实\n2. 造假行为后果严重，不仅失去项目还影响后续投标\n3. 投标前应做好内部资质合规审查',
    summary: '投标人造假资质证书被取消中标资格并列入黑名单',
    status: 'published',
    isPublic: true,
    expertComment: '资质合规是投标的基础要求，任何侥幸心理都可能导致严重后果。',
    tags: JSON.stringify(['资质造假', '医疗器械', '黑名单', '合规']),
    views: 256,
  },
  {
    title: '政府采购最低价中标的风险案例',
    source: 'anonymous',
    industry: '政府采购',
    content: '某学校课桌椅采购项目，A公司以最低报价中标。但中标后发现原材料价格大幅上涨，A公司无法按投标价格履约，最终被取消中标资格并没收投标保证金。\n\n分析：\n1. 最低价中标不等于最优选择\n2. 投标报价应充分考虑成本波动风险\n3. 不合理低价可能构成恶意竞争',
    summary: '低价中标后无法履约，被没收保证金',
    status: 'published',
    isPublic: true,
    expertComment: '报价策略是投标决策的核心环节，需综合考虑成本、风险和利润空间。',
    tags: JSON.stringify(['最低价中标', '履约风险', '保证金', '报价策略']),
    views: 89,
  },
  {
    title: '工程建设项目围标串标查处案例',
    source: 'platform',
    industry: '工程建设',
    content: '某市政道路建设项目，监管部门通过电子招投标系统数据分析发现3家投标企业存在以下异常：\n- 投标文件由同一台电脑编制\n- 投标报价呈规律性差异\n- 企业法人存在关联关系\n\n最终认定为围标串标行为，3家企业均被列入黑名单，项目重新招标。',
    summary: '通过电子系统数据分析发现围标串标行为',
    status: 'published',
    isPublic: true,
    expertComment: '随着电子招投标系统的普及，围标串标行为越来越容易被识别。',
    tags: JSON.stringify(['围标串标', '电子招投标', '数据分析', '黑名单']),
    views: 312,
  },
  {
    title: '投标文件未按要求密封导致废标',
    source: 'anonymous',
    industry: '政府采购',
    content: '某政府办公楼装修项目开标现场，B公司的投标文件因未按招标文件要求密封（正本和副本未分开密封），被评标委员会判定为无效投标。\n\n注意事项：\n1. 投标文件密封要求必须逐项核对\n2. 开标前应建立完整的检查清单\n3. 格式性错误也会导致废标',
    summary: '投标文件密封不符合要求被废标',
    status: 'published',
    isPublic: true,
    expertComment: '格式合规是容易被忽视但后果严重的问题，建议建立标准化的投标文件检查流程。',
    tags: JSON.stringify(['废标', '文件密封', '格式要求', '检查清单']),
    views: 167,
  },
  {
    title: '联合体投标资质叠加的成功案例',
    source: 'expert',
    industry: '工程建设',
    content: '某大型污水处理厂建设项目要求投标人同时具备市政公用工程施工总承包一级和环保工程专业承包一级资质。C公司仅具备市政资质，联合具备环保资质的D公司组成联合体投标并成功中标。\n\n成功要素：\n1. 联合体协议明确分工和责任\n2. 主导方具备丰富的项目管理经验\n3. 资质互补满足招标要求\n4. 报价合理，技术方案优秀',
    summary: '通过联合体投标实现资质互补成功中标',
    status: 'published',
    isPublic: true,
    expertComment: '联合体投标是解决资质不足的有效途径，关键在于选择合适的合作伙伴。',
    tags: JSON.stringify(['联合体投标', '资质互补', '污水处理', '中标']),
    views: 198,
  },
];

const THINKTANK_ARTICLES = [
  {
    title: '2025年招投标法规十大变化解读',
    slug: '2025-bidding-law-top-10-changes',
    category: '法规解读',
    content: '# 2025年招投标法规十大变化解读\n\n## 1. 电子招投标全面推广\n新修订的《招标投标法》明确要求国有资金占控股或者主导地位的依法必须进行招标的项目，应当实行电子招投标。\n\n## 2. 信用体系深度整合\n投标人的信用状况将成为评标的重要参考因素，失信被执行人将受到更严格的限制。\n\n## 3. 异议和投诉程序优化\n压缩了异议提出和处理的时限，提高了争议解决效率。\n\n## 4. 评标专家管理加强\n建立全国统一的评标专家库，实行动态考核和退出机制。\n\n## 5. 招标代理机构规范化\n取消招标代理机构资格认定，加强事中事后监管。\n\n## 6. 投标保证金改革\n推行投标保证金保险和保函制度，降低企业资金占用。\n\n## 7. 中标候选人公示制度完善\n公示内容更加详细，接受社会监督。\n\n## 8. 围标串标打击力度加大\n利用大数据技术加强分析识别，加大处罚力度。\n\n## 9. 营商环境持续优化\n清理不合理限制，保障各类市场主体公平参与竞争。\n\n## 10. 跨区域投标便利化\n推进CA证书互认，降低跨区域投标成本。',
    summary: '深入解读2025年招投标领域最重要的法规变化，帮助企业及时调整投标策略',
    tags: JSON.stringify(['法规解读', '电子招投标', '信用体系', '营商环境']),
    coverImage: null,
    isPublished: true,
    views: 1580,
  },
  {
    title: '如何构建企业投标知识管理体系',
    slug: 'build-enterprise-bidding-knowledge-system',
    category: '行业洞察',
    content: '# 如何构建企业投标知识管理体系\n\n## 为什么需要知识管理\n投标工作涉及大量信息收集、文件编制和经验积累。没有系统的知识管理，企业会反复犯同样的错误，无法形成竞争优势。\n\n## 知识管理框架\n\n### 1. 法规政策库\n- 收集整理适用的法律法规\n- 跟踪政策变化和影响分析\n- 建立法规更新提醒机制\n\n### 2. 案例经验库\n- 记录每次投标的成功与失败\n- 分析废标原因和改进措施\n- 总结评标专家关注点\n\n### 3. 资质证书库\n- 统一管理企业及人员资质\n- 设置到期预警提醒\n- 跟踪资质维护和升级\n\n### 4. 供应商资源库\n- 建立合作伙伴评估体系\n- 记录合作历史和评价\n- 维护关键联系人信息\n\n### 5. 报价数据库\n- 积累历史报价数据\n- 分析成本构成和变化趋势\n- 建立报价模型和决策依据\n\n## 实施建议\n1. 选择合适的知识管理工具\n2. 明确知识收集的责任人\n3. 建立知识审核和更新机制\n4. 定期组织经验分享和培训',
    summary: '系统介绍如何建立企业投标知识管理体系，提升投标竞争力',
    tags: JSON.stringify(['知识管理', '投标经验', '企业竞争力', '数据积累']),
    coverImage: null,
    isPublished: true,
    views: 892,
  },
  {
    title: '投标报价策略与技巧全解析',
    slug: 'bidding-pricing-strategy-guide',
    category: '决策推演',
    content: '# 投标报价策略与技巧全解析\n\n## 报价前的准备工作\n\n### 成本分析\n- 直接成本：材料、人工、设备\n- 间接成本：管理费、财务费、税金\n- 风险成本：预留不可预见费\n\n### 竞争分析\n- 了解主要竞争对手的报价习惯\n- 分析招标人对价格的敏感度\n- 评估项目的利润空间\n\n## 常见报价策略\n\n### 1. 不平衡报价法\n在总价不变的前提下，调整各分项报价：\n- 预计工程量会增加的项目适当提高单价\n- 预计会减少的项目适当降低单价\n- 前期结算项目适当提高单价\n\n### 2. 突然降价法\n在投标截止前的最后时刻，对非关键项目进行降价，提高竞争力。\n\n### 3. 多方案报价法\n提供多个技术方案和对应报价，增加中标机会。\n\n## 注意事项\n1. 报价不能低于成本价\n2. 要考虑合同履约的可行性\n3. 注意不平衡报价的合理范围\n4. 预留一定的利润空间',
    summary: '详细解析投标报价的策略和技巧，帮助企业在保证利润的同时提高中标率',
    tags: JSON.stringify(['报价策略', '成本分析', '竞争分析', '不平衡报价']),
    coverImage: null,
    isPublished: true,
    views: 2150,
  },
  {
    title: '废标条款识别与防范指南',
    slug: 'bid-rejection-clause-identification',
    category: '废标案例',
    content: '# 废标条款识别与防范指南\n\n## 什么是废标条款\n废标条款是指招标文件中规定的，投标人一旦违反将导致投标无效的条款。这些条款通常涉及：\n\n### 资格性要求\n- 营业执照经营范围不符\n- 资质等级不满足要求\n- 项目负责人资格不符\n\n### 符合性要求\n- 投标文件未按要求密封\n- 投标保证金未按时缴纳\n- 投标有效期不足\n\n### 实质性要求\n- 技术参数偏离\n- 付款条件不响应\n- 交货期不满足\n\n## 识别废标条款的方法\n\n### 1. 逐条阅读法\n仔细阅读招标文件中\"废标条款\"或\"否决投标条款\"章节。\n\n### 2. 关键词搜索法\n搜索\"废标\"\"否决\"\"无效\"\"不予接受\"等关键词。\n\n### 3. 对照检查法\n将招标文件要求逐条列成检查清单，逐一核对。\n\n## 防范措施\n1. 建立标准化的投标文件检查流程\n2. 安排专人负责格式合规性审查\n3. 在投标截止前留出充足的检查时间\n4. 使用检查清单避免遗漏',
    summary: '系统介绍如何识别和防范废标条款，降低投标风险',
    tags: JSON.stringify(['废标条款', '投标风险', '检查清单', '合规审查']),
    coverImage: null,
    isPublished: true,
    views: 1876,
  },
  {
    title: 'AI技术在招投标领域的应用趋势',
    slug: 'ai-in-bidding-trends',
    category: '技术趋势',
    content: '# AI技术在招投标领域的应用趋势\n\n## 当前应用场景\n\n### 1. 智能文件分析\nAI可以快速阅读和分析大量招标文件，自动提取关键信息：\n- 资格要求\n- 技术参数\n- 报价限制\n- 时间节点\n\n### 2. 风险评估\n通过机器学习模型，分析历史数据，预测投标风险：\n- 废标风险评分\n- 竞争强度分析\n- 中标概率预测\n\n### 3. 报价辅助\n利用大数据和AI算法，辅助制定报价策略：\n- 历史报价分析\n- 市场价格趋势\n- 最优报价建议\n\n## 未来发展趋势\n\n### 1. 全流程智能化\n从招标信息获取到投标文件编制，实现全流程AI辅助。\n\n### 2. 精准风险预警\n基于更丰富的数据源和更先进的算法，提供更精准的风险预警。\n\n### 3. 行业知识图谱\n构建招投标领域的知识图谱，实现智能推荐和决策支持。\n\n## 企业应对策略\n1. 积极拥抱AI技术\n2. 建立数字化投标能力\n3. 培养复合型人才\n4. 积累高质量数据资产',
    summary: '分析AI技术在招投标领域的最新应用和未来发展趋势',
    tags: JSON.stringify(['AI技术', '智能分析', '风险评估', '数字化']),
    coverImage: null,
    isPublished: true,
    views: 3240,
  },
];

async function main() {
  console.log('开始种子数据...\n');

  // Seed Cases
  console.log('--- 案例中心 ---');
  for (const c of CASES) {
    const existing = await prisma.case.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.case.create({ data: c });
      console.log(`  + ${c.title}`);
    } else {
      console.log(`  = ${c.title} (已存在)`);
    }
  }

  // Seed ThinkTank Articles
  console.log('\n--- 招投标智库 ---');
  for (const a of THINKTANK_ARTICLES) {
    const existing = await prisma.thinkTankArticle.findFirst({ where: { slug: a.slug } });
    if (!existing) {
      await prisma.thinkTankArticle.create({ data: a });
      console.log(`  + ${a.title}`);
    } else {
      console.log(`  = ${a.title} (已存在)`);
    }
  }

  console.log('\n种子数据完成！');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
