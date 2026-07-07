export interface ParsedDocument {
  title: string;
  content: string;
  tables: TableData[];
  metadata: DocumentMetadata;
}

export interface TableData {
  name: string;
  headers: string[];
  rows: string[][];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount?: number;
  createdAt?: Date;
}

export type SourceLocation = string;

export interface SoftRejectionItem {
  ruleId: string;
  ruleName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  triggered: boolean;
  message: string;
  suggestion?: string;
}

export interface HardRejectionItem {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  message: string;
  suggestion?: string;
}

export interface RiskAggregation {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  hardRejections: HardRejectionItem[];
  softRejections: SoftRejectionItem[];
  riskScore: number;
  recommendation: 'bid' | 'caution' | 'no-bid';
  topRisks: Array<{
    ruleId: string;
    ruleName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    weight: number;
    message: string;
  }>;
}

export interface Assessment {
  id: string;
  projectId: string;
  projectName: string;
  budget: number;
  deadline: Date;
  bidOpeningTime: Date;
  queryDeadline: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'bid' | 'caution' | 'no-bid';
  basicInfo: BasicInfo;
  financialInfo: FinancialInfo;
  qualificationRequirements: QualificationRequirement[];
  scoringRules: ScoringRules;
  timeRequirements: TimeRequirements;
  projectInfo: ProjectInfo;
  phoneQuestions: PhoneQuestion[];
  risks: RiskItem[];
  tasks: TaskItem[];
  checklist: ChecklistItem[];
  riskAggregation?: RiskAggregation;
  createdAt: Date;
}

export interface BasicInfo {
  projectName: string;
  projectCode: string;
  tenderer: string;
  contactPerson: string;
  contactPhone: string;
  agency: string;
  informationSource: string;
  caRequirement: string;
  bidOpeningMethod: string;
  bidOpeningLocation: string;
  registrationMethod: string;
  location: string;
  _source: Record<string, SourceLocation>;
}

export interface FinancialInfo {
  fundingSource: string;
  budget: number | string;
  maxPrice: number | string;
  preInvestment: number | string;
  paymentMethod: string;
  bidDocumentFee: number | string;
  bidBond: number | string;
  performanceBond: number | string;
  qualityBond: number | string;
  confidentialityBond: number | string;
  agencyFee: number | string;
  _source: Record<string, SourceLocation>;
}

export interface QualificationRequirement {
  id: string;
  name: string;
  description: string;
  isSubstantial: boolean;
  isRequired: boolean;
  ourCapability: 'met' | 'partial' | 'not-met' | 'unknown';
  jointBid: boolean;
  subcontracting: boolean;
  companyScaleReq: string;
  specialQualification: string;
  specialPersonnelReq: string;
  specialNotes: string;
  policyBenefits: string;
  qualificationReview: string;
  complianceReview: string;
  creditRequirements: string;
  _source: Record<string, SourceLocation>;
}

export interface ScoringRules {
  totalScore: number;
  objectiveScore: number;
  subjectiveScore: number;
  priceScore: number;
  commercialScore: number;
  technicalScore: number;
  winningMethod: string;
  evaluationMethod: string;
  objectiveSubjectiveRatio: string;
  voidBidExplanation: string;
  specialScoringRequirements: string;
  priceScoreDetail: string;
  commercialScoreDetail: string;
  technicalScoreDetail: string;
  items: ScoringItem[];
  requiredCompanyCertificates: string[];
  requiredPersonnelCertificates: string[];
  requiredProductReports: string[];
  _source: Record<string, SourceLocation>;
}

export interface ScoringItem {
  id: string;
  category: string;
  name: string;
  maxScore: number;
  description: string;
  calculationMethod?: string;
  _source?: SourceLocation;
}

export interface TimeRequirements {
  documentAcquisitionDeadline: string;
  preBidQuestionDeadline: string;
  bidOpeningTime: string;
  winningDeliveryTime: string;
  contractPerformancePeriod: string;
  _source: Record<string, SourceLocation>;
}

export interface ProjectInfo {
  substantialRequirements: string;
  deviationResult: string;
  drawingsProvided: string;
  drawingList: string;
  drawingDepthRequirement: string;
  siteSurveyRequired: string;
  siteSurveyConfirmation: string;
  controlPoints: string;
  businessRequirements: string;
  technicalRequirements: string;
  coreServiceRequirements: string;
  projectOutcomeRequirements: string;
  finalDelivery: string;
  specialProjectPoints: string;
  originalCopies: string;
  bidSubmissionMarking: string;
  sealingRequirements: string;
  packagingRequirements: string;
  stampingRequirements: string;
  signatureRequirements: string;
  acceptanceRequirements: string;
  _source: Record<string, SourceLocation>;
}

export interface PhoneQuestion {
  id: string;
  question: string;
  answer?: string;
  reason?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: '技术' | '商务' | '流程' | '资质' | '其他';
  _source?: SourceLocation;
}

export interface RiskItem {
  id: string;
  category: 'void' | 'score' | 'time' | 'qualification' | 'price' | 'other';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  impact: string;
  suggestion: string;
  _sourceLocation?: SourceLocation;
}

export interface TaskItem {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'required';
  deadline?: Date;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
  status: 'pending' | 'prepared' | 'missing';
  source: string;
  scoreWeight: number;
  note: string;
  _sourceLocation?: SourceLocation;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ==================== 新增：老板总结 ====================
export interface BossSummary {
  // 通用字段
  projectName: string;
  budget: string;
  scoringStructure: {
    technical: number;
    commercial: number;
    price: number;
  };
  
  // 免费版字段
  qualificationStatus: string;
  riskCount: number;
  checklistCount: number;
  questionCount: number;
  
  // 付费版字段
  conclusion?: string;
  conclusionLevel?: 'A' | 'B' | 'C' | 'D';
  conclusionScore?: number;
  keyWarnings?: string[];
  preparationFocus?: string[];
}

// ==================== 新增：深度诊断结果 ====================
export interface DeepDiagnosisResult {
  // 统计数据（免费版）
  summary: {
    scoringFactors: number;
    qualificationRequirements: number;
    technicalRequirements: number;
    phoneQuestions: number;
  };
  
  // 详细内容（付费版）
  details?: {
    voidRisk: VoidRiskItem[];
    scoringKeyItems: ScoringKeyItem[];
    easyToLosePoints: EasyToLosePointItem[];
    phoneConsultationQuestions: PhoneConsultationQuestion[];
    bidSuggestion: BidSuggestion;
    preparationChecklist: PreparationChecklist;
  };
}

export interface VoidRiskItem {
  id: string;
  type: 'substantial-deviation' | 'missing-qualification';
  name: string;
  description: string;
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
  customerStatus?: string;
  expiryDate?: string;
  remainingDays?: number;
}

export interface ScoringKeyItem {
  id: string;
  name: string;
  maxScore: number;
  description: string;
  keyPoints: string[];
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
  customerStatus?: string;
  suggestion?: string;
}

export interface EasyToLosePointItem {
  id: string;
  category: string;
  description: string;
  risk: string;
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
}

export interface PhoneConsultationQuestion {
  id: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  category: '技术' | '商务';
  reason: string;
}

// ==================== 新增：投标建议（条件化） ====================
export interface BidSuggestion {
  available: boolean;
  reason?: string;
  level?: 'A' | 'B' | 'C' | 'D';
  label?: string;
  score?: number;
  color?: string;
  reasons?: string[];
  keyPreparations?: string[];
  riskWarnings?: string[];
  conditionalSuggestion?: string;
  scoreBreakdown?: {
    qualificationMatch: number;
    performanceMatch: number;
    technicalFeasibility: number;
    priceCompetitiveness: number;
    teamConfiguration: number;
  };
}

// ==================== 新增：准备分工项目包（含页码） ====================
export interface PreparationChecklist {
  categories: PreparationCategory[];
  totalItems: number;
  completedItems: number;
}

export interface PreparationCategory {
  id: string;
  name: string;
  items: PreparationItem[];
}

export interface PreparationItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'prepared' | 'missing' | 'not-applicable';
  assignee?: string;
  deadline?: string;
  note?: string;
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
  scoreWeight?: number;
  提供方?: string;
  performanceRequirements?: {
    contractKeyPage: boolean;
    acceptanceReport: boolean;
    paymentScreenshot: boolean;
    customerFeedback: boolean;
    otherDocuments?: string[];
  };
}

// ==================== 新增：客观分≤35分提示 ====================
export interface ObjectiveScoreWarning {
  triggered: boolean;
  condition: {
    objectiveScore: number;
    threshold: number;
  };
  analysis: {
    priceScore: number;
    subjectiveScore: number;
    objectiveScore: number;
  };
  message: string;
  suggestion: string;
}

// ==================== 新增：服务期限分析（分版本） ====================
export interface ServicePeriodAnalysis {
  tenderRequirement: {
    period: string;
    source: string;
    sourcePage: string;
    isSubstantial: boolean;
    riskLevel: string;
  };
  bidAnalysis: {
    proposedPeriod: string;
    deviation: boolean;
    deviationType: string;
    riskLevel: string;
    suggestion: string;
  } | null;
}

// ==================== 新增：资质检查项 ====================
export interface QualificationCheckItem {
  id: string;
  category: 'qualification' | 'performance' | 'social-security' | 'financial' | 'personnel';
  name: string;
  description: string;
  source: string;
  sourcePage: {
    systemPage: string;
    contentPage: string;
  };
  isRequired: boolean;
  deadline?: string;
  customerHas?: boolean;
  customerExpiry?: string;
  isExpired?: boolean;
  isComplete: boolean;
  missingReason?: string;
}

export interface QualificationCheckResult {
  isComplete: boolean;
  totalItems: number;
  completedItems: number;
  missingItems: QualificationCheckItem[];
  expiringItems: QualificationCheckItem[];
  checkList: QualificationCheckItem[];
}
