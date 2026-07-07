import { RuleDefinition } from '../types';
import { HARD_REJECTION_RULES } from './hard-rejection';
import { SOFT_REJECTION_RULES } from './soft-rejection';
import { COLLUSION_SIGNAL_RULES } from './collusion-signal';
import { NUMERIC_THRESHOLD_RULES } from './numeric-threshold';
import { BID_INVALIDITY_RULES } from './bid-invalidity';
import { ELECTRONIC_FINGERPRINT_RULES } from './electronic-fingerprint';
import { PRICE_ANOMALY_RULES } from './price-anomaly';
import { COLLUSION_BOUNDARY_RULES } from './collusion-boundary';
import { PRE_FILTER_RULES } from './pre-filter';
import { PROCEDURE_TIMING_RULES } from './procedure-timing';

export const ALL_RULES: RuleDefinition[] = [
  ...HARD_REJECTION_RULES,
  ...SOFT_REJECTION_RULES,
  ...COLLUSION_SIGNAL_RULES,
  ...NUMERIC_THRESHOLD_RULES,
  ...BID_INVALIDITY_RULES,
  ...ELECTRONIC_FINGERPRINT_RULES,
  ...PRICE_ANOMALY_RULES,
  ...COLLUSION_BOUNDARY_RULES,
  ...PRE_FILTER_RULES,
  ...PROCEDURE_TIMING_RULES,
];

export const RULES_BY_CATEGORY: Record<string, RuleDefinition[]> = {
  'hard-rejection': HARD_REJECTION_RULES,
  'soft-rejection': SOFT_REJECTION_RULES,
  'collusion-signal': COLLUSION_SIGNAL_RULES,
  'numeric-threshold': NUMERIC_THRESHOLD_RULES,
  'bid-invalidity': BID_INVALIDITY_RULES,
  'electronic-fingerprint': ELECTRONIC_FINGERPRINT_RULES,
  'price-anomaly': PRICE_ANOMALY_RULES,
  'collusion-boundary': COLLUSION_BOUNDARY_RULES,
  'pre-filter': PRE_FILTER_RULES,
  'procedure-timing': PROCEDURE_TIMING_RULES,
};

export function getRuleById(id: string): RuleDefinition | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}

export function getRulesByCategory(category: string): RuleDefinition[] {
  return RULES_BY_CATEGORY[category] || [];
}

export function getRulesByRiskLevel(riskLevel: string): RuleDefinition[] {
  return ALL_RULES.filter((rule) => rule.riskLevel === riskLevel);
}

export function getHardRejectionRules(): RuleDefinition[] {
  return HARD_REJECTION_RULES;
}

export function getSoftRejectionRules(): RuleDefinition[] {
  return SOFT_REJECTION_RULES;
}

export function getCollusionSignalRules(): RuleDefinition[] {
  return COLLUSION_SIGNAL_RULES;
}

export function getNumericThresholdRules(): RuleDefinition[] {
  return NUMERIC_THRESHOLD_RULES;
}

export function getBidInvalidityRules(): RuleDefinition[] {
  return BID_INVALIDITY_RULES;
}

export function getElectronicFingerprintRules(): RuleDefinition[] {
  return ELECTRONIC_FINGERPRINT_RULES;
}

export function getPriceAnomalyRules(): RuleDefinition[] {
  return PRICE_ANOMALY_RULES;
}

export function getCollusionBoundaryRules(): RuleDefinition[] {
  return COLLUSION_BOUNDARY_RULES;
}

export function getPreFilterRules(): RuleDefinition[] {
  return PRE_FILTER_RULES;
}

export function getProcedureTimingRules(): RuleDefinition[] {
  return PROCEDURE_TIMING_RULES;
}
