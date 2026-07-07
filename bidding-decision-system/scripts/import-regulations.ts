import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 解析文件内容（使用现有的解析器逻辑）
async function parseFileBuffer(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseLib = require('pdf-parse');
    const pdfParse = pdfParseLib.default || pdfParseLib;
    const data = await pdfParse(Buffer.from(buffer));
    return data.text || '';
  } else if (ext === '.docx' || ext === '.doc') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return result.value || '';
  } else if (ext === '.html' || ext === '.htm') {
    // 改进的HTML文本提取
    const html = buffer.toString('utf-8');
    // 移除script和style标签及其内容
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // 处理常见HTML实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 移除所有HTML标签，保留文本
      .replace(/<[^>]+>/g, '\n')
      // 清理空白
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    return text;
  }

  return '';
}

// 从文件名提取地区信息
function extractRegion(fileName: string): string {
  // 国家级法规
  if (fileName.includes('中华人民共和国') || fileName.includes('财政部')) {
    return '国家';
  }

  // 省级法规
  const provinces = [
    '广东', '浙江', '江苏', '四川', '山东', '河南', '河北', '湖南', '湖北',
    '福建', '安徽', '江西', '山西', '陕西', '甘肃', '青海', '海南', '贵州',
    '云南', '广西', '西藏', '宁夏', '新疆', '内蒙古', '辽宁', '吉林', '黑龙江',
  ];
  for (const province of provinces) {
    if (fileName.includes(province)) {
      return province;
    }
  }

  // 市级法规
  const cities = [
    '北京', '上海', '深圳', '厦门', '杭州', '南京', '成都', '重庆', '天津',
    '武汉', '长沙', '郑州', '西安', '苏州', '青岛', '大连', '宁波', '厦门',
    '呼和浩特', '拉萨', '乌鲁木齐',
  ];
  for (const city of cities) {
    if (fileName.includes(city)) {
      return city;
    }
  }

  return '其他';
}

// 从文件名提取分类
function extractCategory(fileName: string): string {
  if (fileName.includes('招标投标法') && !fileName.includes('实施')) {
    return '招标投标法';
  }
  if (fileName.includes('政府采购法') && !fileName.includes('实施')) {
    return '政府采购法';
  }
  if (fileName.includes('实施条例') || fileName.includes('实施办法')) {
    return '实施条例';
  }
  if (fileName.includes('管理办法') || fileName.includes('管理暂行办法')) {
    return '管理办法';
  }
  if (fileName.includes('条例')) {
    return '条例';
  }
  if (fileName.includes('办法')) {
    return '办法';
  }
  if (fileName.includes('令')) {
    return '部门规章';
  }
  return '其他';
}

// 从文件名提取发布日期
function extractPublishDate(fileName: string): string | null {
  // 匹配 YYYYMMDD 格式
  const match = fileName.match(/(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  // 匹配 YYYY-MM-DD 格式
  const match2 = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match2) {
    return `${match2[1]}-${match2[2]}-${match2[3]}`;
  }
  return null;
}

async function importRegulations() {
  const lawsDir = path.join(
    'C:',
    'Users',
    'ips',
    'Desktop',
    '测试AI员工能力',
    '建立一个网站',
    '文档资料',
    'laws'
  );

  if (!fs.existsSync(lawsDir)) {
    console.error('laws目录不存在:', lawsDir);
    return;
  }

  const files = fs.readdirSync(lawsDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.docx' || ext === '.doc' || ext === '.pdf' || ext === '.html' || ext === '.htm';
  });

  console.log(`找到 ${files.length} 个法规文件`);

  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(lawsDir, file);

    // 检查是否已导入
    const existing = await prisma.regulation.findFirst({
      where: { sourceFile: file },
    });

    if (existing) {
      console.log(`跳过（已导入）: ${file}`);
      skipped++;
      continue;
    }

    try {
      console.log(`解析中: ${file}`);
      const content = await parseFileBuffer(filePath);

      if (!content || content.trim().length < 10) {
        console.warn(`内容过短，跳过: ${file}`);
        skipped++;
        continue;
      }

      const region = extractRegion(file);
      const category = extractCategory(file);
      const publishDate = extractPublishDate(file);
      const title = file.replace(/\.[^/.]+$/, ''); // 去掉扩展名

      await prisma.regulation.create({
        data: {
          title,
          region,
          category,
          content: content.trim(),
          sourceFile: file,
          publishDate,
          isActive: true,
        },
      });

      console.log(`导入成功: ${title} [${region}/${category}]`);
      imported++;
    } catch (error) {
      console.error(`导入失败: ${file}`, error);
      skipped++;
    }
  }

  console.log(`\n导入完成: 成功 ${imported} 个, 跳过 ${skipped} 个`);
}

// 执行导入
importRegulations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
