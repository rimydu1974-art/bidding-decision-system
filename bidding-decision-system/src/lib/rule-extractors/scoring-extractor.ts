// 评分数字/比例规则提取器

export interface ScoringNumber {
  field: string;
  value: number;
  unit: string;
  sourceLocation: string;
  rawText: string;
}

function extractNumber(text: string, keyword: string, patterns: RegExp[]): ScoringNumber | null {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      const numStr = match[0].match(/\d+\.?\d*/)?.[0];
      const value = numStr ? parseFloat(numStr) : 0;
      const pageMatch = text.substring(Math.max(0, match.index - 100), match.index).match(/---\s*PDF第(\d+)页\s*---/);
      const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';
      return { field: keyword, value, unit: match[0].includes('%') ? '%' : '分', sourceLocation, rawText: match[0] };
    }
  }
  return null;
}

export function extractScoringNumbers(text: string): ScoringNumber[] {
  const items: ScoringNumber[] = [];

  const totalScorePatterns = [/总分[：:]*\s*\d+分/g, /满分[：:]*\s*\d+分/g, /总分为(\d+)/g];
  const objectivePatterns = [/客观分[：:]*\s*\d+分/g, /客观评[：:]*\s*\d+分/g];
  const subjectivePatterns = [/主观分[：:]*\s*\d+分/g, /主观评[：:]*\s*\d+分/g];
  const priceScorePatterns = [/价格分[：:]*\s*\d+分/g, /价格部分[：:]*\s*\d+分/g, /价格评分[：:]*\s*\d+/g];
  const basePricePatterns = [
    /基准价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /评分基准价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /评标基准价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /基准价格[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
  ];
  const commercialPatterns = [/商务分[：:]*\s*\d+分/g, /商务部分[：:]*\s*\d+分/g];
  const technicalPatterns = [/技术分[：:]*\s*\d+分/g, /技术部分[：:]*\s*\d+分/g];

  const total = extractNumber(text, '总分', totalScorePatterns);
  if (total) items.push(total);

  const objective = extractNumber(text, '客观分', objectivePatterns);
  if (objective) items.push(objective);

  const subjective = extractNumber(text, '主观分', subjectivePatterns);
  if (subjective) items.push(subjective);

  const price = extractNumber(text, '价格分', priceScorePatterns);
  if (price) items.push(price);

  const basePrice = extractNumber(text, '基准价', basePricePatterns);
  if (basePrice) items.push(basePrice);

  const commercial = extractNumber(text, '商务分', commercialPatterns);
  if (commercial) items.push(commercial);

  const technical = extractNumber(text, '技术分', technicalPatterns);
  if (technical) items.push(technical);

  return items;
}
