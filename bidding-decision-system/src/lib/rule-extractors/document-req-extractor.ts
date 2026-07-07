// 密封/签字/盖章/包装/标签规则提取器

export interface DocumentRequirements {
  sealing: string;
  signature: string;
  stamping: string;
  packaging: string;
  labeling: string;
  rawSections: string[];
}

const SEALING_KEYWORDS = ['密封', '封口', '密封包装', '密封提交', '密封要求', '加封'];
const SIGNATURE_KEYWORDS = [
  '签字', '签名', '手写签名', '法定代表人签字', '法人签字',
  '授权代表签字', '签名章', '方章', '签字或盖章',
];
const STAMPING_KEYWORDS = [
  '盖章', '骑缝章', '公章', '法人章', '合同章',
  '每页盖章', '封口盖章', '加盖公章', '盖骑缝章',
];
const PACKAGING_KEYWORDS = [
  '包装', '胶装', '装订', '正本', '副本',
  '电子版', '光盘', '刻录', 'U盘',
];
const LABELING_KEYWORDS = [
  '标签', '封套标注', '注明', '标记', '封套上',
  '标签内容', '标注内容', '封皮', '封面',
];

function extractSection(text: string, keywords: string[], range: number = 300): string {
  const sections: string[] = [];

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      let start = Math.max(0, match.index - 100);
      let end = Math.min(text.length, match.index + keyword.length + range);

      while (start > 0 && text[start] !== '\n' && text[start] !== '。' && text[start] !== '；') start--;
      while (end < text.length && text[end] !== '\n' && text[end] !== '。' && text[end] !== '；') end++;

      const section = text.substring(start, end).trim();
      if (section.length > 10 && !sections.includes(section)) {
        sections.push(section);
      }
    }
  }

  return sections.join('\n\n');
}

export function extractDocumentRequirements(text: string): DocumentRequirements {
  const sealing = extractSection(text, SEALING_KEYWORDS, 250);
  const signature = extractSection(text, SIGNATURE_KEYWORDS, 250);
  const stamping = extractSection(text, STAMPING_KEYWORDS, 250);
  const packaging = extractSection(text, PACKAGING_KEYWORDS, 250);
  const labeling = extractSection(text, LABELING_KEYWORDS, 250);

  const rawSections: string[] = [];
  if (sealing) rawSections.push(`密封：${sealing}`);
  if (signature) rawSections.push(`签字：${signature}`);
  if (stamping) rawSections.push(`盖章：${stamping}`);
  if (packaging) rawSections.push(`包装：${packaging}`);
  if (labeling) rawSections.push(`标签：${labeling}`);

  return {
    sealing,
    signature,
    stamping,
    packaging,
    labeling,
    rawSections,
  };
}
