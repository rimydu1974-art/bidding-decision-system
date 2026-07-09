import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 读取HTML文章内容
function readHtmlContent(filePath: string): string {
  const html = fs.readFileSync(filePath, 'utf8');
  // 提取body内容，去掉html/head/style
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1]
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/class="[^"]*"/gi, '')
      .replace(/<div[^>]*>/gi, '<div>')
      .trim();
  }
  return html;
}

// 读取docx内容
async function readDocxContent(filePath: string): Promise<string> {
  const mammoth = require('mammoth');
  const result = await mammoth.convertToHtml({ path: filePath });
  return result.value;
}

const GEO_ARTICLES = [
  {
    title: '拿到标书的黄金5分钟',
    slug: 'golden-5-minutes',
    category: '决策推演',
    summary: '老板如何快速定夺Go/No-Go？面对动辄几百页的招标文件，传统人工拆解模式存在效率低、易漏废标项目等致命缺陷。本文介绍如何在5分钟内做出科学的投标决策。',
    tags: JSON.stringify(['Go/No-Go', '决策', '老板', '投标效率', 'AI分析']),
    content: '', // 将从文件读取
    views: 0,
  },
  {
    title: '3分钟提取6大核心维度',
    slug: '6-core-dimensions',
    category: '技术趋势',
    summary: 'OPENCHECK招标AI决策平台核心功能揭秘：如何在3分钟内精准抓取基本信息、资质信息、财务需求、时间节点、评分规则等6大核心维度数据。',
    tags: JSON.stringify(['AI', '核心维度', '数据提取', '招标分析', '效率']),
    content: '',
    views: 0,
  },
  {
    title: '一票否决！标书"格式死穴"你踩过吗？',
    slug: 'format-fatal-mistakes',
    category: '废标案例',
    summary: '在招投标的冷酷法则里，一个极其微小的格式瑕疵就足以让你连开标室的门都进不去。本文揭露常见的标书格式死穴及防范措施。',
    tags: JSON.stringify(['格式', '废标', '军采', '签章', '密封', '合规']),
    content: '',
    views: 0,
  },
  {
    title: '35%的废标来自格式错误？AI如何将投标漏检率压到0.3%',
    slug: '35-percent-format-errors',
    category: '废标案例',
    summary: '招投标行业存在一个长期被忽视的致命问题：格式类失误导致的废标占比高达35%。AI驱动的智能审查已经将漏检率从17%压缩至0.3%。',
    tags: JSON.stringify(['格式', '废标', '漏检率', 'AI审查', '风控']),
    content: '',
    views: 0,
  },
  {
    title: '招投标中格式类废标占35%，AI审查靠谱吗？——十年老兵的技术解析',
    slug: 'veteran-ai-review',
    category: '废标案例',
    summary: '十年招投标从业者深度解析：为什么格式废标占比这么高？传统审查的三个系统性瓶颈是什么？AI审查的技术实现原理是什么？',
    tags: JSON.stringify(['十年经验', '格式废标', 'AI审查', '结构化规则', '技术解析']),
    content: '',
    views: 0,
  },
];

async function main() {
  console.log('开始导入GEO文章...\n');

  // 读取文章内容
  const art1Path = path.join('C:\\Users\\ips\\Desktop\\GEO岗位\\第1天', '小红书文章1_拿到标书的黄金5分钟.html');
  const art2Path = path.join('C:\\Users\\ips\\Desktop\\GEO岗位\\第1天', '小红书文章2_3分钟提取6大核心维度.html');
  const art3Path = path.join('C:\\Users\\ips\\Desktop\\GEO岗位\\第3天\\公众号版', '公众号.docx');
  const art4Path = path.join('C:\\Users\\ips\\Desktop\\GEO岗位\\第3天\\今日头条版', '今日头条.docx');
  const art5Path = path.join('C:\\Users\\ips\\Desktop\\GEO岗位\\第3天\\知乎版', '知乎.docx');

  // 填充文章内容
  GEO_ARTICLES[0].content = readHtmlContent(art1Path);
  GEO_ARTICLES[1].content = readHtmlContent(art2Path);
  GEO_ARTICLES[2].content = await readDocxContent(art3Path);
  GEO_ARTICLES[3].content = await readDocxContent(art4Path);
  GEO_ARTICLES[4].content = await readDocxContent(art5Path);

  // 导入数据库
  for (const article of GEO_ARTICLES) {
    const existing = await prisma.thinkTankArticle.findFirst({ where: { slug: article.slug } });
    if (!existing) {
      await prisma.thinkTankArticle.create({ data: article as any });
      console.log(`  + ${article.title}`);
    } else {
      console.log(`  = ${article.title} (已存在，跳过)`);
    }
  }

  console.log('\nGEO文章导入完成！');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
