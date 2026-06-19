export const TENDER_ANALYSIS_PROMPT = `你是一位资深的投标专家和风险管理顾问。请分析以下招标文件内容，并生成结构化的投标决策评估。

## 分析要求

1. **基本信息提取**
   - 项目名称、项目编号
   - 招标人信息
   - 预算金额
   - 投标截止时间、开标时间
   - 质疑截止时间
   - 项目地点

2. **资质要求识别**
   - 列出所有资质要求
   - 标注是否为实质性要求（▲标记）
   - 标注是否为重要参数（★标记）

3. **评分规则解析**
   - 商务分占比
   - 技术分占比
   - 报价分计算方式
   - 各评分项具体要求

4. **风险识别**
   - 废标风险条款（实质性要求）
   - 得分风险条款（重要参数★）
   - 时间风险
   - 资质风险
   - 报价风险（如低于最高限价45%）

5. **投标建议**
   - 建议投/谨慎投/不建议投
   - 主要理由
   - 需要准备的重点材料

## 输出格式

请严格按照以下JSON格式输出，不要添加任何其他内容：

{
  "basicInfo": {
    "projectName": "项目名称",
    "projectCode": "项目编号",
    "tenderer": "招标人",
    "contactPerson": "联系人",
    "contactPhone": "联系电话",
    "budget": 0,
    "bidDeadline": "YYYY-MM-DD HH:mm",
    "bidOpeningTime": "YYYY-MM-DD HH:mm",
    "queryDeadline": "YYYY-MM-DD HH:mm",
    "location": "项目地点"
  },
  "qualificationRequirements": [
    {
      "id": "唯一标识",
      "name": "资质名称",
      "description": "资质描述",
      "isSubstantial": true,
      "isRequired": true,
      "ourCapability": "unknown"
    }
  ],
  "scoringRules": {
    "totalScore": 100,
    "commercialScore": 30,
    "technicalScore": 50,
    "priceScore": 20,
    "items": [
      {
        "id": "唯一标识",
        "category": "商务/技术/价格",
        "name": "评分项名称",
        "maxScore": 10,
        "description": "评分标准描述"
      }
    ]
  },
  "risks": [
    {
      "id": "唯一标识",
      "category": "void/score/time/qualification/price/other",
      "level": "low/medium/high/critical",
      "title": "风险标题",
      "description": "风险描述",
      "source": "来源条款",
      "impact": "影响说明",
      "suggestion": "建议措施"
    }
  ],
  "scorePoints": [
    {
      "id": "唯一标识",
      "category": "商务/技术",
      "name": "得分点名称",
      "maxScore": 10,
      "description": "得分点描述",
      "isImportant": false
    }
  ],
  "tasks": [
    {
      "id": "唯一标识",
      "name": "任务名称",
      "status": "pending",
      "priority": "low/medium/high"
    }
  ],
  "technicalResponse": [
    {
      "id": "唯一标识",
      "requirement": "技术要求",
      "response": "响应说明",
      "isCompliant": "compliant/partial/non-compliant/not-applicable",
      "evidence": "佐证材料",
      "note": "备注"
    }
  ],
  "recommendation": "bid/caution/no-bid",
  "reasons": ["理由1", "理由2"],
  "keyMaterials": ["材料1", "材料2"]
}

## 招标文件内容

{document_content}`;

export const DEEP_ANALYSIS_PROMPT = `你是一位资深的投标专家。请基于以下招标文件内容，生成详细的投标决策深度分析报告。

## 分析维度

### 1. 项目概况分析
- 项目背景和目标
- 项目规模和复杂度
- 实施周期和关键节点

### 2. 竞争态势分析
- 潜在竞争对手分析
- 市场竞争程度
- 我方竞争优劣势

### 3. 技术方案建议
- 技术路线建议
- 创新点和亮点
- 技术风险及应对

### 4. 商务策略建议
- 报价策略
- 付款条件分析
- 合同风险提示

### 5. 准备清单
- 资质文件清单
- 业绩材料清单
- 人员配置清单
- 技术方案框架

## 输出格式

请生成一份结构化的深度分析报告，包含以上所有维度的详细分析。

## 招标文件内容

{document_content}`;

export const RISK_CHECK_PROMPT = `你是一位投标风险专家。请检查以下招标文件，识别所有潜在的废标风险和得分风险。

## 检查重点

1. **实质性要求（废标风险）**
   - 必须满足的资质条件
   - 必须提供的文件
   - 必须符合的技术参数

2. **重要参数（得分风险）**
   - 影响得分的关键指标
   - 可能影响排名的因素

3. **时间风险**
   - 截止时间是否充足
   - 是否有多个截止时间需要关注

4. **报价风险**
   - 最高限价
   - 最低限价
   - 报价计算方式

## 输出格式

{
  "voidRisks": [
    {
      "id": "唯一标识",
      "title": "风险标题",
      "description": "风险描述",
      "requirement": "具体要求",
      "impact": "废标后果",
      "suggestion": "应对建议"
    }
  ],
  "scoreRisks": [
    {
      "id": "唯一标识",
      "title": "风险标题",
      "description": "风险描述",
      "requirement": "具体要求",
      "impact": "得分影响",
      "suggestion": "应对建议"
    }
  ],
  "timeRisks": [
    {
      "id": "唯一标识",
      "title": "风险标题",
      "deadline": "截止时间",
      "remainingDays": 0,
      "impact": "时间影响",
      "suggestion": "应对建议"
    }
  ],
  "priceRisks": [
    {
      "id": "唯一标识",
      "title": "风险标题",
      "upperLimit": 0,
      "lowerLimit": 0,
      "calculationMethod": "计算方式",
      "impact": "报价影响",
      "suggestion": "应对建议"
    }
  ],
  "totalRiskLevel": "low/medium/high/critical",
  "recommendation": "bid/caution/no-bid"
}

## 招标文件内容

{document_content}`;
