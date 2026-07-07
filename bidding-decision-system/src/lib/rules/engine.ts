import { RuleDefinition, RuleViolation, RuleCheckResult, ThresholdConfig, SoftRejectionResult, HardRejectionResult, RiskAggregationResult, RiskLevel } from './types';
import { ALL_RULES, getHardRejectionRules, getSoftRejectionRules, getRuleById } from './definitions';
import { DEFAULT_THRESHOLDS } from './thresholds';
import { parseSymbolDefinitions, isHardRejectionSymbol } from './symbol-mapping';

export class RuleEngine {
  private rules: RuleDefinition[];
  private thresholds: ThresholdConfig;

  constructor(thresholds?: ThresholdConfig) {
    this.rules = ALL_RULES;
    this.thresholds = thresholds || DEFAULT_THRESHOLDS;
  }

  checkAllRules(data: TenderData): RuleCheckResult {
    const violations: RuleViolation[] = [];
    const checkedRules: string[] = [];

    for (const rule of this.rules) {
      checkedRules.push(rule.id);
      const violation = this.checkRule(rule, data);
      if (violation) {
        violations.push(violation);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      checkedRules,
      timestamp: new Date(),
    };
  }

  checkHardRejectionRules(data: TenderData): RuleCheckResult {
    const violations: RuleViolation[] = [];
    const checkedRules: string[] = [];
    const hardRules = getHardRejectionRules();

    for (const rule of hardRules) {
      checkedRules.push(rule.id);
      const violation = this.checkRule(rule, data);
      if (violation) {
        violations.push(violation);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      checkedRules,
      timestamp: new Date(),
    };
  }

  checkSoftRejectionRules(data: TenderData): SoftRejectionResult[] {
    const results: SoftRejectionResult[] = [];
    const softRules = getSoftRejectionRules();

    for (const rule of softRules) {
      const result = this.checkSoftRule(rule, data);
      results.push(result);
    }

    return results;
  }

  checkSymbolRules(data: TenderData): HardRejectionResult[] {
    const results: HardRejectionResult[] = [];

    if (data.symbolDefinitions) {
      const symbols = parseSymbolDefinitions(data.symbolDefinitions);

      for (const symbol of symbols) {
        if (isHardRejectionSymbol(symbol.symbol)) {
          const hasDeviation = this.checkSymbolDeviation(symbol.symbol, data);
          results.push({
            ruleId: symbol.ruleId || 'UNKNOWN',
            ruleName: symbol.name,
            triggered: hasDeviation,
            message: hasDeviation ? `${symbol.symbol}${symbol.name}偏离，${symbol.consequence}` : '',
            suggestion: hasDeviation ? '请确保100%响应' : undefined,
          });
        }
      }
    }

    return results;
  }

  aggregateRiskResults(
    hardRejections: HardRejectionResult[],
    softRejections: SoftRejectionResult[],
    data: TenderData
  ): RiskAggregationResult {
    const triggeredHard = hardRejections.filter((r) => r.triggered);
    const triggeredSoft = softRejections.filter((r) => r.triggered);

    const overallRiskLevel = this.calculateOverallRiskLevel(triggeredHard, triggeredSoft);
    const riskScore = this.calculateRiskScore(triggeredHard, triggeredSoft);
    const recommendation = this.calculateRecommendation(overallRiskLevel, riskScore, triggeredHard);
    const topRisks = this.getTopRisks(triggeredHard, triggeredSoft);

    return {
      overallRiskLevel,
      hardRejections: hardRejections,
      softRejections: softRejections,
      riskScore,
      recommendation,
      topRisks,
    };
  }

  private calculateOverallRiskLevel(
    hardRejections: HardRejectionResult[],
    softRejections: SoftRejectionResult[]
  ): RiskLevel {
    if (hardRejections.some((r) => r.triggered)) {
      return 'critical';
    }

    const highSoft = softRejections.filter((r) => r.triggered && r.riskLevel === 'high');
    if (highSoft.length >= 2) {
      return 'critical';
    }
    if (highSoft.length === 1) {
      return 'high';
    }

    const mediumSoft = softRejections.filter((r) => r.triggered && r.riskLevel === 'medium');
    if (mediumSoft.length >= 3) {
      return 'high';
    }
    if (mediumSoft.length >= 1) {
      return 'medium';
    }

    return 'low';
  }

  private calculateRiskScore(
    hardRejections: HardRejectionResult[],
    softRejections: SoftRejectionResult[]
  ): number {
    let score = 0;

    for (const hr of hardRejections) {
      if (hr.triggered) {
        score += 100;
      }
    }

    for (const sr of softRejections) {
      if (sr.triggered) {
        score += sr.weight;
      }
    }

    return Math.min(score, 100);
  }

  private calculateRecommendation(
    overallRiskLevel: RiskLevel,
    riskScore: number,
    hardRejections: HardRejectionResult[]
  ): 'bid' | 'caution' | 'no-bid' {
    if (hardRejections.some((r) => r.triggered)) {
      return 'no-bid';
    }

    if (overallRiskLevel === 'critical') {
      return 'no-bid';
    }

    if (overallRiskLevel === 'high') {
      return 'caution';
    }

    if (overallRiskLevel === 'medium') {
      return 'caution';
    }

    return 'bid';
  }

  private getTopRisks(
    hardRejections: HardRejectionResult[],
    softRejections: SoftRejectionResult[]
  ): Array<{ ruleId: string; ruleName: string; riskLevel: RiskLevel; weight: number; message: string }> {
    const risks: Array<{ ruleId: string; ruleName: string; riskLevel: RiskLevel; weight: number; message: string }> = [];

    for (const hr of hardRejections) {
      if (hr.triggered) {
        risks.push({
          ruleId: hr.ruleId,
          ruleName: hr.ruleName,
          riskLevel: 'critical',
          weight: 100,
          message: hr.message,
        });
      }
    }

    for (const sr of softRejections) {
      if (sr.triggered) {
        risks.push({
          ruleId: sr.ruleId,
          ruleName: sr.ruleName,
          riskLevel: sr.riskLevel,
          weight: sr.weight,
          message: sr.message,
        });
      }
    }

    risks.sort((a, b) => b.weight - a.weight);

    return risks.slice(0, 20);
  }

  checkRule(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    switch (rule.id) {
      case 'H1':
        return this.checkSubstantialDeviation(rule, data);
      case 'H2':
        return this.checkQualificationReview(rule, data);
      case 'H3':
        return this.checkComplianceReview(rule, data);
      case 'H4':
        return this.checkBidValidity(rule, data);
      case 'H5':
        return this.checkBidSubmissionTime(rule, data);
      case 'H6':
        return this.checkRequiredCertificates(rule, data);
      case 'H7':
        return this.checkStarSymbolDeviation(rule, data);
      case 'H8':
        return this.checkAsteriskSymbolDeviation(rule, data);
      case 'R01':
        return this.checkBidBond(rule, data);
      case 'R02':
        return this.checkPerformanceBond(rule, data);
      case 'R03':
        return this.checkContractAddition(rule, data);
      case 'R04':
        return this.checkTenderDocumentSalePeriod(rule, data);
      case 'R05':
        return this.checkBidDeadline(rule, data);
      default:
        return null;
    }
  }

  private checkSoftRule(rule: RuleDefinition, data: TenderData): SoftRejectionResult {
    const base = {
      ruleId: rule.id,
      ruleName: rule.name,
      riskLevel: rule.riskLevel,
      weight: rule.weight || 0,
      triggered: false,
      message: '',
      suggestion: rule.note,
    };

    switch (rule.id) {
      case 'R1':
        return this.checkSubstantialDeviationScore(rule, data, base);
      case 'R2':
        return this.checkTechnicalScoreRatio(rule, data, base);
      case 'R3':
        return this.checkPriceScoreRatio(rule, data, base);
      case 'R4':
        return this.checkCertificateScore(rule, data, base);
      case 'R5':
        return this.checkPerformanceRequirement(rule, data, base);
      case 'R6':
        return this.checkDeliveryPeriod(rule, data, base);
      case 'R7':
        return this.checkBudgetAnomaly(rule, data, base);
      case 'R8':
        return this.checkTimeUrgency(rule, data, base);
      case 'R9':
        return this.checkDocumentComplexity(rule, data, base);
      case 'R10':
        return this.checkJointBid(rule, data, base);
      default:
        return base;
    }
  }

  private checkSubstantialDeviationScore(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.substantialDeviations && data.substantialDeviationScores) {
      const totalDeduction = data.substantialDeviations.reduce((sum, dev) => {
        const score = data.substantialDeviationScores?.[dev] || 0;
        return sum + score;
      }, 0);

      const maxScore = data.substantialDeviationMaxScore || 100;
      const ratio = totalDeduction / maxScore;

      if (ratio > 0.6) {
        return { ...base, triggered: true, riskLevel: 'critical', message: `▲项负偏离扣分比例${(ratio * 100).toFixed(0)}%，超过60%阈值` };
      }
      if (ratio > 0.3) {
        return { ...base, triggered: true, message: `▲项负偏离扣分比例${(ratio * 100).toFixed(0)}%，超过30%阈值` };
      }
    }
    return base;
  }

  private checkTechnicalScoreRatio(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.scoringRules) {
      const technicalScore = data.scoringRules.technicalScore || 0;
      const totalScore = data.scoringRules.totalScore || 100;
      const ratio = technicalScore / totalScore;

      if (ratio > 0.4) {
        return { ...base, triggered: true, message: `技术分占比${(ratio * 100).toFixed(0)}%，超过40%阈值，需考虑企业是否能在投标截止时间内做出高质量技术方案` };
      }
      if (ratio > 0.25) {
        return { ...base, triggered: true, riskLevel: 'medium', message: `技术分占比${(ratio * 100).toFixed(0)}%，超过25%阈值` };
      }
    }
    return base;
  }

  private checkPriceScoreRatio(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.scoringRules) {
      const priceScore = data.scoringRules.priceScore || 0;
      const totalScore = data.scoringRules.totalScore || 100;
      const ratio = priceScore / totalScore;

      if (ratio < 0.1) {
        return { ...base, triggered: true, message: `价格分占比${(ratio * 100).toFixed(0)}%，低于10%阈值，价格竞争空间有限` };
      }
    }
    return base;
  }

  private checkCertificateScore(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.requiredCertificates && data.ourCertificates) {
      const missing = data.requiredCertificates.filter(
        (cert) => !data.ourCertificates?.includes(cert)
      );
      if (missing.length > 0) {
        return { ...base, triggered: true, message: `缺少${missing.length}项评分标准要求的资质证书: ${missing.join(', ')}` };
      }
    }
    return base;
  }

  private checkPerformanceRequirement(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.scoringRules?.items) {
      const performanceItems = data.scoringRules.items.filter(
        (item) => item.name.includes('业绩') || item.name.includes('经验')
      );
      if (performanceItems.length > 0 && (!data.ourPerformanceCount || data.ourPerformanceCount === 0)) {
        return { ...base, triggered: true, message: '评分标准要求类似业绩，但我方无相关业绩记录' };
      }
    }
    return base;
  }

  private checkDeliveryPeriod(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.deliveryPeriod && data.projectComplexity) {
      if (data.deliveryPeriod < data.projectComplexity) {
        return { ...base, triggered: true, message: `交付周期${data.deliveryPeriod}天紧张，项目复杂度评估需要${data.projectComplexity}天` };
      }
    }
    return base;
  }

  private checkBudgetAnomaly(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.budget && data.maxPrice) {
      const ratio = Math.abs(data.budget - data.maxPrice) / data.budget;
      if (ratio > 0.2) {
        return { ...base, triggered: true, message: `预算与最高限价差距${(ratio * 100).toFixed(0)}%，超过20%阈值，利润空间可能受限` };
      }
    }
    return base;
  }

  private checkTimeUrgency(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.bidOpeningTime) {
      const now = new Date();
      const daysLeft = Math.ceil((data.bidOpeningTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 3) {
        return { ...base, triggered: true, message: `距投标截止仅剩${daysLeft}天，投标准备时间极度紧张` };
      }
      if (daysLeft < 7) {
        return { ...base, triggered: true, message: `距投标截止仅剩${daysLeft}天，投标准备时间紧张` };
      }
    }
    return base;
  }

  private checkDocumentComplexity(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.sealingRequirements || data.originalCopies) {
      const complexKeywords = ['正本', '副本', '密封', '盖章', '骑缝', '电子签章'];
      const hasComplex = complexKeywords.some(
        (kw) => data.sealingRequirements?.includes(kw) || data.originalCopies?.includes(kw)
      );
      if (hasComplex) {
        return { ...base, triggered: true, message: '投标文件份数/密封要求较复杂，需仔细核对' };
      }
    }
    return base;
  }

  private checkJointBid(rule: RuleDefinition, data: TenderData, base: SoftRejectionResult): SoftRejectionResult {
    if (data.jointBid && data.isJointBid) {
      return { ...base, triggered: true, message: '联合体投标增加协调成本，需提前规划分工和责任' };
    }
    return base;
  }

  private checkSymbolDeviation(symbol: string, data: TenderData): boolean {
    if (!data.substantialRequirements) return false;

    const requirements = data.substantialRequirements.filter((req) => req.startsWith(symbol));
    if (requirements.length === 0) return false;

    if (data.ourCapabilities) {
      const notMet = requirements.filter((req) => {
        const capability = data.ourCapabilities?.[req];
        return capability === 'not-met' || capability === 'partial';
      });
      return notMet.length > 0;
    }

    return false;
  }

  private checkSubstantialDeviation(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.substantialDeviations && data.substantialDeviations.length > 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        riskLevel: rule.riskLevel,
        interactionType: rule.interactionType,
        detectedValue: data.substantialDeviations.length,
        threshold: { id: 'substantialDeviation', value: 0, comparison: 'eq', source: 'legal' },
        message: `检测到${data.substantialDeviations.length}项实质性偏离`,
        legalBasis: rule.legalBasis,
        suggestion: '请修正实质性偏离项后再提交',
        confidence: rule.confidence,
      };
    }
    return null;
  }

  private checkQualificationReview(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.qualificationReviewFailed) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        riskLevel: rule.riskLevel,
        interactionType: rule.interactionType,
        detectedValue: '不通过',
        threshold: { id: 'qualificationReview', value: '通过', comparison: 'eq', source: 'legal' },
        message: '资格性审查不通过',
        legalBasis: rule.legalBasis,
        suggestion: '请检查投标人资格条件',
        confidence: rule.confidence,
      };
    }
    return null;
  }

  private checkComplianceReview(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.complianceReviewFailed) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        riskLevel: rule.riskLevel,
        interactionType: rule.interactionType,
        detectedValue: '不通过',
        threshold: { id: 'complianceReview', value: '通过', comparison: 'eq', source: 'legal' },
        message: '符合性审查不通过',
        legalBasis: rule.legalBasis,
        suggestion: '请检查投标文件形式要求',
        confidence: rule.confidence,
      };
    }
    return null;
  }

  private checkBidValidity(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.bidValidityDays && data.requiredBidValidityDays) {
      if (data.bidValidityDays < data.requiredBidValidityDays) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: data.bidValidityDays,
          threshold: { id: 'bidValidity', value: data.requiredBidValidityDays, comparison: 'gte', source: 'legal' },
          message: `投标有效期${data.bidValidityDays}天不足，要求至少${data.requiredBidValidityDays}天`,
          legalBasis: rule.legalBasis,
          suggestion: '请延长投标有效期',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkBidSubmissionTime(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.submissionTime && data.bidDeadline) {
      if (data.submissionTime > data.bidDeadline) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: data.submissionTime.toISOString(),
          threshold: { id: 'bidDeadline', value: data.bidDeadline.toISOString(), comparison: 'lte', source: 'legal' },
          message: '投标文件逾期送达',
          legalBasis: rule.legalBasis,
          suggestion: '请确保在截止时间前提交',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkRequiredCertificates(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.requiredCertificates && data.ourCertificates) {
      const missing = data.requiredCertificates.filter(
        (cert) => !data.ourCertificates?.includes(cert)
      );
      if (missing.length > 0) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: missing.join(', '),
          threshold: { id: 'requiredCertificates', value: data.requiredCertificates.length, comparison: 'eq', source: 'legal' },
          message: `缺少${missing.length}项必须资质证书: ${missing.join(', ')}`,
          legalBasis: rule.legalBasis,
          suggestion: '请补充必须的资质证书',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkStarSymbolDeviation(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.starRequirements && data.ourCapabilities) {
      const notMet = data.starRequirements.filter((req) => {
        const capability = data.ourCapabilities?.[req];
        return capability === 'not-met' || capability === 'partial';
      });
      if (notMet.length > 0) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: notMet.length,
          threshold: { id: 'starDeviation', value: 0, comparison: 'eq', source: 'legal' },
          message: `★实质性否决项偏离${notMet.length}项，直接废标`,
          legalBasis: rule.legalBasis,
          suggestion: '必须100%完全响应，零偏离',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkAsteriskSymbolDeviation(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.asteriskRequirements && data.ourCapabilities) {
      const notMet = data.asteriskRequirements.filter((req) => {
        const capability = data.ourCapabilities?.[req];
        return capability === 'not-met' || capability === 'partial';
      });
      if (notMet.length > 0) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: notMet.length,
          threshold: { id: 'asteriskDeviation', value: 0, comparison: 'eq', source: 'legal' },
          message: `*实质性否决项偏离${notMet.length}项，多数情况直接废标`,
          legalBasis: rule.legalBasis,
          suggestion: '以招标文件符号释义为准，优先按否决项严格对待',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkBidBond(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.bidBondAmount && data.estimatedPrice) {
      const percentage = (data.bidBondAmount / data.estimatedPrice) * 100;
      const maxPercentage = this.thresholds.thresholds.percentage.bidBondMax;
      if (percentage > maxPercentage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: percentage,
          threshold: rule.threshold!,
          message: `投标保证金占比${percentage.toFixed(2)}%超过法定上限${maxPercentage}%`,
          legalBasis: rule.legalBasis,
          suggestion: '请降低投标保证金',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkPerformanceBond(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.performanceBondAmount && data.contractPrice) {
      const percentage = (data.performanceBondAmount / data.contractPrice) * 100;
      const maxPercentage = this.thresholds.thresholds.percentage.performanceBondMax;
      if (percentage > maxPercentage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: percentage,
          threshold: rule.threshold!,
          message: `履约保证金占比${percentage.toFixed(2)}%超过法定上限${maxPercentage}%`,
          legalBasis: rule.legalBasis,
          suggestion: '请降低履约保证金',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkContractAddition(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.contractAdditionAmount && data.originalContractPrice) {
      const percentage = (data.contractAdditionAmount / data.originalContractPrice) * 100;
      const maxPercentage = this.thresholds.thresholds.percentage.contractAdditionMax;
      if (percentage > maxPercentage) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: percentage,
          threshold: rule.threshold!,
          message: `合同追加比例${percentage.toFixed(2)}%超过法定上限${maxPercentage}%`,
          legalBasis: rule.legalBasis,
          suggestion: '请控制合同追加比例',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkTenderDocumentSalePeriod(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.salePeriodDays) {
      const minDays = this.thresholds.thresholds.time.tenderDocumentSalePeriod;
      if (data.salePeriodDays < minDays) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: data.salePeriodDays,
          threshold: rule.threshold!,
          message: `招标文件发售期${data.salePeriodDays}工作日不足，要求至少${minDays}工作日`,
          legalBasis: rule.legalBasis,
          suggestion: '请延长招标文件发售期',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }

  private checkBidDeadline(rule: RuleDefinition, data: TenderData): RuleViolation | null {
    if (data.tenderIssueDate && data.bidDeadline) {
      const daysDiff = Math.ceil(
        (data.bidDeadline.getTime() - data.tenderIssueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const minDays = this.thresholds.thresholds.time.bidDeadline;
      if (daysDiff < minDays) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          riskLevel: rule.riskLevel,
          interactionType: rule.interactionType,
          detectedValue: daysDiff,
          threshold: rule.threshold!,
          message: `投标截止期限${daysDiff}天不足，要求至少${minDays}天`,
          legalBasis: rule.legalBasis,
          suggestion: '请延长投标截止期限',
          confidence: rule.confidence,
        };
      }
    }
    return null;
  }
}

export interface TenderData {
  substantialDeviations?: string[];
  substantialDeviationScores?: Record<string, number>;
  substantialDeviationMaxScore?: number;
  qualificationReviewFailed?: boolean;
  complianceReviewFailed?: boolean;
  bidValidityDays?: number;
  requiredBidValidityDays?: number;
  submissionTime?: Date;
  bidDeadline?: Date;
  requiredCertificates?: string[];
  ourCertificates?: string[];
  bidBondAmount?: number;
  estimatedPrice?: number;
  performanceBondAmount?: number;
  contractPrice?: number;
  contractAdditionAmount?: number;
  originalContractPrice?: number;
  salePeriodDays?: number;
  tenderIssueDate?: Date;
  symbolDefinitions?: string;
  substantialRequirements?: string[];
  ourCapabilities?: Record<string, 'met' | 'partial' | 'not-met' | 'unknown'>;
  starRequirements?: string[];
  asteriskRequirements?: string[];
  scoringRules?: {
    technicalScore?: number;
    priceScore?: number;
    totalScore?: number;
    items?: Array<{ name: string; maxScore: number }>;
  };
  deliveryPeriod?: number;
  projectComplexity?: number;
  budget?: number;
  maxPrice?: number;
  bidOpeningTime?: Date;
  sealingRequirements?: string;
  originalCopies?: string;
  jointBid?: boolean;
  isJointBid?: boolean;
  ourPerformanceCount?: number;
}
