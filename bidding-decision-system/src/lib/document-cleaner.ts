// 正则清洗策略 - 降本防幻觉
// 过滤非必要内容，减少token消耗，降低AI幻觉风险

// 需要保留的章节关键词
const KEEP_SECTIONS = [
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
  '废标条款',
  '否决投标',
  '投标有效期',
  '保证金',
  '投标文件组成',
  '投标文件编制',
  '开标时间',
  '投标截止',
];

// 需要过滤的内容模式（按优先级排列）
const FILTER_PATTERNS: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
  // 工程量清单（通常很长且对决策无用）
  { pattern: /工程量清单[\s\S]*?(?=投标人须知|评标办法|$)/g, replacement: '[工程量清单已过滤]', reason: '工程量清单' },
  
  // 合同通用条款（模板化内容）
  { pattern: /合同通用条款[\s\S]*?(?=技术需求|商务需求|$)/g, replacement: '[合同通用条款已过滤]', reason: '合同通用条款' },
  
  // 图纸目录（视觉内容无法分析）
  { pattern: /图纸目录[\s\S]*?(?=技术参数|技术需求|$)/g, replacement: '[图纸目录已过滤]', reason: '图纸目录' },
  
  // 附件列表（通常为表格模板）
  { pattern: /附件\d+[\s\S]*?(?=投标人须知|评标办法|$)/g, replacement: '[附件已过滤]', reason: '附件' },
  
  // 工程概况（背景信息，非决策关键）
  { pattern: /工程概况[\s\S]*?(?=招标公告|投标人须知|$)/g, replacement: '[工程概况已过滤]', reason: '工程概况' },
  
  // 投标人须知前附表（重复信息）
  { pattern: /投标人须知前附表[\s\S]*?(?=投标人须知[^前]|评标办法|$)/g, replacement: '[前附表已过滤]', reason: '前附表' },
  
  // 法律法规引用（模板化）
  { pattern: /根据《[^》]+》[\s\S]{0,200}?(?=\n|$)/g, replacement: '[法规引用已过滤]', reason: '法规引用' },
  
  // 过多的空白行
  { pattern: /\n{3,}/g, replacement: '\n\n', reason: '多余空行' },
  
  // 重复的标点符号（保留第一个）
  { pattern: /。，、；：。，、；：/g, replacement: '。', reason: '重复标点' },
  { pattern: /。。+/g, replacement: '。', reason: '重复句号' },
  { pattern: /，，+/g, replacement: '，', reason: '重复逗号' },
  
  // 页眉页脚
  { pattern: /第\s*\d+\s*页\s*[共共]\s*\d+\s*页/g, replacement: '', reason: '页码' },
  { pattern: /投标文件\s*[\s\S]{0,30}?(\d+)/g, replacement: '', reason: '页眉' },
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
  
  // 提取关键章节（可选）
  const sections = extractKeySections(cleaned);
  if (sections.length > 0) {
    cleaned = sections.join('\n\n');
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
  
  for (const line of lines) {
    const isKeepSection = KEEP_SECTIONS.some(kw => line.includes(kw));
    
    if (isKeepSection) {
      // 保存之前的章节
      if (currentSection.length > 0 && inKeepSection) {
        sections.push(currentSection.join('\n'));
      }
      currentSection = [line];
      inKeepSection = true;
    } else if (inKeepSection) {
      currentSection.push(line);
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
