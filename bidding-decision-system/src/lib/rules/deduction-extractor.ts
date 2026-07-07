export interface DeductionRule {
  clauseId: string;
  clauseContent: string;
  deductionPerItem: number;
  deductionCap: number;
  ruleSource: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ScoringWeight {
  category: string;
  weight: number;
  subcategory?: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export class DeductionRuleExtractor {
  private deductionPatterns: RegExp[] = [
    /每项扣(\d+)分/g,
    /每偏离一项扣(\d+)分/g,
    /每项偏离扣(\d+)分/g,
    /扣(\d+)分\/项/g,
    /(\d+)分\/项/g,
  ];

  private capPatterns: RegExp[] = [
    /最多扣(\d+)分/g,
    /上限(\d+)分/g,
    /最高扣(\d+)分/g,
    /累计不超过(\d+)分/g,
    /总分不超过(\d+)分/g,
  ];

  private weightPatterns: RegExp[] = [
    /技术部分占(\d+)%/g,
    /商务部分占(\d+)%/g,
    /价格部分占(\d+)%/g,
    /技术评分权重(\d+)%/g,
    /商务评分权重(\d+)%/g,
    /价格评分权重(\d+)%/g,
  ];

  extractDeductionRules(content: string): DeductionRule[] {
    const rules: DeductionRule[] = [];

    const deductionMatches = this.extractAllMatches(content, this.deductionPatterns);
    const capMatches = this.extractAllMatches(content, this.capPatterns);

    if (deductionMatches.length > 0) {
      const deductionPerItem = parseInt(deductionMatches[0].value, 10);
      const deductionCap = capMatches.length > 0 ? parseInt(capMatches[0].value, 10) : 20;

      rules.push({
        clauseId: `DEDUCTION_${Date.now()}`,
        clauseContent: deductionMatches[0].fullMatch,
        deductionPerItem,
        deductionCap,
        ruleSource: '招标文件',
        confidence: 'high',
      });
    }

    return rules;
  }

  extractScoringWeights(content: string): ScoringWeight[] {
    const weights: ScoringWeight[] = [];

    const technicalWeight = this.extractWeight(content, '技术部分', ['技术部分占', '技术评分权重']);
    if (technicalWeight !== null) {
      weights.push({
        category: '技术部分',
        weight: technicalWeight,
        source: '招标文件',
        confidence: 'high',
      });
    }

    const commercialWeight = this.extractWeight(content, '商务部分', ['商务部分占', '商务评分权重']);
    if (commercialWeight !== null) {
      weights.push({
        category: '商务部分',
        weight: commercialWeight,
        source: '招标文件',
        confidence: 'high',
      });
    }

    const priceWeight = this.extractWeight(content, '价格部分', ['价格部分占', '价格评分权重']);
    if (priceWeight !== null) {
      weights.push({
        category: '价格部分',
        weight: priceWeight,
        source: '招标文件',
        confidence: 'high',
      });
    }

    return weights;
  }

  private extractWeight(content: string, category: string, patterns: string[]): number | null {
    for (const pattern of patterns) {
      const regex = new RegExp(`${pattern}(\\d+)`, 'g');
      const match = regex.exec(content);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  }

  private extractAllMatches(content: string, patterns: RegExp[]): Array<{ fullMatch: string; value: string }> {
    const matches: Array<{ fullMatch: string; value: string }> = [];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          fullMatch: match[0],
          value: match[1],
        });
      }
    }

    return matches;
  }

  calculateDeductionScore(
    deductionRule: DeductionRule,
    deviationCount: number
  ): number {
    const totalDeduction = deviationCount * deductionRule.deductionPerItem;
    return Math.min(totalDeduction, deductionRule.deductionCap);
  }
}
