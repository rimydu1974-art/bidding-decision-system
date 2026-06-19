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
  qualificationRequirements: QualificationRequirement[];
  scoringRules: ScoringRules;
  risks: RiskItem[];
  scorePoints: ScorePoint[];
  tasks: TaskItem[];
  technicalResponse: TechnicalResponse[];
  createdAt: Date;
}

export interface BasicInfo {
  projectName: string;
  projectCode: string;
  tenderer: string;
  contactPerson: string;
  contactPhone: string;
  budget: number;
  bidDeadline: Date;
  bidOpeningTime: Date;
  queryDeadline: Date;
  location: string;
}

export interface QualificationRequirement {
  id: string;
  name: string;
  description: string;
  isSubstantial: boolean;
  isRequired: boolean;
  ourCapability: 'met' | 'partial' | 'not-met' | 'unknown';
}

export interface ScoringRules {
  totalScore: number;
  commercialScore: number;
  technicalScore: number;
  priceScore: number;
  items: ScoringItem[];
}

export interface ScoringItem {
  id: string;
  category: string;
  name: string;
  maxScore: number;
  description: string;
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
}

export interface ScorePoint {
  id: string;
  category: string;
  name: string;
  maxScore: number;
  description: string;
  isImportant: boolean;
}

export interface TaskItem {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'required';
  deadline?: Date;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TechnicalResponse {
  id: string;
  requirement: string;
  response: string;
  isCompliant: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  evidence?: string;
  note?: string;
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
