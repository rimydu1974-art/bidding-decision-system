/**
 * Score Engine - 评分引擎
 * 
 * 负责分析评分规则，计算得分可能性，识别评分关键项
 */

export interface ScoringFactor {
  name: string;
  category: 'qualification' | 'performance' | 'technical' | 'price' | 'team';
  maxScore: number;
  currentScore: number;
  keyPoints: string[];
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
}

export interface ScoreAnalysis {
  totalScore: number;
  objectiveScore: number;
  subjectiveScore: number;
  priceScore: number;
  factors: ScoringFactor[];
  keyScoringItems: ScoringFactor[];
  easyToLosePoints: Array<{
    category: string;
    description: string;
    risk: string;
    source: string;
    sourcePage: {
      systemPage: string;
      contentPage: string;
    };
  }>;
}

export class ScoreEngine {
  /**
   * 分析评分规则
   */
  static analyze(scoringRules: {
    totalScore: number;
    objectiveScore: number;
    subjectiveScore: number;
    priceScore: number;
    items: Array<{
      name: string;
      category: string;
      maxScore: number;
      description: string;
      source?: string;
      sourcePage?: {
        systemPage: string;
        contentPage: string;
      };
    }>;
  }): ScoreAnalysis {
    const factors: ScoringFactor[] = scoringRules.items.map(item => ({
      name: item.name,
      category: item.category as ScoringFactor['category'],
      maxScore: item.maxScore,
      currentScore: 0, // 需要根据客户资料计算
      keyPoints: this.extractKeyPoints(item.description),
      source: item.source || '',
      sourcePage: item.sourcePage || { systemPage: '', contentPage: '' }
    }));

    // 识别关键评分项（最高分前5项）
    const keyScoringItems = [...factors]
      .sort((a, b) => b.maxScore - a.maxScore)
      .slice(0, 5);

    // 识别容易失分项
    const easyToLosePoints = this.identifyEasyToLosePoints(factors);

    return {
      totalScore: scoringRules.totalScore,
      objectiveScore: scoringRules.objectiveScore,
      subjectiveScore: scoringRules.subjectiveScore,
      priceScore: scoringRules.priceScore,
      factors,
      keyScoringItems,
      easyToLosePoints
    };
  }

  /**
   * 提取关键点
   */
  private static extractKeyPoints(description: string): string[] {
    const keyPoints: string[] = [];
    const keywords = ['必须', '需要', '提供', '满足', '符合', '具备', '加盖公章', '签字'];
    
    keywords.forEach(keyword => {
      if (description.includes(keyword)) {
        keyPoints.push(keyword);
      }
    });
    
    return keyPoints;
  }

  /**
   * 识别容易失分项
   */
  private static identifyEasyToLosePoints(factors: ScoringFactor[]): ScoreAnalysis['easyToLosePoints'] {
    const easyToLosePoints: ScoreAnalysis['easyToLosePoints'] = [];
    
    factors.forEach(factor => {
      // 如果最高分较高但关键点较多，可能是容易失分项
      if (factor.maxScore >= 5 && factor.keyPoints.length >= 2) {
        easyToLosePoints.push({
          category: factor.category,
          description: `${factor.name}（最高${factor.maxScore}分）`,
          risk: `需要满足${factor.keyPoints.length}个关键点`,
          source: factor.source,
          sourcePage: factor.sourcePage
        });
      }
    });
    
    return easyToLosePoints;
  }

  /**
   * 计算得分可能性
   */
  static calculateScoreProbability(
    analysis: ScoreAnalysis,
    customerCapabilities: {
      hasQualification: boolean;
      hasPerformance: boolean;
      hasTechnicalAbility: boolean;
      priceCompetitiveness: 'high' | 'medium' | 'low';
      teamStrength: 'strong' | 'medium' | 'weak';
    }
  ): {
    estimatedScore: number;
    scoreRange: { min: number; max: number };
    confidence: number;
  } {
    let estimatedScore = 0;
    let totalWeight = 0;

    analysis.factors.forEach(factor => {
      let score = 0;
      
      switch (factor.category) {
        case 'qualification':
          score = customerCapabilities.hasQualification ? factor.maxScore : 0;
          break;
        case 'performance':
          score = customerCapabilities.hasPerformance ? factor.maxScore : 0;
          break;
        case 'technical':
          score = customerCapabilities.hasTechnicalAbility ? factor.maxScore * 0.8 : factor.maxScore * 0.3;
          break;
        case 'price':
          score = customerCapabilities.priceCompetitiveness === 'high' ? factor.maxScore :
                  customerCapabilities.priceCompetitiveness === 'medium' ? factor.maxScore * 0.7 :
                  factor.maxScore * 0.4;
          break;
        case 'team':
          score = customerCapabilities.teamStrength === 'strong' ? factor.maxScore :
                  customerCapabilities.teamStrength === 'medium' ? factor.maxScore * 0.7 :
                  factor.maxScore * 0.4;
          break;
      }
      
      estimatedScore += score;
      totalWeight += factor.maxScore;
    });

    const confidence = totalWeight > 0 ? estimatedScore / totalWeight : 0;
    
    return {
      estimatedScore: Math.round(estimatedScore),
      scoreRange: {
        min: Math.round(estimatedScore * 0.7),
        max: Math.round(estimatedScore * 1.3)
      },
      confidence: Math.round(confidence * 100)
    };
  }
}
