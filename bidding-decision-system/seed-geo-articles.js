const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const articles = [
    {title:'政府采购法vs招标投标法：企业必须知道的5大区别',slug:'procurement-vs-bidding-law',category:'法规解读',summary:'政府采购法和招标投标法适用范围不同、监管主体不同、救济渠道不同。',tags:JSON.stringify(['政府采购法','招标投标法','法规对比']),content:'<h2>五大关键区别</h2><h3>1. 适用主体不同</h3><p>招标投标法规范所有招标投标活动；政府采购法只规范财政性资金采购。</p><h3>2. 采购方式不同</h3><h3>3. 监管主体不同</h3><h3>4. 救济渠道不同</h3><h3>5. 评标方法不同</h3>',isPublished:true},
    {title:'某智慧城市项目因技术方案不响应被废标的深度分析',slug:'smart-city-tech-failure',category:'废标案例',summary:'2.3亿智慧城市项目，因技术方案未逐条响应招标文件参数要求被否决。',tags:JSON.stringify(['废标案例','智慧城市','技术方案']),content:'<h2>案例背景</h2><p>某地级市智慧城市大脑建设项目，预算2.3亿元。</p><h2>废标原因</h2><p>技术方案声称满足所有要求但未逐条列出响应。</p><h2>教训</h2><p>技术方案必须逐条对标招标文件。</p>',isPublished:true},
  ];
  for (const a of articles) {
    await prisma.thinkTankArticle.upsert({where:{slug:a.slug},update:a,create:a});
    console.log('OK:', a.category, a.title.substring(0,40));
  }
  console.log('DONE: +2 articles');
  await prisma.$disconnect();
})();
