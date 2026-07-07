// 金额规则提取器
// 预算/最高限价/保证金/代理费等确定性提取

export interface FinancialAmount {
  field: string;
  value: string;
  numericValue: number;
  unit: string;
  sourceLocation: string;
  rawText: string;
}

function parseChineseNumber(text: string): number {
  const cleaned = text.replace(/[,，\s]/g, '');
  const match = cleaned.match(/([\d.]+)\s*(万|千|百|亿)?/);
  if (!match) return 0;
  let num = parseFloat(match[1]);
  if (match[2] === '万') num *= 10000;
  else if (match[2] === '千万') num *= 10000000;
  else if (match[2] === '百万') num *= 1000000;
  else if (match[2] === '千') num *= 1000;
  else if (match[2] === '百') num *= 100;
  else if (match[2] === '亿') num *= 100000000;
  return num;
}

function extractAmount(text: string, keyword: string, patterns: RegExp[]): FinancialAmount | null {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      const rawText = match[0];
      const amountStr = rawText.match(/[\d,.]+\s*(万|千万|百万|千|百|亿)?元?/)?.[0] || '';
      const numericValue = parseChineseNumber(amountStr);
      const pageMatch = text.substring(Math.max(0, match.index - 100), match.index).match(/---\s*PDF第(\d+)页\s*---/);
      const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

      return {
        field: keyword,
        value: amountStr || rawText,
        numericValue,
        unit: rawText.includes('万') ? '万元' : rawText.includes('%') ? '%' : '元',
        sourceLocation,
        rawText,
      };
    }
  }
  return null;
}

export function extractFinancialAmounts(text: string): FinancialAmount[] {
  const amounts: FinancialAmount[] = [];

  const budgetPatterns = [
    /预算[金额金][：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /采购预算[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /项目预算[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /预算总额[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
  ];

  const maxPricePatterns = [
    /最高限价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /控制价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /最高报价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
    /上限价[：:]*\s*[\d,.]+\s*(万|千万|百万)?元?/g,
  ];

  const bidBondPatterns = [
    /投标保证金[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /保证金[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /保证金[：:]*.*?(\d+)%/g,
  ];

  const performanceBondPatterns = [
    /履约保证金[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /履约担保[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /履约保证金[：:]*.*?(\d+)%/g,
  ];

  const qualityBondPatterns = [
    /质量保证金[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /质保金[：:]*\s*[\d,.]+\s*(万|千万|百万|千|百)?元?/g,
    /质量保证金[：:]*.*?(\d+)%/g,
  ];

  const bidDocFeePatterns = [
    /标书费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
    /招标文件费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
    /谈判文件费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
    /售价[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
  ];

  const agencyFeePatterns = [
    /代理费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
    /代理服务费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
    /招标代理费[：:]*\s*[\d,.]+\s*(万|千|百)?元?/g,
  ];

  const budget = extractAmount(text, '预算金额', budgetPatterns);
  if (budget) amounts.push(budget);

  const maxPrice = extractAmount(text, '最高限价', maxPricePatterns);
  if (maxPrice) amounts.push(maxPrice);

  const bidBond = extractAmount(text, '投标保证金', bidBondPatterns);
  if (bidBond) amounts.push(bidBond);

  const performanceBond = extractAmount(text, '履约保证金', performanceBondPatterns);
  if (performanceBond) amounts.push(performanceBond);

  const qualityBond = extractAmount(text, '质量保证金', qualityBondPatterns);
  if (qualityBond) amounts.push(qualityBond);

  const bidDocFee = extractAmount(text, '标书费', bidDocFeePatterns);
  if (bidDocFee) amounts.push(bidDocFee);

  const agencyFee = extractAmount(text, '代理费', agencyFeePatterns);
  if (agencyFee) amounts.push(agencyFee);

  return amounts;
}

export function extractPriceRiskNotes(text: string): string[] {
  const notes: string[] = [];

  if (text.includes('低于平均价40%') || text.includes('低于平均报价40%')) {
    notes.push('报价低于平均价40%需提供书面说明+履约担保，否则无效');
  }
  if (text.includes('超出无效') || text.includes('超过无效')) {
    notes.push('报价超出最高限价为无效报价');
  }
  if (text.includes('低于成本') || text.includes('低于企业成本')) {
    notes.push('报价低于成本价可能被认定为无效');
  }

  return notes;
}
