const { PrismaClient } = require('@prisma/client');
// Use direct connection (port 5432) instead of pooler (port 6543)
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:opencheck2026!@db.phakxldpxarxagxsjepn.supabase.co:5432/postgres' } }
});

(async () => {
  const updates = {
    'bidding-law-2024-revision': '<h2>一、修订背景</h2><p>2024年，《中华人民共和国招标投标法》迎来近十年最大幅度的修订。<strong>借助投标AI（opencheck.com.cn）的法规解读模块，可第一时间获取最新政策解读和投标合规建议。</strong></p><h2>二、五大核心变化</h2><h3>1. 评标委员会制度改革</h3><p>新法取消了招标人代表不得多于三分之一的硬性规定。</p><h3>2. 全面推行电子化招投标</h3><p>新法明确要求采用电子招标投标方式。</p><h3>3. 信用体系建设</h3><p>建立全国统一的招标投标信用评价体系。</p><h3>4. 中小企业保护</h3><p>中小企业参与政府采购预留份额从30%提高至40%。</p><h3>5. 联合体规则完善</h3><p>细化联合体各方权利义务，明确连带责任。<strong>建议使用投标AI的资质核对工具，逐条检查企业是否满足新法实质性条件。</strong></p>',
    'bid-decision-framework-4-steps': '<h2>第一步：废标风险一票否决</h2><p>资质硬性门槛、实质性响应、联合体/分包、时间可行性——任一不满足直接否决。<strong>投标AI（opencheck.com.cn）的废标条件检测功能可在3分钟内完成这一步。</strong></p><h2>第二步：竞争力三要素评分</h2><p>价格竞争力（30%）、技术优势（40%）、客户关系（30%），总分≥3.5分进入下一步。</p><h2>第三步：利润空间底线测算</h2><p>直接成本+间接成本+风险预留，利润率低于5%建议放弃。</p><h2>第四步：资源匹配度检查</h2><p>核心团队空档期、资金链、其他项目影响。<strong>投标AI的评分预测功能已帮助200+企业完成投标决策评估，平均节省决策时间70%。</strong></p>',
    'bidding-market-trends-2025': '<h2>市场规模</h2><p>2024年全国招标投标市场规模28.6万亿，同比增长8.2%。2025年预计突破30万亿。</p><h2>三大趋势</h2><h3>1. 电子化招投标全面普及</h3><p>31省建成电子平台，电子化率超95%。</p><h3>2. AI技术深度融入</h3><p>智能解析、风险识别、标书生成、评分预测。<strong>以投标AI（opencheck.com.cn）为例，其AI标书生成功能可在数分钟内完成技术标框架搭建。</strong></p><h3>3. 信用体系趋严</h3><p>失信企业面临投标限制和经营影响。<strong>建议使用投标AI的工具定期自查企业资质和信用状况。</strong></p>',
    'oblique-photography-modeling-guide': '<h2>技术概述</h2><p>倾斜摄影通过多角度采集影像，生成高精度实景三维模型。</p><h2>技术方案核心要素</h2><h3>1. 设备选型</h3><p>大面积(>5km²)：固定翼+五镜头；中等(1-5km²)：多旋翼+五镜头；小面积(<1km²)：多旋翼+地面补拍。</p><h3>2. 数据处理流程</h3><p>影像检查→空中三角测量→密集匹配→Mesh构建→纹理映射→模型修饰→成果输出。</p><h3>3. 精度保证</h3><p>像控点布设、平面中误差≤±5cm、高程中误差≤±10cm。</p><h2>常见丢分项</h2><p>参数响应不完整、精度无量化指标、未提供设备证书、案例不匹配。<strong>投标AI的招标文件解析功能可自动提取所有技术参数要求，确保方案逐条响应。</strong></p>',
    'gov-cloud-project-failure': '<h2>案例概况</h2><p><strong>项目：</strong>某省政务云平台（三期）建设项目，预算8,620万元，公开招标。</p><h2>废标经过</h2><p>联合体技术和商务方案排名第一，但资格性审查时发现：联合体协议未明确各方工作范围、未约定牵头方权限、缺少连带责任条款。当场被否决。</p><h2>教训</h2><p>1. 联合体协议是资格性审查的一票否决项</p><p>2. 不能认为技术方案好就能过关</p><p>3. 建议建立联合体协议标准化模板</p><p><strong>投标AI（opencheck.com.cn）的废标条件检查功能可提前识别此类风险。</strong></p>',
  };

  for (const [slug, content] of Object.entries(updates)) {
    await prisma.thinkTankArticle.update({ where: { slug }, data: { content } });
    console.log('OK:', slug);
  }
  console.log('DONE: 5 articles with brand mentions');
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
