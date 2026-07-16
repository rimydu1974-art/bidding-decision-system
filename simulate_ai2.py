# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 读取招标文件内容
with open(r'C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\招标文件内容.txt', 'r', encoding='utf-8') as f:
    content = f.read()

assessment = {
    "basicInfo": {
        "projectName": "杭州市文化两中心非遗数字展陈内容制作及配套项目",
        "projectCode": "330100261190070000013-CTZB-2026040109",
        "tenderer": "杭州市文化广电旅游局",
        "contactPerson": "招标文件未提及",
        "contactPhone": "招标文件未提及",
        "agency": "浙江省成套招标代理有限公司",
        "informationSource": "浙江省政府采购网",
        "caRequirement": "需办理CA数字证书",
        "bidOpeningMethod": "现场开标",
        "bidOpeningLocation": "招标文件未明确具体地点",
        "registrationMethod": "网上报名",
        "location": "杭州市"
    },
    "financialInfo": {
        "fundingSource": "财政拨款",
        "budget": 5939000,
        "maxPrice": 5820000,
        "preInvestment": "招标文件未提及",
        "paymentMethod": "招标文件未明确付款方式",
        "bidDocumentFee": "招标文件未提及",
        "bidBond": "招标文件未提及",
        "performanceBond": "招标文件未提及",
        "qualityBond": "招标文件未提及",
        "confidentialityBond": "招标文件未提及",
        "agencyFee": "招标文件未提及"
    },
    "qualificationRequirements": [
        {
            "name": "基本资格要求",
            "description": "符合《政府采购法》第二十二条规定",
            "isSubstantial": True,
            "isRequired": True,
            "jointBid": True,
            "subcontracting": "同意将非主体、非关键性的临时工作分包",
            "companyScaleReq": "招标文件未明确",
            "specialQualification": "招标文件未提及特殊资质要求",
            "specialPersonnelReq": "招标文件未明确",
            "creditRequirements": "通过信用中国网站和中国政府采购网查询信用记录",
            "qualificationReview": "资格性审查",
            "complianceReview": "符合性审查"
        }
    ],
    "scoringRules": {
        "totalScore": 100,
        "commercialScore": 0,
        "technicalScore": 42,
        "priceScore": 0,
        "winningMethod": "综合评分法",
        "evaluationMethod": "综合评估法",
        "objectiveSubjectiveRatio": "客观分42分",
        "voidBidExplanation": "投标有效期少于90天的投标无效；未按要求提供节能产品认证证书的投标无效",
        "specialScoringRequirements": "需提供演示视频和样片",
        "requiredCompanyCertificates": ["节能产品认证证书（如适用）"],
        "requiredPersonnelCertificates": "招标文件未明确",
        "requiredProductReports": "招标文件未提及",
        "scoringItems": [
            {"category": "商务", "name": "类似业绩", "maxScore": 1, "description": "2021年1月以来承接过类似多媒体、数字类影片内容制作项目业绩", "calculationMethod": "每提供1份业绩合同得1分，最多得1分"},
            {"category": "技术", "name": "项目整体服务技术指标及功能响应程度", "maxScore": 20, "description": "完全满足采购要求得满分；标★项负偏离每项扣3分；一般技术参数负偏离每项扣1分", "calculationMethod": "根据技术参数响应情况评分"},
            {"category": "技术", "name": "演示讲解", "maxScore": 21, "description": "整体演示说明及讲解视频，时间控制在15分钟以内", "calculationMethod": "专家评审打分"}
        ]
    },
    "timeRequirements": {
        "documentAcquisitionDeadline": "招标文件未明确获取截止时间",
        "preBidQuestionDeadline": "招标文件未明确提问截止时间",
        "bidOpeningTime": "2026年5月8日09点30分00秒（北京时间）",
        "winningDeliveryTime": "项目实施期计划1年",
        "contractPerformancePeriod": "自合同签订之日起至通过项目验收及整体项目基础售后服务期满之日止，基础售后服务期不少于12个月"
    },
    "projectInfo": {
        "substantialRequirements": "标★项为重要服务要求或配套产品技术参数，如有负偏离每项扣3分",
        "deviationResult": "标★项负偏离可能导致较大扣分",
        "drawingsProvided": "招标文件未提及",
        "siteSurveyRequired": "招标文件未提及",
        "controlPoints": "7个展项的数字展示内容制作及配套硬件设备",
        "businessRequirements": "需提供演示视频和样片",
        "technicalRequirements": "7个展项：二十四节气互动展项、杭州非遗综述展项、古琴艺术展项、径山茶宴展项、西湖龙井展项、酒缸里的秘密展项、非遗正青春互动展项",
        "coreServiceRequirements": "数字展陈内容制作及配套硬件设备供货、安装、调试",
        "sealingRequirements": "招标文件未明确密封要求",
        "acceptanceRequirements": "招标文件未明确验收标准"
    },
    "phoneQuestions": [
        {
            "question": "演示视频的具体评分标准是什么？15分钟讲解视频需要包含哪些具体内容？",
            "reason": "招标文件提到需要演示但评分细则未详细说明",
            "priority": "high",
            "category": "技术"
        },
        {
            "question": "7个展项的技术参数中标★项具体有哪些？需要提供哪些检测报告？",
            "reason": "招标文件提到标★项扣分但未列出具体哪些是标★项",
            "priority": "high",
            "category": "技术"
        },
        {
            "question": "联合体投标的具体要求是什么？两家单位的分工如何确定？",
            "reason": "招标文件接受联合体但未说明具体要求",
            "priority": "medium",
            "category": "资质"
        },
        {
            "question": "投标保证金的金额和缴纳方式是什么？",
            "reason": "招标文件未提及投标保证金要求",
            "priority": "medium",
            "category": "商务"
        },
        {
            "question": "类似业绩的认定标准是什么？是否必须是政府项目？",
            "reason": "评分标准提到类似业绩但未明确认定标准",
            "priority": "medium",
            "category": "商务"
        },
        {
            "question": "项目实施期1年的具体时间节点如何安排？",
            "reason": "服务期描述较笼统，需确认具体实施计划",
            "priority": "low",
            "category": "流程"
        }
    ],
    "risks": [
        {
            "category": "score",
            "level": "high",
            "title": "技术分占比高（42分）",
            "description": "技术分占42分，需要详细的技术方案和演示",
            "source": "招标文件评分标准",
            "impact": "技术方案质量直接影响中标",
            "suggestion": "投入足够资源编写高质量技术方案和制作演示视频"
        },
        {
            "category": "qualification",
            "level": "medium",
            "title": "需提供节能产品认证证书",
            "description": "未按要求提供节能产品认证证书将导致投标无效",
            "source": "招标文件支持绿色发展条款",
            "impact": "可能影响投标资格",
            "suggestion": "确认产品是否在节能清单内，提前办理认证"
        },
        {
            "category": "void",
            "level": "high",
            "title": "标★项负偏离扣分严重",
            "description": "标★项为重要技术参数，负偏离每项扣3分",
            "source": "招标文件评分标准",
            "impact": "可能导致较大失分",
            "suggestion": "逐一核对标★项技术参数，确保完全满足"
        },
        {
            "category": "time",
            "level": "medium",
            "title": "交付周期紧张",
            "description": "项目实施期计划1年，7个展项内容制作量大",
            "source": "招标文件服务期条款",
            "impact": "可能影响项目质量和进度",
            "suggestion": "提前做好项目实施计划，合理安排资源"
        }
    ],
    "checklist": [
        {"category": "商务文件", "item": "营业执照副本", "required": True, "status": "pending", "source": "基本资格要求", "scoreWeight": 0},
        {"category": "商务文件", "item": "类似业绩合同（2021年1月以来）", "required": True, "status": "pending", "source": "评分规则", "scoreWeight": 1},
        {"category": "技术文件", "item": "技术方案", "required": True, "status": "pending", "source": "评分规则", "scoreWeight": 20},
        {"category": "演示材料", "item": "15分钟讲解视频", "required": True, "status": "pending", "source": "评分规则", "scoreWeight": 21},
        {"category": "演示材料", "item": "成功样片", "required": True, "status": "pending", "source": "招标文件演示要求", "scoreWeight": 0},
        {"category": "演示材料", "item": "展陈样片", "required": True, "status": "pending", "source": "招标文件演示要求", "scoreWeight": 0},
        {"category": "资质文件", "item": "节能产品认证证书（如适用）", "required": True, "status": "pending", "source": "招标文件绿色发展条款", "scoreWeight": 0}
    ],
    "recommendation": "caution",
    "reasons": [
        "技术分占比高（42分），需要详细的技术方案和高质量演示视频",
        "7个展项内容制作量大，需合理安排项目实施计划",
        "标★项技术参数需逐一核对，确保完全满足",
        "需确认节能产品认证证书是否适用"
    ]
}

# 保存分析结果
output_path = r'C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\杭州非遗项目-评估结果.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(assessment, f, ensure_ascii=False, indent=2)

print(f'AI分析结果已保存: {output_path}')
print(f'\n评估概览:')
print(f'  项目名称: {assessment["basicInfo"]["projectName"]}')
print(f'  预算金额: {assessment["financialInfo"]["budget"]}')
print(f'  最高限价: {assessment["financialInfo"]["maxPrice"]}')
print(f'  投标建议: {assessment["recommendation"]}')
print(f'  需电话确认问题: {len(assessment["phoneQuestions"])}个')
print(f'  风险项: {len(assessment["risks"])}个')
print(f'  准备清单: {len(assessment["checklist"])}项')
