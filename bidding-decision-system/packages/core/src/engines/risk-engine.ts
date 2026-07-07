/**
 * Risk Engine - 风险引擎
 * 
 * 负责分析招标文件中的风险点，包括废标风险、评分风险、时间风险等
 */

export interface RiskFactor {
  id: string;
  category: 'void' | 'score' | 'time' | 'qualification' | 'price' | 'other';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
  impact: string;
  suggestion: string;
  isSubstantial?: boolean;
}

export interface RiskAnalysis {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  risks: RiskFactor[];
  voidRisks: RiskFactor[];
  scoreRisks: RiskFactor[];
  timeRisks: RiskFactor[];
  riskSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export class RiskEngine {
  /**
   * 分析风险
   */
  static analyze(data: {
    qualificationRequirements?: Array<{
      isSubstantial?: boolean;
      specialQualification?: string;
      specialPersonnelReq?: string;
      [key: string]: any;
    }>;
    scoringRules?: {
      voidBidExplanation?: string;
      objectiveScore?: number;
      subjectiveScore?: number;
      [key: string]: any;
    };
    timeRequirements?: {
      bidOpeningTime?: string;
      documentAcquisitionDeadline?: string;
      [key: string]: any;
    };
    financialInfo?: {
      bidBond?: string;
      performanceBond?: string;
      [key: string]: any;
    };
  }): RiskAnalysis {
    const risks: RiskFactor[] = [];

    // 分析资质要求风险
    if (data.qualificationRequirements) {
      data.qualificationRequirements.forEach((req, index) => {
        if (req.isSubstantial) {
          risks.push({
            id: `qual-${index}`,
            category: 'qualification',
            level: 'high',
            title: '实质性资质要求',
            description: req.specialQualification || '存在实质性资质要求',
            source: '招标文件',
            sourcePage: { systemPage: '', contentPage: '' },
            impact: '不满足将导致废标',
            suggestion: '确认是否具备所有实质性资质',
            isSubstantial: true
          });
        }
      });
    }

    // 分析评分规则风险
    if (data.scoringRules) {
      if (data.scoringRules.voidBidExplanation) {
        risks.push({
          id: 'void-explanation',
          category: 'void',
          level: 'high',
          title: '废标说明',
          description: data.scoringRules.voidBidExplanation,
          source: '评分规则',
          sourcePage: { systemPage: '', contentPage: '' },
          impact: '违反将导致废标',
          suggestion: '仔细阅读并遵守废标说明'
        });
      }

      // 客观分风险
      if (data.scoringRules.objectiveScore !== undefined && 
          data.scoringRules.subjectiveScore !== undefined) {
        const objectiveRatio = data.scoringRules.objectiveScore / 
          (data.scoringRules.objectiveScore + data.scoringRules.subjectiveScore);
        
        if (objectiveRatio < 0.35) {
          risks.push({
            id: 'objective-score-low',
            category: 'score',
            level: 'medium',
            title: '客观分占比过低',
            description: `客观分仅占${Math.round(objectiveRatio * 100)}%，主观分占比过高`,
            source: '评分规则',
            sourcePage: { systemPage: '', contentPage: '' },
            impact: '中标不确定性大',
            suggestion: '客观分≤35分时需特别注意'
          });
        }
      }
    }

    // 分析时间风险
    if (data.timeRequirements?.bidOpeningTime) {
      const bidOpening = new Date(data.timeRequirements.bidOpeningTime);
      const now = new Date();
      const daysRemaining = Math.ceil((bidOpening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 7) {
        risks.push({
          id: 'time-tight',
          category: 'time',
          level: 'high',
          title: '时间紧迫',
          description: `距开标仅剩${daysRemaining}天`,
          source: '时间要求',
          sourcePage: { systemPage: '', contentPage: '' },
          impact: '准备时间不足',
          suggestion: '加班加点准备或考虑放弃'
        });
      }
    }

    // 分析财务风险
    if (data.financialInfo) {
      if (data.financialInfo.bidBond) {
        risks.push({
          id: 'bid-bond',
          category: 'price',
          level: 'low',
          title: '投标保证金',
          description: `投标保证金：${data.financialInfo.bidBond}`,
          source: '财务信息',
          sourcePage: { systemPage: '', contentPage: '' },
          impact: '需要准备资金',
          suggestion: '确认资金是否充足'
        });
      }
    }

    // 计算风险等级
    const riskSummary = {
      criticalCount: risks.filter(r => r.level === 'critical').length,
      highCount: risks.filter(r => r.level === 'high').length,
      mediumCount: risks.filter(r => r.level === 'medium').length,
      lowCount: risks.filter(r => r.level === 'low').length
    };

    let overallRiskLevel: RiskAnalysis['overallRiskLevel'] = 'low';
    let riskScore = 0;

    if (riskSummary.criticalCount > 0) {
      overallRiskLevel = 'critical';
      riskScore = 90;
    } else if (riskSummary.highCount > 0) {
      overallRiskLevel = 'high';
      riskScore = 70;
    } else if (riskSummary.mediumCount > 0) {
      overallRiskLevel = 'medium';
      riskScore = 50;
    } else {
      overallRiskLevel = 'low';
      riskScore = 20;
    }

    return {
      overallRiskLevel,
      riskScore,
      risks,
      voidRisks: risks.filter(r => r.category === 'void'),
      scoreRisks: risks.filter(r => r.category === 'score'),
      timeRisks: risks.filter(r => r.category === 'time'),
      riskSummary
    };
  }

  /**
   * 检查实质性偏离
   */
  static checkSubstantialDeviation(requirements: string[], commitments: string[]): {
    hasDeviation: boolean;
    deviations: Array<{
      requirement: string;
      commitment: string;
      reason: string;
    }>;
  } {
    const deviations: Array<{
      requirement: string;
      commitment: string;
      reason: string;
    }> = [];

    // 简单的偏离检测逻辑
    requirements.forEach(req => {
      commitments.forEach(commit => {
        if (this.isDeviation(req, commit)) {
          deviations.push({
            requirement: req,
            commitment: commit,
            reason: '承诺与要求不符'
          });
        }
      });
    });

    return {
      hasDeviation: deviations.length > 0,
      deviations
    };
  }

  /**
   * 判断是否存在偏离
   */
  private static isDeviation(requirement: string, commitment: string): boolean {
    // 简化的偏离判断逻辑
    // 实际应用中需要更复杂的NLP分析
    const reqLower = requirement.toLowerCase();
    const comLower = commitment.toLowerCase();
    
    // 如果承诺中包含否定词，可能是偏离
    const negationWords = ['不', '无', '未', '无法', '不能'];
    return negationWords.some(word => comLower.includes(word) && reqLower.includes(word));
  }
}
