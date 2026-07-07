import { SymbolMeaning } from './types';

export const SYMBOL_MEANINGS: SymbolMeaning[] = [
  {
    symbol: '★',
    name: '实质性否决项',
    consequence: '直接废标，投标出局',
    strictness: '必须100%完全响应，零偏离',
    ruleType: 'hard-rejection',
    ruleId: 'H7',
  },
  {
    symbol: '*',
    name: '多为实质性否决项/少数标记核心产品',
    consequence: '多数情况直接废标；仅标记核心产品时不废标',
    strictness: '优先按否决项严格对待，以文件说明为准',
    ruleType: 'hard-rejection',
    ruleId: 'H8',
  },
  {
    symbol: '▲',
    name: '重要打分项',
    consequence: '扣除高额分数、排名下滑，不会直接废标',
    strictness: '尽量全部满足，无法满足要提前评估扣分影响',
    ruleType: 'soft-rejection',
    ruleId: 'R1',
  },
];

export function getSymbolMeaning(symbol: string): SymbolMeaning | undefined {
  return SYMBOL_MEANINGS.find((s) => s.symbol === symbol);
}

export function extractSymbolsFromContent(content: string): string[] {
  const symbols: string[] = [];
  const symbolPatterns = ['★', '●', '▲', '※'];

  for (const pattern of symbolPatterns) {
    if (content.includes(pattern)) {
      symbols.push(pattern);
    }
  }

  return symbols;
}

export function parseSymbolDefinitions(content: string): SymbolMeaning[] {
  const results: SymbolMeaning[] = [];

  const lines = content.split('\n');
  for (const line of lines) {
    for (const sm of SYMBOL_MEANINGS) {
      if (line.includes(sm.symbol) && line.includes(sm.name)) {
        results.push(sm);
      }
    }
  }

  return results.length > 0 ? results : SYMBOL_MEANINGS;
}

export function getRuleTypeForSymbol(symbol: string): 'hard-rejection' | 'soft-rejection' | null {
  const meaning = getSymbolMeaning(symbol);
  return meaning?.ruleType || null;
}

export function isHardRejectionSymbol(symbol: string): boolean {
  const meaning = getSymbolMeaning(symbol);
  return meaning?.ruleType === 'hard-rejection';
}

export function isSoftRejectionSymbol(symbol: string): boolean {
  const meaning = getSymbolMeaning(symbol);
  return meaning?.ruleType === 'soft-rejection';
}
