import { ThresholdConfig } from './types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  version: '2.0',
  lastUpdated: '2026-06-27',
  thresholds: {
    percentage: {
      bidBondMax: 2,
      performanceBondMax: 10,
      contractAdditionMax: 10,
      unbalancedBidThreshold: 30,
      priceDifferenceThreshold: 2,
    },
    time: {
      tenderDocumentSalePeriod: 5,
      bidDeadline: 20,
      engineeringObjectionPeriod: 3,
      procurementQuestionPeriod: 7,
      engineeringComplaintPeriod: 10,
      procurementComplaintPeriod: 15,
    },
    quantity: {
      bidDocumentErrorCount: 2,
      mandatoryBiddingCommitteeMin: 5,
      nonMandatoryBiddingCommitteeMin: 3,
    },
    similarity: {
      technicalDocumentSimilarity: 70,
    },
    confidence: {
      aiSemanticAnalysis: 0.75,
    },
  },
};
