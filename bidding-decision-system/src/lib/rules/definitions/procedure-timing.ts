import { RuleDefinition } from '../types';

export const PROCEDURE_TIMING_RULES: RuleDefinition[] = [
  {
    id: 'PR1',
    name: '异议答复期',
    description: '异议答复期根据项目类型不同',
    category: 'procedure-timing',
    riskLevel: 'medium',
    interactionType: 'banner-check',
    detectionMethod: 'numeric-compare',
    industries: ['通用'],
    regions: ['全国'],
    legalBasis: '《招标投标法实施条例》第22条、财政部94号令',
    confidence: 'high',
    note: '工程招投标3自然日，政府采购7工作日',
    uiNote: '🟡 提示：异议答复期',
  },
  {
    id: 'PR2',
    name: '投诉时效',
    description: '投诉时效根据项目类型不同',
    category: 'procedure-timing',
    riskLevel: 'medium',
    interactionType: 'banner-check',
    detectionMethod: 'numeric-compare',
    industries: ['通用'],
    regions: ['全国'],
    legalBasis: '《招标投标法实施条例》第60条、财政部94号令',
    confidence: 'high',
    note: '工程招投标10自然日，政府采购15工作日',
    uiNote: '🟡 提示：投诉时效',
  },
];
