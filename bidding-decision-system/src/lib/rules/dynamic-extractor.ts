export interface DynamicExtractionResult {
  ruleId: string;
  ruleName: string;
  extractedValue: number | string;
  unit: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

export class DynamicExtractor {
  private objectionPeriodPatterns: RegExp[] = [
    /异议答复期[：:]*(\d+)[天日]/g,
    /质疑答复期[：:]*(\d+)[天日]/g,
    /收到异议.*?(\d+)[天日]内答复/g,
    /收到质疑.*?(\d+)[天日]内答复/g,
  ];

  private complaintPeriodPatterns: RegExp[] = [
    /投诉时效[：:]*(\d+)[天日]/g,
    /投诉期限[：:]*(\d+)[天日]/g,
    /向.*?投诉.*?(\d+)[天日]/g,
  ];

  private bidValidityPatterns: RegExp[] = [
    /投标有效期[：:]*(\d+)[天日]/g,
    /有效期[：:]*(\d+)[天日]/g,
    /投标有效期为(\d+)/g,
  ];

  private committeeSizePatterns: RegExp[] = [
    /评标委员会.*?(\d+)[人名]/g,
    /评委.*?(\d+)[人名]/g,
    /评审委员会.*?(\d+)[人名]/g,
  ];

  private priceWeightPatterns: RegExp[] = [
    /价格分权重[：:]*(\d+)%/g,
    /价格部分占(\d+)%/g,
    /价格评分权重(\d+)%/g,
    /价格分占(\d+)%/g,
  ];

  extractObjectionPeriod(content: string): DynamicExtractionResult | null {
    return this.extractValue(
      content,
      'R06',
      '异议答复期',
      this.objectionPeriodPatterns,
      '天'
    );
  }

  extractComplaintPeriod(content: string): DynamicExtractionResult | null {
    return this.extractValue(
      content,
      'R07',
      '投诉时效',
      this.complaintPeriodPatterns,
      '天'
    );
  }

  extractBidValidity(content: string): DynamicExtractionResult | null {
    return this.extractValue(
      content,
      'R08',
      '投标有效期',
      this.bidValidityPatterns,
      '天'
    );
  }

  extractCommitteeSize(content: string): DynamicExtractionResult | null {
    return this.extractValue(
      content,
      'R09',
      '评标委员会人数',
      this.committeeSizePatterns,
      '人'
    );
  }

  extractPriceWeight(content: string): DynamicExtractionResult | null {
    return this.extractValue(
      content,
      'R10',
      '价格分权重',
      this.priceWeightPatterns,
      '%'
    );
  }

  private extractValue(
    content: string,
    ruleId: string,
    ruleName: string,
    patterns: RegExp[],
    unit: string
  ): DynamicExtractionResult | null {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = regex.exec(content);
      if (match) {
        const value = parseInt(match[1], 10);
        if (!isNaN(value) && value > 0) {
          return {
            ruleId,
            ruleName,
            extractedValue: value,
            unit,
            source: '招标文件',
            confidence: 'high',
            rawText: match[0],
          };
        }
      }
    }
    return null;
  }

  extractAll(content: string): DynamicExtractionResult[] {
    const results: DynamicExtractionResult[] = [];

    const objectionPeriod = this.extractObjectionPeriod(content);
    if (objectionPeriod) results.push(objectionPeriod);

    const complaintPeriod = this.extractComplaintPeriod(content);
    if (complaintPeriod) results.push(complaintPeriod);

    const bidValidity = this.extractBidValidity(content);
    if (bidValidity) results.push(bidValidity);

    const committeeSize = this.extractCommitteeSize(content);
    if (committeeSize) results.push(committeeSize);

    const priceWeight = this.extractPriceWeight(content);
    if (priceWeight) results.push(priceWeight);

    return results;
  }
}
