import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const armyProcurementRules = [
  // 开标前自查事项
  {
    category: '投标流程',
    title: '军队采购-开标前自查事项',
    content: '1.授权代表应携带身份证原件、法定代表人授权书、投标前4个月内（不含投标当月）连续3个月社保证明复印件，代缴社保证明不予认可；2.需在军队采购网登记备案，携带纸质版入库截图（加盖公章）；3.携带2份保证金转账凭证，使用采购文件模板；4.携带纸质版报名材料；5.须由被授权的授权代表本人递交标书',
    industry: '军队采购',
  },

  // 资格性审查
  {
    category: '资格要求',
    title: '军队采购-资格性审查要点',
    content: '1.营业执照或事业单位证书：多名称需提供市场监管部门证明；2.法定代表人资格证明书：身份证信息清晰，使用采购文件模板；3.法定代表人授权书：社保月份为投标月-4个月（不含当月）；4.供应商成立时间不少于3年；5.供应商承诺声明：内容完整，签字盖章齐全；6.纳税证明（近1年任意X月）：需显示税种和所属时期，个人所得税等科目无效；7.社保缴纳证明（近1年任意X月）：银行转账凭证或社保/税务部门凭证；8.审计报告（近3年）：含正文、四表、附注、营业执照，审计报告不要缺页要完整，6月1日前后年份计算不同；9.投标保证金：账户170202172920999990，需显示完整户名和户号；10.密封要求：价格文件单独密封；11.其他资质：证书有效期符合要求',
    industry: '军队采购',
  },

  // 符合性审查
  {
    category: '资格要求',
    title: '军队采购-符合性审查要点',
    content: '1.投标文件签字盖章齐全完整：法定代表人签字或盖章，加盖骑缝章；2.投标有效期满足要求：投标函响应准确；3.★号商务条款：逐条具体响应，不可仅写响应，硬件需提供支持材料；4.★号技术条款：不可完全复制技术要求，否则无效；5.其他实质性内容：使用采购文件模板，响应完整不可缺项',
    industry: '军队采购',
  },

  // 关键风险提示
  {
    category: '投标流程',
    title: '军队采购-社保月份计算规则',
    content: '社保月份为投标前4个月内（不含投标当月）连续3个月。例如投标日期为9月1日，投标前4个月为5-8月，可提供5-7月或6-8月社保材料',
    industry: '军队采购',
  },
  {
    category: '投标流程',
    title: '军队采购-审计报告年份计算规则',
    content: '报价截止时间在6月1日（不含）前，近一年审计报告指上年度之前的一年（不含上年度）；报价截止时间在6月1日后，近一年审计报告指本年度之前的一年（含上年度）。审计报告必须完整，不可缺页',
    industry: '军队采购',
  },
  {
    category: '投标流程',
    title: '军队采购-技术响应禁止事项',
    content: '技术响应不可完全复制技术要求原文，否则将作无效处理。需逐条具体填写完整响应内容',
    industry: '军队采购',
  },
  {
    category: '资格要求',
    title: '军队采购-审计报告完整性要求',
    content: '审计报告必须包含报告正文、资产负债表、利润表、现金流量表及所有者权益变动表（无所有者权益表的必须提供书面说明）、附注和会计师事务所营业执照。审计报告不可缺页，缺页将被判定无效报价',
    industry: '军队采购',
  },
  {
    category: '资格要求',
    title: '军队采购-投标保证金账户信息',
    content: '投标保证金账户名称：中国人民解放军网络空间部队信息工程大学收缴户，账号：1702 0217 2920 0999 990。提供凭证需显示完整的收款账户名称和户号，建议核查银行流水，不可仅以银行回单为准',
    industry: '军队采购',
  },
];

async function main() {
  console.log('Clearing old army procurement rules...');
  await prisma.industryRule.deleteMany({
    where: {
      industry: '军队采购',
    },
  });
  
  console.log('Seeding army procurement industry rules...');
  
  for (const rule of armyProcurementRules) {
    await prisma.industryRule.create({
      data: {
        category: rule.category,
        title: rule.title,
        content: rule.content,
        industry: rule.industry,
        isActive: true,
      },
    });
    console.log(`  Created: ${rule.category}/${rule.title}`);
  }

  console.log(`\nDone! Created ${armyProcurementRules.length} army procurement rules.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
