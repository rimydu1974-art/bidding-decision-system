export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RuleCategory =
  | 'hard-rejection'
  | 'soft-rejection'
  | 'collusion-signal'
  | 'numeric-threshold'
  | 'bid-invalidity'
  | 'electronic-fingerprint'
  | 'price-anomaly'
  | 'collusion-boundary'
  | 'pre-filter'
  | 'procedure-timing';

export type InteractionType = 'popup-confirm' | 'banner-check' | 'display-only';

export type DetectionMethod =
  | 'regex'
  | 'keyword'
  | 'ai-semantic'
  | 'numeric-compare'
  | 'statistical'
  | 'metadata'
  | 'timeline'
  | 'combined'
  | 'manual';

export type Industry = '通用' | '建筑工程' | '政府采购' | '货物采购' | '服务采购';

export type Region = '全国' | '浙江省' | '杭州市' | '上海市' | '北京市';

export interface RuleThreshold {
  id: string;
  value: number | string;
  unit?: string;
  comparison: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'regex';
  source: 'legal' | 'regulation' | 'industry' | 'judicial' | 'user-confirmed';
  legalBasis?: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  riskLevel: RiskLevel;
  interactionType: InteractionType;
  detectionMethod: DetectionMethod;
  threshold?: RuleThreshold;
  industries: Industry[];
  regions: Region[];
  legalBasis?: string;
  legalSource?: string;
  reasoning?: string;
  confidence: 'high' | 'medium' | 'low';
  isPrecondition?: boolean;
  note?: string;
  uiNote?: string;
  weight?: number;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  riskLevel: RiskLevel;
  interactionType: InteractionType;
  detectedValue: string | number;
  threshold: RuleThreshold;
  message: string;
  legalBasis?: string;
  suggestion?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RuleCheckResult {
  passed: boolean;
  violations: RuleViolation[];
  checkedRules: string[];
  timestamp: Date;
}

export interface ThresholdConfig {
  version: string;
  lastUpdated: string;
  thresholds: {
    percentage: {
      bidBondMax: number;
      performanceBondMax: number;
      contractAdditionMax: number;
      unbalancedBidThreshold: number;
      priceDifferenceThreshold: number;
    };
    time: {
      tenderDocumentSalePeriod: number;
      bidDeadline: number;
      engineeringObjectionPeriod: number;
      procurementQuestionPeriod: number;
      engineeringComplaintPeriod: number;
      procurementComplaintPeriod: number;
    };
    quantity: {
      bidDocumentErrorCount: number;
      mandatoryBiddingCommitteeMin: number;
      nonMandatoryBiddingCommitteeMin: number;
    };
    similarity: {
      technicalDocumentSimilarity: number;
    };
    confidence: {
      aiSemanticAnalysis: number;
    };
  };
}

export interface SymbolMeaning {
  symbol: string;
  name: string;
  consequence: string;
  strictness: string;
  ruleType: 'hard-rejection' | 'soft-rejection';
  ruleId?: string;
}

export interface SoftRejectionResult {
  ruleId: string;
  ruleName: string;
  riskLevel: RiskLevel;
  weight: number;
  triggered: boolean;
  message: string;
  suggestion?: string;
  detectedValue?: string | number;
}

export interface HardRejectionResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  message: string;
  suggestion?: string;
}

export interface RiskAggregationResult {
  overallRiskLevel: RiskLevel;
  hardRejections: HardRejectionResult[];
  softRejections: SoftRejectionResult[];
  riskScore: number;
  recommendation: 'bid' | 'caution' | 'no-bid';
  topRisks: Array<{
    ruleId: string;
    ruleName: string;
    riskLevel: RiskLevel;
    weight: number;
    message: string;
  }>;
}
