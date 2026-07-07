// 规则提取器入口
// 所有确定性数据提取，零幻觉

import { extractVoidBidConditions as _extractVoidBidConditions, extractVoidBidSummary as _extractVoidBidSummary } from './void-bid-extractor';
import { extractFinancialAmounts as _extractFinancialAmounts, extractPriceRiskNotes as _extractPriceRiskNotes } from './financial-extractor';
import { extractTimelines as _extractTimelines } from './timeline-extractor';
import { extractQualifications as _extractQualifications } from './qualification-extractor';
import { extractDocumentRequirements as _extractDocumentRequirements } from './document-req-extractor';
import { extractScoringNumbers as _extractScoringNumbers } from './scoring-extractor';
import { extractAllSymbolItems as _extractAllSymbolItems } from './symbol-extractor';

export { extractVoidBidConditions, extractVoidBidSummary } from './void-bid-extractor';
export type { VoidBidCondition } from './void-bid-extractor';

export { extractFinancialAmounts, extractPriceRiskNotes } from './financial-extractor';
export type { FinancialAmount } from './financial-extractor';

export { extractTimelines } from './timeline-extractor';
export type { TimelineItem } from './timeline-extractor';

export { extractQualifications } from './qualification-extractor';
export type { QualificationItem } from './qualification-extractor';

export { extractDocumentRequirements } from './document-req-extractor';
export type { DocumentRequirements } from './document-req-extractor';

export { extractScoringNumbers } from './scoring-extractor';
export type { ScoringNumber } from './scoring-extractor';

export { extractAllSymbolItems } from './symbol-extractor';
export type { SymbolItem } from './symbol-extractor';

// 统一提取接口
export interface RuleExtractionResult {
  voidBid: {
    conditions: import('./void-bid-extractor').VoidBidCondition[];
    summary: ReturnType<typeof import('./void-bid-extractor').extractVoidBidSummary>;
  };
  financial: {
    amounts: import('./financial-extractor').FinancialAmount[];
    riskNotes: string[];
  };
  timelines: import('./timeline-extractor').TimelineItem[];
  qualifications: import('./qualification-extractor').QualificationItem[];
  documentRequirements: import('./document-req-extractor').DocumentRequirements;
  scoring: import('./scoring-extractor').ScoringNumber[];
  symbols: import('./symbol-extractor').SymbolItem[];
  extractionTime: number;
}

export function extractAllRules(text: string): RuleExtractionResult {
  const startTime = Date.now();

  const voidBidConditions = _extractVoidBidConditions(text);
  const voidBidSummary = _extractVoidBidSummary(text);
  const financialAmounts = _extractFinancialAmounts(text);
  const priceRiskNotes = _extractPriceRiskNotes(text);
  const timelines = _extractTimelines(text);
  const qualifications = _extractQualifications(text);
  const documentRequirements = _extractDocumentRequirements(text);
  const scoringNumbers = _extractScoringNumbers(text);
  const symbols = _extractAllSymbolItems(text);

  const extractionTime = Date.now() - startTime;

  return {
    voidBid: {
      conditions: voidBidConditions,
      summary: voidBidSummary,
    },
    financial: {
      amounts: financialAmounts,
      riskNotes: priceRiskNotes,
    },
    timelines,
    qualifications,
    documentRequirements,
    scoring: scoringNumbers,
    symbols,
    extractionTime,
  };
}
