/**
 * Decision Engine - 决策引擎
 * 
 * 负责综合分析所有数据，做出最终投标决策建议
 * 包括：投标/不投标/谨慎投标的判断，以及A/B/C/D等级评定
 */

export interface DecisionInput {
  projectName: string;
  budget: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  qualificationStatus: 'met' | 'partial' | 'not-met' | 'unknown';
  scoreBreakdown?: {
    qualificationMatch: number;
    performanceMatch: number;
    technicalFeasibility: number;
    priceCompetitiveness: number;
    teamConfiguration: number;
  };
  objectiveScore?: number;
  subjectiveScore?: number;
  priceScore?: number;
}

export interface DecisionOutput {
  recommendation: 'bid' | 'caution' | 'no-bid';
  level: 'A' | 'B' | 'C' | 'D';
  score: number;
  reasons: string[];
  keyPreparations: string[];
  riskWarnings: string[];
  conditionalSuggestion?: string;
}

export class DecisionEngine {
  /**
   * 分析并做出投标决策
   */
  static analyze(input: DecisionInput): DecisionOutput {
    const { riskLevel, qualificationStatus, scoreBreakdown, objectiveScore, subjectiveScore, priceScore } = input;
    
    // 计算基础分数
    let baseScore = 50;
    
    // 资质匹配度影响
    if (qualificationStatus === 'met') {
      baseScore += 20;
    } else if (qualificationStatus === 'partial') {
      baseScore += 10;
    } else if (qualificationStatus === 'not-met') {
      baseScore -= 30;
    }
    
    // 风险等级影响
    switch (riskLevel) {
      case 'low':
        baseScore += 15;
        break;
      case 'medium':
        baseScore += 5;
        break;
      case 'high':
        baseScore -= 10;
        break;
      case 'critical':
        baseScore -= 25;
        break;
    }
    
    // 评分结构影响
    if (objectiveScore !== undefined && subjectiveScore !== undefined) {
      const objectiveRatio = objectiveScore / (objectiveScore + subjectiveScore);
      if (objectiveRatio < 0.35) {
        baseScore -= 10; // 客观分过低，中标不确定性大
      }
    }
    
    // 分数分解影响
    if (scoreBreakdown) {
      const avgScore = (
        scoreBreakdown.qualificationMatch +
        scoreBreakdown.performanceMatch +
        scoreBreakdown.technicalFeasibility +
        scoreBreakdown.priceCompetitiveness +
        scoreBreakdown.teamConfiguration
      ) / 5;
      baseScore += (avgScore - 50) * 0.3;
    }
    
    // 限制分数范围
    baseScore = Math.max(0, Math.min(100, baseScore));
    
    // 确定等级和建议
    let recommendation: 'bid' | 'caution' | 'no-bid';
    let level: 'A' | 'B' | 'C' | 'D';
    const reasons: string[] = [];
    const keyPreparations: string[] = [];
    const riskWarnings: string[] = [];
    
    if (baseScore >= 75) {
      recommendation = 'bid';
      level = 'A';
      reasons.push('资质匹配，风险可控，建议积极投标');
      keyPreparations.push('确保所有资质文件齐全', '认真准备技术方案');
    } else if (baseScore >= 60) {
      recommendation = 'bid';
      level = 'B';
      reasons.push('整体条件较好，可以投标');
      keyPreparations.push('重点关注评分关键项', '确保业绩证明材料完整');
    } else if (baseScore >= 45) {
      recommendation = 'caution';
      level = 'C';
      reasons.push('存在一定风险，需谨慎评估');
      riskWarnings.push('客观分占比较低，中标不确定性大');
      keyPreparations.push('仔细核对资质要求', '评估竞争对手情况');
    } else {
      recommendation = 'no-bid';
      level = 'D';
      reasons.push('风险较高，不建议投标');
      riskWarnings.push('资质不全或风险过高');
    }
    
    // 客观分风险提示
    if (objectiveScore !== undefined && objectiveScore <= 35) {
      riskWarnings.push('客观分≤35分，主观分占比过高，中标不确定性大');
    }
    
    return {
      recommendation,
      level,
      score: Math.round(baseScore),
      reasons,
      keyPreparations,
      riskWarnings,
      conditionalSuggestion: qualificationStatus === 'partial' ? 
        '如果有完整资质，建议投标' : undefined
    };
  }
}
