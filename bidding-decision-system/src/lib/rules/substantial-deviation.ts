import { RuleViolation } from './types';

export interface SubstantialDeviation {
  clauseId: string;
  clauseContent: string;
  bidContent: string;
  deviationType: '实质性偏离' | '格式不符' | '内容缺失';
  riskLevel: 'critical' | 'high';
  blockAction: '自动拦截' | '警告提示';
}

export interface BlockLog {
  blockId: string;
  timestamp: Date;
  userId: string;
  projectId: string;
  deviationItems: SubstantialDeviation[];
  evidenceChain: {
    tenderAnalysisId: string;
    bidAnalysisId: string;
    riskAssessment: 'high' | 'critical';
    blockLog: string;
  };
  userConfirm?: string;
  confirmTime?: Date;
}

export class SubstantialDeviationInterceptor {
  private deviationPatterns: RegExp[] = [
    /▲\s*[^，。、；]+/g,
    /实质性要求[^，。、；]+/g,
    /必须满足[^，。、；]+/g,
    /不得偏离[^，。、栗]+/g,
  ];

  detectDeviations(
    tenderContent: string,
    bidContent: string
  ): SubstantialDeviation[] {
    const deviations: SubstantialDeviation[] = [];

    const substantialClauses = this.extractSubstantialClauses(tenderContent);

    for (const clause of substantialClauses) {
      const isDeviated = this.checkDeviation(clause, bidContent);
      if (isDeviated) {
        deviations.push({
          clauseId: `CLAUSE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          clauseContent: clause,
          bidContent: this.extractRelevantBidContent(clause, bidContent),
          deviationType: '实质性偏离',
          riskLevel: 'critical',
          blockAction: '自动拦截',
        });
      }
    }

    return deviations;
  }

  private extractSubstantialClauses(content: string): string[] {
    const clauses: string[] = [];

    for (const pattern of this.deviationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        clauses.push(...matches);
      }
    }

    return [...new Set(clauses)];
  }

  private checkDeviation(clause: string, bidContent: string): boolean {
    const keywords = this.extractKeywords(clause);
    let matchCount = 0;

    for (const keyword of keywords) {
      if (bidContent.includes(keyword)) {
        matchCount++;
      }
    }

    return matchCount < keywords.length * 0.5;
  }

  private extractKeywords(clause: string): string[] {
    const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    const words = clause.split(/[\s,，。、；！？]+/).filter((word) => word.length > 1 && !stopWords.includes(word));
    return words;
  }

  private extractRelevantBidContent(clause: string, bidContent: string): string {
    const keywords = this.extractKeywords(clause);
    const sentences = bidContent.split(/[。！？]+/);

    for (const sentence of sentences) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (sentence.includes(keyword)) {
          matchCount++;
        }
      }
      if (matchCount >= keywords.length * 0.3) {
        return sentence.trim();
      }
    }

    return '';
  }

  createViolation(deviation: SubstantialDeviation): RuleViolation {
    return {
      ruleId: 'H1',
      ruleName: '▲实质性要求偏离',
      category: 'hard-rejection',
      riskLevel: deviation.riskLevel,
      interactionType: 'popup-confirm',
      detectedValue: deviation.clauseContent,
      threshold: {
        id: 'substantialDeviation',
        value: 0,
        comparison: 'eq',
        source: 'legal',
      },
      message: `检测到实质性偏离: ${deviation.clauseContent}`,
      legalBasis: '《招标投标法实施条例》第51条',
      suggestion: '请修正实质性偏离项后再提交',
      confidence: 'high',
    };
  }

  createBlockLog(
    deviations: SubstantialDeviation[],
    userId: string,
    projectId: string,
    tenderAnalysisId: string,
    bidAnalysisId: string
  ): BlockLog {
    return {
      blockId: `BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      projectId,
      deviationItems: deviations,
      evidenceChain: {
        tenderAnalysisId,
        bidAnalysisId,
        riskAssessment: 'critical',
        blockLog: `系统自动拦截${deviations.length}项实质性偏离`,
      },
    };
  }
}
