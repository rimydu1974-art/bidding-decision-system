/**
 * Industry Identifier
 * Identifies the industry type based on project name and content
 */

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  '军队采购': ['军队', '军采', '军事', '国防', '部队', '武警'],
  '政府采购': ['政府', '财政', '公立', '事业单位', '机关'],
  '医疗服务': ['医疗', '医院', '卫生', '药品', '器械', '耗材'],
  '教育培训': ['教育', '学校', '培训', '教材', '教学'],
  '办公用品': ['办公', '文具', '耗材', '打印', '复印'],
  '物业服务': ['物业', '保安', '保洁', '绿化'],
  '养老服务': ['养老', '老年', '护理', '福利院'],
  '环保监测': ['环保', '监测', '检测', '环境'],
  '三维模型': ['三维', '模型', 'BIM', '设计'],
};

/**
 * Identify industry from project name and basic info
 */
export function identifyIndustry(
  projectName: string,
  basicInfo: Record<string, any> | undefined
): string | null {
  const text = projectName + ' ' + JSON.stringify(basicInfo || {});
  
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      return industry;
    }
  }
  
  return null;
}
