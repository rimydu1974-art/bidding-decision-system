// 正则清洗策略 - 降本防幻觉
// 过滤非必要内容，减少token消耗，降低AI幻觉风险

// 需要保留的章节关键词
const KEEP_SECTIONS = [
  // 原有关键词
  '招标公告',
  '投标人须知',
  '资格要求',
  '评标办法',
  '评分标准',
  '评分细则',
  '技术参数',
  '资格性审查',
  '符合性审查',
  '商务需求',
  '技术需求',
  '实质性要求',
  '废标',
  '无效报价',
  '否决投标',
  '投标有效期',
  '保证金',
  '投标文件组成',
  '投标文件编制',
  '开标时间',
  '投标截止',
  // 新增关键词
  '付款方式',
  '支付条款',
  '履约保证金',
  '投标保证金',
  '质量保证金',
  '项目概况',
  '项目需求',
  '工期要求',
  '交付时间',
  '质量要求',
  '技术标准',
  '售后服务',
  '质保期',
  '业绩要求',
  '类似项目经验',
  '人员要求',
  '项目经理',
  '投标报价',
  '报价方式',
];

// 需要过滤的内容模式（按优先级排列）
const FILTER_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  // 图纸目录（视觉内容无法分析）
  { pattern: /图纸目录[\s\S]*?(?=技术参数|技术需求|$)/g, replacement: '[图纸目录已过滤]', reason: '图纸目录' },
  
  // 过多的空白行
  { pattern: /\n{3,}/g, replacement: '\n\n', reason: '多余空行' },
  
  // 重复的标点符号（保留第一个）
  { pattern: /。，、；：。，、；：/g, replacement: '。', reason: '重复标点' },
  { pattern: /。。+/g, replacement: '。', reason: '重复句号' },
  { pattern: /，，+/g, replacement: '，', reason: '重复逗号' },
  
  // 页眉页脚 — 仅匹配明确的页码格式
  { pattern: /第\s*\d+\s*页\s*[共共]\s*\d+\s*页/g, replacement: '', reason: '页码' },
  { pattern: /^投标文件\s{0,5}$/gm, replacement: '', reason: '页眉-投标文件标题' },
];

// 清洗文档内容
export function cleanDocumentForAI(text: string): {
  cleaned: string;
  filteredCount: number;
  filteredReasons: string[];
  originalLength: number;
  cleanedLength: number;
} {
  let cleaned = text;
  let filteredCount = 0;
  const filteredReasons: string[] = [];
  const originalLength = text.length;

  // 应用过滤模式
  for (const { pattern, replacement, reason } of FILTER_PATTERNS) {
    const before = cleaned.length;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned.length < before) {
      filteredCount++;
      filteredReasons.push(reason);
    }
  }

  // 关键章节提取：仅在文档超大（>100K字符）时启用降本策略
  // 且提取的章节必须覆盖≥50%原文，否则保留全文以避免丢失关键信息
  if (originalLength > 100000) {
    const sections = extractKeySections(cleaned);
    const sectionLen = sections.reduce((sum, s) => sum + s.length, 0);
    if (sections.length > 0 && sectionLen > cleaned.length * 0.5) {
      cleaned = sections.join('\n\n');
      filteredCount++;
      filteredReasons.push('大文档章节提取降本');
    }
  }

  // 压缩空白
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    cleaned,
    filteredCount,
    filteredReasons,
    originalLength,
    cleanedLength: cleaned.length,
  };
}

// 提取关键章节
function extractKeySections(text: string): string[] {
  const lines = text.split('\n');
  const sections: string[] = [];
  let currentSection: string[] = [];
  let inKeepSection = false;
  let preamble: string[] = [];
  let preambleSaved = false;
  
  for (const line of lines) {
    const isKeepSection = KEEP_SECTIONS.some(kw => line.includes(kw));
    
    if (isKeepSection) {
      // 保存前言（第一个关键词之前的内容，最多50行）
      if (!preambleSaved && preamble.length > 0) {
        sections.push(preamble.slice(0, 50).join('\n'));
        preambleSaved = true;
      }
      // 保存之前的章节
      if (currentSection.length > 0 && inKeepSection) {
        sections.push(currentSection.join('\n'));
      }
      currentSection = [line];
      inKeepSection = true;
    } else if (inKeepSection) {
      currentSection.push(line);
    } else {
      // 收集前言（第一个关键词之前）
      preamble.push(line);
    }
  }
  
  // 保存最后一个章节
  if (currentSection.length > 0 && inKeepSection) {
    sections.push(currentSection.join('\n'));
  }
  
  return sections;
}

// 计算清洗率
export function getCleaningStats(original: string, cleaned: string): {
  reductionPercent: number;
  tokensSaved: number;
} {
  const reduction = original.length - cleaned.length;
  const reductionPercent = (reduction / original.length) * 100;
  // 粗略估计：1个token约4个字符
  const tokensSaved = Math.floor(reduction / 4);
  
  return { reductionPercent, tokensSaved };
}
