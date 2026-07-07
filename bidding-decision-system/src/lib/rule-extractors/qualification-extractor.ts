// 资质证书规则提取器

export interface QualificationItem {
  name: string;
  type: 'certificate' | 'review' | 'requirement';
  isRequired: boolean;
  sourceLocation: string;
  rawText: string;
}

const KNOWN_CERTIFICATES = [
  'ISO9001', 'ISO9000', 'ISO14001', 'ISO27001', 'ISO20000',
  'CMMI', 'CMMI3', 'CMMI5',
  '高新技术企业', '高新技术', '双软企业',
  '保密资质', '保密资格', '涉密资质',
  '系统集成', '信息系统集成',
  '测绘资质', '测绘资格',
  '安全生产许可证', '安全生产',
  '质量管理体系', '环境管理体系', '职业健康安全',
  '信息安全等级保护', '等保',
  'ITSS', '信息技术服务标准',
  'CCRC', '信息安全服务资质',
  'DCMM', '数据管理能力成熟度',
  'CS', '信息系统建设和服务能力',
];

const REVIEW_KEYWORDS = [
  '资格性审查', '资格审查', '资格性检查',
  '符合性审查', '符合性检查', '形式审查',
  '响应性审查', '合规性审查',
  '社会保障', '社保证明', '社保缴纳',
];

const PERSONNEL_CERTS = [
  '项目经理', '项目负责人', '技术负责人',
  '高级工程师', '中级工程师', '注册建造师',
  '注册造价师', '注册监理师',
  'OCP', 'DBA', 'PMP', 'ITIL',
  '信息安全工程师', '网络工程师',
  '职称证书', '资格证书', '执业资格',
];

function extractParagraphAround(text: string, keyword: string, range: number = 150): string {
  const idx = text.indexOf(keyword);
  if (idx === -1) return '';
  let start = Math.max(0, idx - range);
  let end = Math.min(text.length, idx + keyword.length + range);
  while (start > 0 && text[start] !== '\n' && text[start] !== '。') start--;
  while (end < text.length && text[end] !== '\n' && text[end] !== '。') end++;
  return text.substring(start, end).trim();
}

export function extractQualifications(text: string): QualificationItem[] {
  const items: QualificationItem[] = [];
  const seen = new Set<string>();

  for (const cert of KNOWN_CERTIFICATES) {
    if (!text.includes(cert)) continue;
    if (seen.has(cert)) continue;
    seen.add(cert);

    const paragraph = extractParagraphAround(text, cert, 200);
    const isRequired = paragraph.includes('必须') || paragraph.includes('须提供') ||
      paragraph.includes(' required ') || paragraph.includes('应当');

    const pageMatch = text.substring(Math.max(0, text.indexOf(cert) - 100), text.indexOf(cert)).match(/---\s*PDF第(\d+)页\s*---/);
    const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

    items.push({
      name: cert,
      type: 'certificate',
      isRequired,
      sourceLocation,
      rawText: paragraph,
    });
  }

  for (const keyword of REVIEW_KEYWORDS) {
    if (!text.includes(keyword)) continue;
    const paragraph = extractParagraphAround(text, keyword, 300);
    if (paragraph.length < 10) continue;

    const pageMatch = text.substring(Math.max(0, text.indexOf(keyword) - 100), text.indexOf(keyword)).match(/---\s*PDF第(\d+)页\s*---/);
    const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

    items.push({
      name: keyword,
      type: 'review',
      isRequired: true,
      sourceLocation,
      rawText: paragraph,
    });
  }

  for (const cert of PERSONNEL_CERTS) {
    if (!text.includes(cert)) continue;
    if (seen.has(cert)) continue;
    seen.add(cert);

    const paragraph = extractParagraphAround(text, cert, 200);
    const isRequired = paragraph.includes('必须') || paragraph.includes('须提供') || paragraph.includes(' required ');

    const pageMatch = text.substring(Math.max(0, text.indexOf(cert) - 100), text.indexOf(cert)).match(/---\s*PDF第(\d+)页\s*---/);
    const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

    items.push({
      name: cert,
      type: 'requirement',
      isRequired,
      sourceLocation,
      rawText: paragraph,
    });
  }

  return items;
}
