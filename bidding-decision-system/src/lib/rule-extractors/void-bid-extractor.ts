// 废标/无效报价规则提取器
// 确定性提取，零幻觉

export interface VoidBidCondition {
  condition: string;
  category: 'qualification' | 'compliance' | 'technical' | 'commercial' | 'format' | 'other';
  consequence: string;
  sourceLocation: string;
  isExplicit: boolean;
}

// 显性废标关键词
const EXPLICIT_VOID_KEYWORDS = [
  '废标', '否决投标', '无效报价', '不予受理', '拒绝投标',
  '一票否决', '废标条款', '否决条款', '无效投标',
  '按废标处理', '视为无效', '不予通过', '取消投标资格',
  '按无效报价处理', '其投标无效', '投标无效',
];

// 隐性废标关键词（容易忽略）
const HIDDEN_VOID_KEYWORDS = [
  '点对点应答', '明确答复', '放弃应答', '后果由投标人承担',
  '未实质性响应', '非实质性偏离', '不满足即无效',
  '一项不满足', '一项未响应', '未响应则',
  '未提供.*视为无效', '未按要求.*视为无效',
  '模糊.*视为无效', '不能提供.*无效',
];

// 资格性审查关键词
const QUALIFICATION_KEYWORDS = [
  '资格性审查', '资格审查', '资格条件', '投标人资格',
  '供应商资格', '资质要求', '资格要求',
];

// 符合性审查关键词
const COMPLIANCE_KEYWORDS = [
  '符合性审查', '符合性检查', '形式审查',
  '投标文件形式', '响应性审查',
];

// 格式要求关键词
const FORMAT_KEYWORDS = [
  '签字盖章', '密封要求', '包装要求', '格式要求',
  '正本副本', '份数要求', '装订要求', '胶装',
];

function extractParagraphAround(text: string, keyword: string, range: number = 200): string {
  const idx = text.indexOf(keyword);
  if (idx === -1) return '';

  let start = Math.max(0, idx - range);
  let end = Math.min(text.length, idx + keyword.length + range);

  while (start > 0 && text[start] !== '\n' && text[start] !== '。' && text[start] !== '；') {
    start--;
  }
  while (end < text.length && text[end] !== '\n' && text[end] !== '。' && text[end] !== '；') {
    end++;
  }

  return text.substring(start, end).trim();
}

function categorizeCondition(text: string): VoidBidCondition['category'] {
  if (QUALIFICATION_KEYWORDS.some(k => text.includes(k))) return 'qualification';
  if (COMPLIANCE_KEYWORDS.some(k => text.includes(k))) return 'compliance';
  if (text.includes('技术') || text.includes('参数') || text.includes('指标')) return 'technical';
  if (text.includes('商务') || text.includes('合同') || text.includes('报价')) return 'commercial';
  if (FORMAT_KEYWORDS.some(k => text.includes(k))) return 'format';
  return 'other';
}

export function extractVoidBidConditions(text: string): VoidBidCondition[] {
  const conditions: VoidBidCondition[] = [];
  const seen = new Set<string>();

  const allKeywords = [...EXPLICIT_VOID_KEYWORDS, ...HIDDEN_VOID_KEYWORDS];

  for (const keyword of allKeywords) {
    const regex = new RegExp(keyword, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const paragraph = extractParagraphAround(text, keyword, 300);
      if (!paragraph || paragraph.length < 10) continue;

      const normalized = paragraph.replace(/\s+/g, '');
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      const isExplicit = EXPLICIT_VOID_KEYWORDS.includes(keyword);
      const category = categorizeCondition(paragraph);

      let consequence = '';
      if (paragraph.includes('废标') || paragraph.includes('无效')) {
        consequence = '废标/无效报价';
      } else if (paragraph.includes('扣分')) {
        consequence = '扣分';
      } else if (paragraph.includes('否决')) {
        consequence = '否决投标';
      } else {
        consequence = '需确认后果';
      }

      const pageMatch = text.substring(Math.max(0, match.index - 100), match.index).match(/---\s*PDF第(\d+)页\s*---/);
      const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

      conditions.push({
        condition: paragraph,
        category,
        consequence,
        sourceLocation,
        isExplicit,
      });
    }
  }

  return conditions;
}

export function extractVoidBidSummary(text: string): {
  explicitConditions: VoidBidCondition[];
  hiddenConditions: VoidBidCondition[];
  qualificationItems: string[];
  complianceItems: string[];
} {
  const allConditions = extractVoidBidConditions(text);

  const explicitConditions = allConditions.filter(c => c.isExplicit);
  const hiddenConditions = allConditions.filter(c => !c.isExplicit);

  const qualificationItems: string[] = [];
  const complianceItems: string[] = [];

  const qualRegex = /资格性审查[^。]*?[\n\n]/g;
  let qualMatch;
  while ((qualMatch = qualRegex.exec(text)) !== null) {
    const items = qualMatch[0].match(/[①②③④⑤⑥⑦⑧⑨⑩]\s*[^①②③④⑤⑥⑦⑧⑨⑩\n]+/g);
    if (items) {
      qualificationItems.push(...items.map(i => i.trim()));
    }
  }

  const compRegex = /符合性审查[^。]*?[\n\n]/g;
  let compMatch;
  while ((compMatch = compRegex.exec(text)) !== null) {
    const items = compMatch[0].match(/[①②③④⑤⑥⑦⑧⑨⑩]\s*[^①②③④⑤⑥⑦⑧⑨⑩\n]+/g);
    if (items) {
      complianceItems.push(...items.map(i => i.trim()));
    }
  }

  return {
    explicitConditions,
    hiddenConditions,
    qualificationItems,
    complianceItems,
  };
}
