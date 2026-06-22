'use client';

import React from 'react';
import { Assessment, SourceLocation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatCurrency,
  getCountdownDisplay,
  getCountdownColor,
  getRiskLevelColor,
  getRecommendationLabel,
  getRecommendationColor,
} from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AssessmentDisplayProps {
  assessment: Assessment;
}

function SourceBadge({ source }: { source?: SourceLocation }) {
  if (!source) return null;
  return (
    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-start space-x-2">
      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span className="break-all">{source}</span>
    </div>
  );
}

function InfoItem({ label, value, source }: { label: string; value: string; source?: SourceLocation }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value || '招标文件未提及'}</div>
      <SourceBadge source={source} />
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

export function AssessmentDisplay({ assessment }: AssessmentDisplayProps) {
  const risks = assessment.risks || [];
  const riskCounts = {
    critical: risks.filter((r) => r.level === 'critical').length,
    high: risks.filter((r) => r.level === 'high').length,
    medium: risks.filter((r) => r.level === 'medium').length,
    low: risks.filter((r) => r.level === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* 项目概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">预算金额</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(assessment.budget)}
            </div>
            <SourceBadge source={assessment.financialInfo._source?.budget} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">开标倒计时</div>
            <div className={`text-2xl font-bold ${getCountdownColor(assessment.bidOpeningTime) === 'red' ? 'text-red-600' : getCountdownColor(assessment.bidOpeningTime) === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
              {getCountdownDisplay(assessment.bidOpeningTime)}
            </div>
            <SourceBadge source={assessment.timeRequirements._source?.bidOpeningTime} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">风险等级</div>
            <Badge className={getRiskLevelColor(assessment.riskLevel)}>
              {assessment.riskLevel === 'critical' ? '严重' : assessment.riskLevel === 'high' ? '高' : assessment.riskLevel === 'medium' ? '中' : '低'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">投标建议</div>
            <Badge className={getRecommendationColor(assessment.recommendation)}>
              {getRecommendationLabel(assessment.recommendation)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 风险概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            风险概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm">
                <span className="font-bold text-red-600">{riskCounts.critical}</span> 严重风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-sm">
                <span className="font-bold text-orange-600">{riskCounts.high}</span> 高风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">
                <span className="font-bold text-yellow-600">{riskCounts.medium}</span> 中风险
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                <span className="font-bold text-green-600">{riskCounts.low}</span> 低风险
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7类信息 - 单页可折叠 */}
      <Section title="1. 基本信息" icon={<FileText className="h-5 w-5 text-blue-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="项目名称" value={assessment.basicInfo.projectName} source={assessment.basicInfo._source?.projectName} />
          <InfoItem label="项目编号" value={assessment.basicInfo.projectCode} source={assessment.basicInfo._source?.projectCode} />
          <InfoItem label="招标企业" value={assessment.basicInfo.tenderer} source={assessment.basicInfo._source?.tenderer} />
          <InfoItem label="联系人" value={assessment.basicInfo.contactPerson} source={assessment.basicInfo._source?.contactPerson} />
          <InfoItem label="联系电话" value={assessment.basicInfo.contactPhone} source={assessment.basicInfo._source?.contactPhone} />
          <InfoItem label="代理机构" value={assessment.basicInfo.agency} source={assessment.basicInfo._source?.agency} />
          <InfoItem label="信息来源" value={assessment.basicInfo.informationSource} source={assessment.basicInfo._source?.informationSource} />
          <InfoItem label="CA需求" value={assessment.basicInfo.caRequirement} source={assessment.basicInfo._source?.caRequirement} />
          <InfoItem label="开标方式" value={assessment.basicInfo.bidOpeningMethod} source={assessment.basicInfo._source?.bidOpeningMethod} />
          <InfoItem label="开标地点" value={assessment.basicInfo.bidOpeningLocation} source={assessment.basicInfo._source?.bidOpeningLocation} />
          <InfoItem label="如何报名" value={assessment.basicInfo.registrationMethod} source={assessment.basicInfo._source?.registrationMethod} />
          <InfoItem label="项目地点" value={assessment.basicInfo.location} source={assessment.basicInfo._source?.location} />
        </div>
      </Section>

      <Section title="2. 财务信息" icon={<FileText className="h-5 w-5 text-green-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="资金来源" value={assessment.financialInfo.fundingSource} source={assessment.financialInfo._source?.fundingSource} />
          <InfoItem label="预算金额" value={formatCurrency(assessment.financialInfo.budget)} source={assessment.financialInfo._source?.budget} />
          <InfoItem label="最高限价" value={formatCurrency(assessment.financialInfo.maxPrice)} source={assessment.financialInfo._source?.maxPrice} />
          <InfoItem label="预先投资金额" value={formatCurrency(assessment.financialInfo.preInvestment)} source={assessment.financialInfo._source?.preInvestment} />
          <InfoItem label="付款方式" value={assessment.financialInfo.paymentMethod} source={assessment.financialInfo._source?.paymentMethod} />
          <InfoItem label="标书费" value={formatCurrency(assessment.financialInfo.bidDocumentFee)} source={assessment.financialInfo._source?.bidDocumentFee} />
          <InfoItem label="投标保证金" value={formatCurrency(assessment.financialInfo.bidBond)} source={assessment.financialInfo._source?.bidBond} />
          <InfoItem label="履约保证金" value={formatCurrency(assessment.financialInfo.performanceBond)} source={assessment.financialInfo._source?.performanceBond} />
          <InfoItem label="质量保证金" value={formatCurrency(assessment.financialInfo.qualityBond)} source={assessment.financialInfo._source?.qualityBond} />
          <InfoItem label="保密保证金" value={formatCurrency(assessment.financialInfo.confidentialityBond)} source={assessment.financialInfo._source?.confidentialityBond} />
          <InfoItem label="代理费" value={formatCurrency(assessment.financialInfo.agencyFee)} source={assessment.financialInfo._source?.agencyFee} />
        </div>
      </Section>

      <Section title="3. 资质要求" icon={<CheckCircle className="h-5 w-5 text-purple-500" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="联合体投标" value={assessment.qualificationRequirements[0]?.jointBid ? '允许' : '不允许'} source={assessment.qualificationRequirements[0]?._source?.jointBid} />
            <InfoItem label="分包转包" value={assessment.qualificationRequirements[0]?.subcontracting ? '允许' : '不允许'} source={assessment.qualificationRequirements[0]?._source?.subcontracting} />
            <InfoItem label="企业规模要求" value={assessment.qualificationRequirements[0]?.companyScaleReq} source={assessment.qualificationRequirements[0]?._source?.companyScaleReq} />
            <InfoItem label="政策优惠" value={assessment.qualificationRequirements[0]?.policyBenefits} source={assessment.qualificationRequirements[0]?._source?.policyBenefits} />
          </div>
          {assessment.qualificationRequirements.map((q) => (
            <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{q.name}</div>
              <div className="text-sm text-gray-600 mt-1">{q.description}</div>
              {q.specialQualification && (
                <div className="text-sm mt-2"><span className="font-medium">特别资质：</span>{q.specialQualification}</div>
              )}
              {q.specialPersonnelReq && (
                <div className="text-sm"><span className="font-medium">人员要求：</span>{q.specialPersonnelReq}</div>
              )}
              {q.creditRequirements && (
                <div className="text-sm"><span className="font-medium">信用要求：</span>{q.creditRequirements}</div>
              )}
              {q.qualificationReview && (
                <div className="text-sm"><span className="font-medium">资格性审查：</span>{q.qualificationReview}</div>
              )}
              {q.complianceReview && (
                <div className="text-sm"><span className="font-medium">符合性审查：</span>{q.complianceReview}</div>
              )}
              <SourceBadge source={q._source?.name || q._source?.description} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="4. 评分规则" icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-blue-600">总分</div>
              <div className="text-2xl font-bold text-blue-700">{assessment.scoringRules.totalScore}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-green-600">商务分</div>
              <div className="text-2xl font-bold text-green-700">{assessment.scoringRules.commercialScore}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-purple-600">技术分</div>
              <div className="text-2xl font-bold text-purple-700">{assessment.scoringRules.technicalScore}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-sm text-orange-600">价格分</div>
              <div className="text-2xl font-bold text-orange-700">{assessment.scoringRules.priceScore}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <InfoItem label="中标方式" value={assessment.scoringRules.winningMethod} source={assessment.scoringRules._source?.winningMethod} />
            <InfoItem label="评标方式" value={assessment.scoringRules.evaluationMethod} source={assessment.scoringRules._source?.evaluationMethod} />
            <InfoItem label="客观/主观比例" value={assessment.scoringRules.objectiveSubjectiveRatio} source={assessment.scoringRules._source?.objectiveSubjectiveRatio} />
            <InfoItem label="废标说明" value={assessment.scoringRules.voidBidExplanation} source={assessment.scoringRules._source?.voidBidExplanation} />
            <InfoItem label="评分特别要求" value={assessment.scoringRules.specialScoringRequirements} source={assessment.scoringRules._source?.specialScoringRequirements} />
          </div>

          {assessment.scoringRules.requiredCompanyCertificates.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">需要企业资质证书：</div>
              <div className="flex flex-wrap gap-2">
                {assessment.scoringRules.requiredCompanyCertificates.map((cert, i) => (
                  <Badge key={i} variant="outline">{cert}</Badge>
                ))}
              </div>
            </div>
          )}

          {assessment.scoringRules.requiredPersonnelCertificates.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">需要人员证书：</div>
              <div className="flex flex-wrap gap-2">
                {assessment.scoringRules.requiredPersonnelCertificates.map((cert, i) => (
                  <Badge key={i} variant="outline">{cert}</Badge>
                ))}
              </div>
            </div>
          )}

          {assessment.scoringRules.requiredProductReports.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">需要产品检测报告：</div>
              <div className="flex flex-wrap gap-2">
                {assessment.scoringRules.requiredProductReports.map((report, i) => (
                  <Badge key={i} variant="outline">{report}</Badge>
                ))}
              </div>
            </div>
          )}

          {assessment.scoringRules.items.length > 0 && (
            <div>
              <div className="font-medium mb-3">评分项明细：</div>
              <div className="space-y-2">
                {assessment.scoringRules.items.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-blue-600">{item.maxScore}分</div>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                    <SourceBadge source={item._source} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="5. 时间要求" icon={<Clock className="h-5 w-5 text-red-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="获取招标文件截止时间" value={assessment.timeRequirements.documentAcquisitionDeadline} source={assessment.timeRequirements._source?.documentAcquisitionDeadline} />
          <InfoItem label="标前提问截止时间" value={assessment.timeRequirements.preBidQuestionDeadline} source={assessment.timeRequirements._source?.preBidQuestionDeadline} />
          <InfoItem label="开标时间" value={assessment.timeRequirements.bidOpeningTime} source={assessment.timeRequirements._source?.bidOpeningTime} />
          <InfoItem label="中标交货时间" value={assessment.timeRequirements.winningDeliveryTime} source={assessment.timeRequirements._source?.winningDeliveryTime} />
          <InfoItem label="合同履约期限" value={assessment.timeRequirements.contractPerformancePeriod} source={assessment.timeRequirements._source?.contractPerformancePeriod} />
        </div>
      </Section>

      <Section title="6. 项目信息" icon={<FileText className="h-5 w-5 text-indigo-500" />}>
        <div className="space-y-4">
          <InfoItem label="实质性要求(▲★※)" value={assessment.projectInfo.substantialRequirements} source={assessment.projectInfo._source?.substantialRequirements} />
          <InfoItem label="偏离结果" value={assessment.projectInfo.deviationResult} source={assessment.projectInfo._source?.deviationResult} />
          <InfoItem label="图纸情况" value={assessment.projectInfo.drawingsProvided} source={assessment.projectInfo._source?.drawingsProvided} />
          <InfoItem label="图纸清单" value={assessment.projectInfo.drawingList} source={assessment.projectInfo._source?.drawingList} />
          <InfoItem label="图纸深度要求" value={assessment.projectInfo.drawingDepthRequirement} source={assessment.projectInfo._source?.drawingDepthRequirement} />
          <InfoItem label="现场踏勘" value={assessment.projectInfo.siteSurveyRequired} source={assessment.projectInfo._source?.siteSurveyRequired} />
          <InfoItem label="控标点" value={assessment.projectInfo.controlPoints} source={assessment.projectInfo._source?.controlPoints} />
          <InfoItem label="商务要求" value={assessment.projectInfo.businessRequirements} source={assessment.projectInfo._source?.businessRequirements} />
          <InfoItem label="技术需求" value={assessment.projectInfo.technicalRequirements} source={assessment.projectInfo._source?.technicalRequirements} />
          <InfoItem label="核心服务要求" value={assessment.projectInfo.coreServiceRequirements} source={assessment.projectInfo._source?.coreServiceRequirements} />
          <InfoItem label="项目成果要求" value={assessment.projectInfo.projectOutcomeRequirements} source={assessment.projectInfo._source?.projectOutcomeRequirements} />
          <InfoItem label="最终交付" value={assessment.projectInfo.finalDelivery} source={assessment.projectInfo._source?.finalDelivery} />
          <InfoItem label="密封包装盖章要求" value={assessment.projectInfo.sealingRequirements} source={assessment.projectInfo._source?.sealingRequirements} />
          <InfoItem label="验收要求" value={assessment.projectInfo.acceptanceRequirements} source={assessment.projectInfo._source?.acceptanceRequirements} />
        </div>
      </Section>

      <Section title="7. 电话问题" icon={<Phone className="h-5 w-5 text-yellow-500" />} defaultOpen={assessment.phoneQuestions.length > 0}>
        <div className="space-y-3">
          {assessment.phoneQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无需要电话确认的问题</p>
            </div>
          ) : (
            assessment.phoneQuestions.map((q) => (
              <div key={q.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="font-medium text-yellow-800">📞 {q.question}</div>
                <SourceBadge source={q._source} />
              </div>
            ))
          )}
        </div>
      </Section>

      {/* 风险清单 */}
      {risks.length > 0 && (
        <Section title="风险清单" icon={<AlertTriangle className="h-5 w-5 text-red-500" />}>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className={`p-4 rounded-lg border-l-4 ${
                  risk.level === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : risk.level === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : risk.level === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{risk.description}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">建议：</span>{risk.suggestion}
                    </div>
                    <SourceBadge source={risk._sourceLocation} />
                  </div>
                  <Badge className={getRiskLevelColor(risk.level)}>
                    {risk.level === 'critical' ? '严重' : risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 准备清单 */}
      {assessment.checklist && assessment.checklist.length > 0 && (
        <Section title="准备清单" icon={<CheckCircle className="h-5 w-5 text-green-500" />}>
          <div className="space-y-2">
            {assessment.checklist.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {item.status === 'prepared' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : item.status === 'missing' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <div>
                      <span className="font-medium">{item.item}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.category})</span>
                      {item.scoreWeight > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">{item.scoreWeight}分</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.required && (
                      <Badge variant="destructive" className="text-xs">必须</Badge>
                    )}
                    <span className="text-sm text-gray-500">{item.source}</span>
                  </div>
                </div>
                <SourceBadge source={item._sourceLocation} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
