import { RuleViolation } from './types';
import { BlockLog, SubstantialDeviation } from './substantial-deviation';

export interface EvidenceChain {
  id: string;
  timestamp: Date;
  projectId: string;
  userId: string;
  tenderAnalysisId: string;
  bidAnalysisId: string;
  violations: RuleViolation[];
  deviations: SubstantialDeviation[];
  userActions: UserAction[];
  systemActions: SystemAction[];
}

export interface UserAction {
  actionId: string;
  timestamp: Date;
  actionType: 'confirm' | 'cancel' | 'modify' | 'submit';
  description: string;
  metadata?: Record<string, unknown>;
}

export interface SystemAction {
  actionId: string;
  timestamp: Date;
  actionType: 'block' | 'warn' | 'log' | 'notify';
  description: string;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

export class BlockLogManager {
  // 注意：当前使用内存存储，Serverless环境下数据不持久化且实例间不共享
  // 生产环境需将BlockLog和EvidenceChain持久化到数据库
  private logs: Map<string, BlockLog> = new Map();
  private evidenceChains: Map<string, EvidenceChain> = new Map();

  createBlockLog(
    projectId: string,
    userId: string,
    violations: RuleViolation[],
    deviations: SubstantialDeviation[],
    tenderAnalysisId: string,
    bidAnalysisId: string
  ): BlockLog {
    const blockLog: BlockLog = {
      blockId: `BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      projectId,
      deviationItems: deviations,
      evidenceChain: {
        tenderAnalysisId,
        bidAnalysisId,
        riskAssessment: deviations.length > 0 ? 'critical' : 'high',
        blockLog: `系统检测到${violations.length}项违规，${deviations.length}项实质性偏离`,
      },
    };

    this.logs.set(blockLog.blockId, blockLog);

    const evidenceChain = this.createEvidenceChain(
      projectId,
      userId,
      violations,
      deviations,
      tenderAnalysisId,
      bidAnalysisId
    );
    this.evidenceChains.set(evidenceChain.id, evidenceChain);

    return blockLog;
  }

  private createEvidenceChain(
    projectId: string,
    userId: string,
    violations: RuleViolation[],
    deviations: SubstantialDeviation[],
    tenderAnalysisId: string,
    bidAnalysisId: string
  ): EvidenceChain {
    return {
      id: `EVIDENCE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      projectId,
      userId,
      tenderAnalysisId,
      bidAnalysisId,
      violations,
      deviations,
      userActions: [],
      systemActions: [
        {
          actionId: `SYS_${Date.now()}`,
          timestamp: new Date(),
          actionType: 'block',
          description: `系统自动拦截${deviations.length}项实质性偏离`,
          metadata: {
            violationCount: violations.length,
            deviationCount: deviations.length,
          },
        },
      ],
    };
  }

  addUserAction(
    evidenceChainId: string,
    actionType: UserAction['actionType'],
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    const chain = this.evidenceChains.get(evidenceChainId);
    if (chain) {
      chain.userActions.push({
        actionId: `USER_${Date.now()}`,
        timestamp: new Date(),
        actionType,
        description,
        metadata,
      });
    }
  }

  addSystemAction(
    evidenceChainId: string,
    actionType: SystemAction['actionType'],
    description: string,
    ruleId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const chain = this.evidenceChains.get(evidenceChainId);
    if (chain) {
      chain.systemActions.push({
        actionId: `SYS_${Date.now()}`,
        timestamp: new Date(),
        actionType,
        description,
        ruleId,
        metadata,
      });
    }
  }

  getBlockLog(blockId: string): BlockLog | undefined {
    return this.logs.get(blockId);
  }

  getEvidenceChain(evidenceChainId: string): EvidenceChain | undefined {
    return this.evidenceChains.get(evidenceChainId);
  }

  getBlockLogsByProject(projectId: string): BlockLog[] {
    return Array.from(this.logs.values()).filter((log) => log.projectId === projectId);
  }

  getEvidenceChainsByProject(projectId: string): EvidenceChain[] {
    return Array.from(this.evidenceChains.values()).filter(
      (chain) => chain.projectId === projectId
    );
  }

  exportEvidenceChain(evidenceChainId: string): string {
    const chain = this.evidenceChains.get(evidenceChainId);
    if (!chain) {
      return '';
    }

    return JSON.stringify(chain, null, 2);
  }

  exportBlockLog(blockId: string): string {
    const log = this.logs.get(blockId);
    if (!log) {
      return '';
    }

    return JSON.stringify(log, null, 2);
  }
}
