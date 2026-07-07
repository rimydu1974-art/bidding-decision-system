// 日期/截止时间规则提取器

export interface TimelineItem {
  field: string;
  value: string;
  date: Date | null;
  sourceLocation: string;
  rawText: string;
  isUrgent?: boolean;
}

const DATE_PATTERNS = [
  /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})[：:时](\d{2})/g,
  /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日]?/g,
  /(\d{1,2})[月\-\/](\d{1,2})[日]?\s*(\d{1,2})[：:时](\d{2})/g,
];

function parseDate(text: string): Date | null {
  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const match = regex.exec(text);
    if (match) {
      const groups = match;
      if (groups.length >= 4) {
        let year = parseInt(groups[1]);
        let month = parseInt(groups[2]);
        let day = parseInt(groups[3]);

        if (year < 100) year += 2000;
        if (month > 12 && groups.length >= 4) {
          month = parseInt(groups[2]);
          day = parseInt(groups[3]);
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const hour = groups[4] ? parseInt(groups[4]) : 0;
          const minute = groups[5] ? parseInt(groups[5]) : 0;
          return new Date(year, month - 1, day, hour, minute);
        }
      }
    }
  }
  return null;
}

function extractTimelineItem(text: string, field: string, keywords: string[]): TimelineItem | null {
  for (const keyword of keywords) {
    const idx = text.indexOf(keyword);
    if (idx === -1) continue;

    const context = text.substring(Math.max(0, idx - 50), Math.min(text.length, idx + 200));
    const date = parseDate(context);

    const pageMatch = text.substring(Math.max(0, idx - 100), idx).match(/---\s*PDF第(\d+)页\s*---/);
    const sourceLocation = pageMatch ? `PDF第${pageMatch[1]}页` : '来源未定位';

    const now = new Date();
    const isUrgent = date ? (date.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

    return {
      field,
      value: context.trim().substring(0, 200),
      date,
      sourceLocation,
      rawText: context.trim(),
      isUrgent,
    };
  }
  return null;
}

export function extractTimelines(text: string): TimelineItem[] {
  const items: TimelineItem[] = [];

  const deadlineKeywords = ['投标截止', '报价截止', '提交截止', '递交截止', '截止时间'];
  const openingKeywords = ['开标时间', '谈判时间', '评审时间', '开启时间'];
  const acquisitionDeadline = ['获取招标文件截止', '申领截止', '报名截止', '获取谈判文件截止'];
  const questionDeadline = ['标前提问', '质疑截止', '疑问截止', '澄清截止'];
  const deliveryKeywords = ['交货时间', '交付时间', '工期', '实施期', '完成时间'];
  const warrantyKeywords = ['质保期', '保修期', '维护期', '服务期'];

  const deadline = extractTimelineItem(text, '投标截止时间', deadlineKeywords);
  if (deadline) items.push(deadline);

  const opening = extractTimelineItem(text, '开标时间', openingKeywords);
  if (opening) items.push(opening);

  const acquisition = extractTimelineItem(text, '获取招标文件截止', acquisitionDeadline);
  if (acquisition) items.push(acquisition);

  const question = extractTimelineItem(text, '标前提问截止', questionDeadline);
  if (question) items.push(question);

  const delivery = extractTimelineItem(text, '交货/交付时间', deliveryKeywords);
  if (delivery) items.push(delivery);

  const warranty = extractTimelineItem(text, '质保期', warrantyKeywords);
  if (warranty) items.push(warranty);

  return items;
}
