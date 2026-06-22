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
  budget: number;
  maxPrice: number;
  preInvestment: number;
  paymentMethod: string;
  bidDocumentFee: number;
  bidBond: number;
  performanceBond: number;
  qualityBond: number;
  confidentialityBond: number;
  agencyFee: number;
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
  commercialScore: number;
  technicalScore: number;
  priceScore: number;
  winningMethod: string;
  evaluationMethod: string;
  objectiveSubjectiveRatio: string;
  voidBidExplanation: string;
  specialScoringRequirements: string;
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
  acceptanceRequirements: string;
  _source: Record<string, SourceLocation>;
}

export interface PhoneQuestion {
  id: string;
  question: string;
  answer?: string;
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
