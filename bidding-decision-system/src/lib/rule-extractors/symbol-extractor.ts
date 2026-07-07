// ▲★※标记识别提取器

export interface SymbolItem {
  symbol: '▲' | '★' | '※' | '●' | '■';
  content: string;
  location: string;
  isHardRejection: boolean;
  sourceLocation: string;
}

const SYMBOL_CONFIG: Record<string, { isHardRejection: boolean; description: string }> = {
  '▲': { isHardRejection: true, description: '实质性要求' },
  '★': { isHardRejection: true, description: '重要技术参数' },
  '※': { isHardRejection: false, description: '特殊要求' },
  '●': { isHardRejection: false, description: '重要提示' },
  '■': { isHardRejection: false, description: '一般标记' },
};

function extractBySymbol(text: string, symbol: string): SymbolItem[] {
  const items: SymbolItem[] = [];
  const config = SYMBOL_CONFIG[symbol];
  if (!config) return items;

  const regex = new RegExp(`${symbol}[^${symbol}\n]{5,200}`, 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    const content = match[0].trim();
    if (content.length < 5) continue;

    const beforeText = text.substring(Math.max(0, match.index - 200), match.index);
    const locationMatch = beforeText.match(/第[一二三四五六七八九十\d]+[部分章节条款]/g);
    const location = locationMatch ? locationMatch[locationMatch.length - 1] : '';

    const pageMatch = beforeText.match(/---\s*PDF第(\d+)页\s*---/);
    const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

    items.push({
      symbol: symbol as SymbolItem['symbol'],
      content,
      location,
      isHardRejection: config.isHardRejection,
      sourceLocation,
    });
  }

  return items;
}

export function extractAllSymbolItems(text: string): SymbolItem[] {
  const items: SymbolItem[] = [];

  items.push(...extractBySymbol(text, '▲'));
  items.push(...extractBySymbol(text, '★'));
  items.push(...extractBySymbol(text, '※'));
  items.push(...extractBySymbol(text, '●'));
  items.push(...extractBySymbol(text, '■'));

  return items;
}
