import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { canUserExport } from '@/lib/quota';

let cachedFontBase64: string | null = null;

async function getChineseFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;

  const possiblePaths = [
    join(process.cwd(), 'public', 'fonts', 'simhei.ttf'),
    'C:\\Windows\\Fonts\\simhei.ttf',
    '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    '/usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    '/System/Library/Fonts/PingFang.ttc',
  ];

  for (const fontPath of possiblePaths) {
    if (existsSync(fontPath)) {
      const fontBuffer = readFileSync(fontPath);
      cachedFontBase64 = fontBuffer.toString('base64');
      return cachedFontBase64;
    }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.opencheck.com.cn';
    const res = await fetch(`${baseUrl}/fonts/simhei.ttf`);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const fontBuffer = Buffer.from(arrayBuffer);
      cachedFontBase64 = fontBuffer.toString('base64');
      return cachedFontBase64;
    }
  } catch (e) {
    console.error('Font fetch fallback failed:', e);
  }

  throw new Error('未找到中文字体文件。请将 simhei.ttf 放置在 public/fonts/ 目录下');
}

const CIRCLE = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'];

const formatSource = (raw: string): string => {
  if (!raw || raw === '招标文件' || raw === '来源未定位') return '';
  if (raw.includes('\uFF5C')) return raw;
  if (raw.startsWith('章节\uFF1A') || raw.startsWith('章节:')) {
    const pdfMatch = raw.match(/PDF第(\d+)页/);
    const textMatch = raw.match(/正文第(\d+)页/);
    const quoteMatch = raw.match(/引用原文[：:]"([^"]+)"/);
    const chapterMatch = raw.match(/章节[：:]([^；;]+)/);
    const parts: string[] = ['招标文件'];
    if (pdfMatch) parts.push(`系统第${pdfMatch[1]}页`);
    if (textMatch) parts.push(`正文页码第${textMatch[1]}页`);
    if (chapterMatch) parts.push(chapterMatch[1].trim());
    let result = parts.join('\uFF5C');
    if (quoteMatch) {
      result += `\uFF5C引用原文："${quoteMatch[1]}"`;
    }
    return result;
  }
  return raw.length > 60 ? raw.substring(0, 60) + '...' : raw;
};

const addCircleNumbers = (text: string): string => {
  if (!text || text === '-') return text;
  if (/[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return text;
  const parts = text.split(/[；;]\s*|\n\s*/).filter(p => p.trim().length > 0);
  if (parts.length <= 1) return text;
  return parts.map((p, i) => (CIRCLE[i] || `${i+1}.`) + p).join('\n');
};

const formatNumberedItems = (text: string): string => {
  if (!text || text === '-') return text;
  // If text already has circle numbers with newlines, keep as is
  if (/\n[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return text;
  // If text has circle numbers without newlines, add newlines
  if (/[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) {
    return text.replace(/([①②③④⑤⑥⑦⑧⑨⑩])/g, '\n$1').replace(/\n{2,}/g, '\n').trim();
  }
  // Handle other numbering patterns
  const hasNumberedPattern = /\d+[.、）)]\s*/.test(text) || /[•●■◆▪]\s*/.test(text);
  if (!hasNumberedPattern) return text;
  let formatted = text
    .replace(/(\d+[.、）)])\s*/g, '\n$1')
    .replace(/([•●■◆▪])\s*/g, '\n$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return formatted;
};

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (token) {
      const session = await validateSession(token);
      if (session) {
        const canExport = await canUserExport(session.user.id);
        if (!canExport) {
          return NextResponse.json({ 
            error: '7天有效期已过，可以查看结果但不能导出。如需继续使用请再次购买' 
          }, { status: 403 });
        }
      }
    }

    const reqBody = await request.json();
    let data = reqBody.assessment || reqBody;
    const aiResult = typeof data.aiResult === 'string' ? JSON.parse(data.aiResult) : (data.aiResult || {});
    data = {
      ...data,
      financialInfo: data.financialInfo || aiResult.financialInfo || {},
      timeRequirements: data.timeRequirements || aiResult.timeRequirements || {},
      projectInfo: data.projectInfo || aiResult.projectInfo || {},
      qualificationRequirements: data.qualificationRequirements || data.qualificationReqs || aiResult.qualificationRequirements || [],
      phoneQuestions: data.phoneQuestions || aiResult.phoneQuestions || [],
      risks: data.risks || aiResult.risks || [],
      preparationTasks: data.preparationTasks || aiResult.preparationTasks || [],
      _sources: data._sources || aiResult._sources || {},
    };
    const isPaid = reqBody.isPaid || false;

    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('l', 'mm', 'a4');

    const fontBase64 = await getChineseFontBase64();
    (doc as any).addFileToVFS('SimHei.ttf', fontBase64);
    (doc as any).addFont('SimHei.ttf', 'SimHei', 'normal');
    (doc as any).addFont('SimHei.ttf', 'SimHei', 'bold');
    doc.setFont('SimHei');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    const colors = {
      brandPurple: [124, 58, 237] as [number, number, number],
      brandCyan: [6, 182, 212] as [number, number, number],
      header1: [41, 128, 185] as [number, number, number],
      header2: [52, 152, 219] as [number, number, number],
      header3: [243, 156, 18] as [number, number, number],
      header4: [39, 174, 96] as [number, number, number],
      header5: [155, 89, 182] as [number, number, number],
      header6: [230, 126, 34] as [number, number, number],
      danger: [231, 76, 60] as [number, number, number],
      success: [39, 174, 96] as [number, number, number],
      warning: [243, 156, 18] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      black: [51, 51, 51] as [number, number, number],
      gray: [128, 128, 128] as [number, number, number],
    };

    // Cover page
    doc.setFillColor(...colors.brandPurple);
    doc.rect(0, 0, pageWidth, 5, 'F');
    doc.setFillColor(...colors.brandCyan);
    doc.rect(0, 5, pageWidth, 2, 'F');

    // Add OpenCheck logo
    const logoPath = join(process.cwd(), 'public', 'opencheck-logo.png');
    if (existsSync(logoPath)) {
      const logoBuffer = readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoWidth = 80;
      const logoHeight = 24;
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - logoWidth / 2, 35, logoWidth, logoHeight);
    }

    let currentY = 70;
    doc.setFontSize(24);
    doc.setTextColor(...colors.black);
    doc.setFont('SimHei', 'bold');
    doc.text('\u6295\u6807\u51B3\u7B56\u8BC4\u4F30\u62A5\u544A', pageWidth / 2, currentY, { align: 'center' });

    currentY += 20;
    doc.setFontSize(12);
    doc.setTextColor(...colors.gray);
    doc.setFont('SimHei', 'normal');
    const projectName = data.basicInfo?.['\u9879\u76EE\u540D\u79F0'] || data.basicInfo?.projectName || data.projectName || '-';
    doc.text(`\u9879\u76EE\u540D\u79F0\uFF1A${projectName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    const projectCode = data.basicInfo?.['\u9879\u76EE\u7F16\u53F7'] || data.basicInfo?.projectCode || '-';
    doc.text(`\u9879\u76EE\u7F16\u53F7\uFF1A${projectCode}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    const budget = data.financialInfo?.['\u9884\u7B97\u91D1\u989D(\u5143)'] || data.financialInfo?.budget;
    doc.text(`\u9884\u7B97\u91D1\u989D\uFF1A${budget ? `\u00A5${Number(budget).toLocaleString()}` : '-'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 9;
    doc.text(`\u751F\u6210\u65F6\u95F4\uFF1A${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, currentY, { align: 'center' });

    const riskLevelMap: Record<string, { text: string; color: [number, number, number] }> = {
      critical: { text: '\u9AD8\u98CE\u9669', color: colors.danger },
      high: { text: '\u8F83\u9AD8\u98CE\u9669', color: colors.warning },
      medium: { text: '\u4E2D\u7B49\u98CE\u9669', color: [243, 156, 18] as [number, number, number] },
      low: { text: '\u4F4E\u98CE\u9669', color: colors.success },
    };
    const riskInfo = riskLevelMap[data.riskLevel || 'medium'] || riskLevelMap.medium;
    currentY += 18;
    doc.setFillColor(...riskInfo.color);
    const tagWidth = 42;
    (doc as any).roundedRect(pageWidth / 2 - tagWidth / 2, currentY - 5, tagWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('SimHei', 'bold');
    doc.text(riskInfo.text, pageWidth / 2, currentY + 1.5, { align: 'center' });
    doc.setFont('SimHei', 'normal');

    const recMap: Record<string, { text: string; color: [number, number, number] }> = {
      bid: { text: '\u5EFA\u8BAE\u6295\u6807', color: colors.success },
      caution: { text: '\u8C28\u614E\u6295\u6807', color: colors.warning },
      'no-bid': { text: '\u4E0D\u5EFA\u8BAE\u6295\u6807', color: colors.danger },
    };
    const recInfo = recMap[data.recommendation] || recMap.caution;
    currentY += 16;
    doc.setFillColor(...recInfo.color);
    (doc as any).roundedRect(pageWidth / 2 - tagWidth / 2, currentY - 5, tagWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('SimHei', 'bold');
    doc.text(recInfo.text, pageWidth / 2, currentY + 1.5, { align: 'center' });
    doc.setFont('SimHei', 'normal');

    doc.setFillColor(...colors.brandPurple);
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
    doc.setFillColor(...colors.brandCyan);
    doc.rect(0, pageHeight - 7, pageWidth, 2, 'F');

    // ==================== Build 4-column table rows ====================
    type TableRow = { no: string; fieldName: string; data: string; source: string; isSeparator?: boolean; separatorColor?: [number, number, number]; isCritical?: boolean };

    const rows: TableRow[] = [];
    let rowNum = 0;

    const addSeparator = (title: string, color: [number, number, number]) => {
      rows.push({ no: '', fieldName: '', data: title, source: '', isSeparator: true, separatorColor: color });
    };

    const addRow = (fieldName: string, data: string, source: string = '', isCritical: boolean = false) => {
      rowNum++;
      rows.push({ no: String(rowNum), fieldName, data, source, isCritical });
    };

    const getS = (section: any, key: string): string => {
      const src = section?._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      for (const v of Object.values(src)) {
        if (typeof v === 'string' && (v.includes('\u7CFB\u7EDF\u7B2C') || (v.includes('\u7B2C') && v.includes('\u9875')))) return formatSource(v);
      }
      return '';
    };

    // ==================== Category 1: Basic Info ====================
    addSeparator('\u7B2C\u4E00\u7C7B\uFF1A\u57FA\u672C\u4FE1\u606F', colors.header1);
    const basicInfo = data.basicInfo || {};
    addRow('\u9879\u76EE\u540D\u79F0', basicInfo['\u9879\u76EE\u540D\u79F0'] || basicInfo.projectName || '-', getS(basicInfo, '\u9879\u76EE\u540D\u79F0'));
    addRow('\u9879\u76EE\u7F16\u53F7', basicInfo['\u9879\u76EE\u7F16\u53F7'] || basicInfo.projectCode || '-', getS(basicInfo, '\u9879\u76EE\u7F16\u53F7'));
    addRow('\u62DB\u6807\u4F01\u4E1A', basicInfo['\u62DB\u6807\u4F01\u4E1A'] || basicInfo.tenderer || '-', getS(basicInfo, '\u62DB\u6807\u4F01\u4E1A'));
    addRow('\u62DB\u6807\u8054\u7CFB\u4EBA', basicInfo['\u62DB\u6807\u8054\u7CFB\u4EBA'] || basicInfo.contactPerson || '-', getS(basicInfo, '\u62DB\u6807\u8054\u7CFB\u4EBA'));
    addRow('\u8054\u7CFB\u7535\u8BDD', basicInfo['\u8054\u7CFB\u7535\u8BDD'] || basicInfo.contactPhone || '-', getS(basicInfo, '\u8054\u7CFB\u7535\u8BDD'));
    addRow('\u4EE3\u7406\u673A\u6784', basicInfo['\u4EE3\u7406\u673A\u6784'] || basicInfo.agency || '-', getS(basicInfo, '\u4EE3\u7406\u673A\u6784'));
    addRow('\u4FE1\u606F\u6765\u6E90', basicInfo['\u4FE1\u606F\u6765\u6E90'] || basicInfo.informationSource || '-', getS(basicInfo, '\u4FE1\u606F\u6765\u6E90'));
    addRow('CA\u9700\u6C42', basicInfo['CA\u9700\u6C42'] || basicInfo.caRequirement || '-', getS(basicInfo, 'CA\u9700\u6C42'));
    addRow('\u5F00\u6807\u65B9\u5F0F', basicInfo['\u5F00\u6807\u65B9\u5F0F'] || basicInfo.bidOpeningMethod || '-', getS(basicInfo, '\u5F00\u6807\u65B9\u5F0F'));
    addRow('\u5F00\u6807\u5730\u70B9', basicInfo['\u5F00\u6807\u5730\u70B9'] || basicInfo.bidOpeningLocation || '-', getS(basicInfo, '\u5F00\u6807\u5730\u70B9'));
    addRow('\u5982\u4F55\u62A5\u540D/\u83B7\u53D6\u62DB\u6807\u6587\u4EF6', basicInfo['\u5982\u4F55\u62A5\u540D/\u83B7\u53D6\u62DB\u6807\u6587\u4EF6'] || basicInfo.registrationMethod || '-', getS(basicInfo, '\u5982\u4F55\u62A5\u540D/\u83B7\u53D6\u62DB\u6807\u6587\u4EF6'));
    addRow('\u9879\u76EE\u5730\u70B9', basicInfo['\u9879\u76EE\u5730\u70B9'] || basicInfo.location || '-', getS(basicInfo, '\u9879\u76EE\u5730\u70B9'));

    // ==================== Category 2: Financial Info ====================
    addSeparator('\u7B2C\u4E8C\u7C7B\uFF1A\u8D22\u52A1\u4FE1\u606F', colors.header2);
    const fin = data.financialInfo || {};
    addRow('\u8D44\u91D1\u6765\u6E90', fin['\u8D44\u91D1\u6765\u6E90'] || fin.fundingSource || '-', getS(fin, '\u8D44\u91D1\u6765\u6E90'));
    const budgetVal = fin['\u9884\u7B97\u91D1\u989D(\u5143)'] || fin.budget;
    addRow('\u9884\u7B97\u91D1\u989D(\u5143)', budgetVal ? `${Number(budgetVal).toLocaleString()}\u5143` : '-', getS(fin, '\u9884\u7B97\u91D1\u989D(\u5143)'), true);
    const maxPriceVal = fin['\u6700\u9AD8\u9650\u4EF7(\u5143)'] || fin.maxPrice;
    addRow('\u6700\u9AD8\u9650\u4EF7(\u5143)', maxPriceVal ? `${Number(maxPriceVal).toLocaleString()}\u5143` : '-', getS(fin, '\u6700\u9AD8\u9650\u4EF7(\u5143)'), true);
    addRow('\u9700\u8981\u9884\u5148\u6295\u8D44\u91D1\u989D', fin['\u9700\u8981\u9884\u5148\u6295\u8D44\u91D1\u989D'] || fin.preInvestment || '-', getS(fin, '\u9700\u8981\u9884\u5148\u6295\u8D44\u91D1\u989D'));
    addRow('\u4ED8\u6B3E\u65B9\u5F0F', fin['\u4ED8\u6B3E\u65B9\u5F0F'] || fin.paymentMethod || '-', getS(fin, '\u4ED8\u6B3E\u65B9\u5F0F'));
    addRow('\u6807\u4E66\u8D39', fin['\u6807\u4E66\u8D39'] || fin.bidDocumentFee || '-', getS(fin, '\u6807\u4E66\u8D39'));
    addRow('\u6295\u6807\u4FDD\u8BC1\u91D1', fin['\u6295\u6807\u4FDD\u8BC1\u91D1'] || fin.bidBond || '-', getS(fin, '\u6295\u6807\u4FDD\u8BC1\u91D1'));
    addRow('\u5C65\u7EA6\u4FDD\u8BC1\u91D1', fin['\u5C65\u7EA6\u4FDD\u8BC1\u91D1'] || fin.performanceBond || '-', getS(fin, '\u5C65\u7EA6\u4FDD\u8BC1\u91D1'));
    addRow('\u8D28\u91CF\u4FDD\u8BC1\u91D1', fin['\u8D28\u91CF\u4FDD\u8BC1\u91D1'] || fin.qualityBond || '-', getS(fin, '\u8D28\u91CF\u4FDD\u8BC1\u91D1'));
    addRow('\u4FDD\u5BC6\u4FDD\u8BC1\u91D1', fin['\u4FDD\u5BC6\u4FDD\u8BC1\u91D1'] || fin.confidentialityBond || '-', getS(fin, '\u4FDD\u5BC6\u4FDD\u8BC1\u91D1'));
    addRow('\u4EE3\u7406\u8D39', fin['\u4EE3\u7406\u8D39'] || fin.agencyFee || '-', getS(fin, '\u4EE3\u7406\u8D39'));

    // ==================== Category 3: Qualification Requirements ====================
    addSeparator('\u7B2C\u4E09\u7C7B\uFF1A\u8D44\u8D28\u8981\u6C42', colors.header3);
    const qualReqs = data.qualificationRequirements || [];
    if (qualReqs.length > 0) {
      const q = qualReqs[0];
      addRow('\u8054\u5408\u4F53\u6295\u6807', q['\u8054\u5408\u4F53\u6295\u6807'] || q.jointBid || '-', getS(q, '\u8054\u5408\u4F53\u6295\u6807'));
      addRow('\u5206\u5305\u8F6C\u5305', q['\u5206\u5305\u8F6C\u5305'] || q.subcontracting || '-', getS(q, '\u5206\u5305\u8F6C\u5305'));
      addRow('\u4F01\u4E1A\u89C4\u6A21\u8981\u6C42', q['\u4F01\u4E1A\u89C4\u6A21\u8981\u6C42'] || q.companyScaleReq || '-', getS(q, '\u4F01\u4E1A\u89C4\u6A21\u8981\u6C42'));
      addRow('\u7279\u522B\u8D44\u8D28', q['\u7279\u522B\u8D44\u8D28'] || q.specialQualification || '-', getS(q, '\u7279\u522B\u8D44\u8D28'), true);
      addRow('\u7279\u522B\u4EBA\u5458\u8981\u6C42', q['\u7279\u522B\u4EBA\u5458\u8981\u6C42'] || q.specialPersonnelReq || '-', getS(q, '\u7279\u522B\u4EBA\u5458\u8981\u6C42'));
      addRow('\u7279\u522B\u8BF4\u660E', q['\u7279\u522B\u8BF4\u660E'] || q.specialNotes || '-', getS(q, '\u7279\u522B\u8BF4\u660E'));
      addRow('\u653F\u7B56\u4F18\u60E0', q['\u653F\u7B56\u4F18\u60E0'] || q.policyBenefits || '-', getS(q, '\u653F\u7B56\u4F18\u60E0'));
      addRow('\u8D44\u683C\u6027\u5BA1\u67E5', q['\u8D44\u683C\u6027\u5BA1\u67E5'] || q.qualificationReview || '-', getS(q, '\u8D44\u683C\u6027\u5BA1\u67E5'), true);
      addRow('\u7B26\u5408\u6027\u5BA1\u67E5', q['\u7B26\u5408\u6027\u5BA1\u67E5'] || q.complianceReview || '-', getS(q, '\u7B26\u5408\u6027\u5BA1\u67E5'), true);
      addRow('\u4FE1\u7528\u8981\u6C42', q['\u4FE1\u7528\u8981\u6C42'] || q.creditRequirements || '-', getS(q, '\u4FE1\u7528\u8981\u6C42'));
    }

    // ==================== Category 4: Scoring Rules ====================
    addSeparator('\u7B2C\u56DB\u7C7B\uFF1A\u8BC4\u5206\u89C4\u5219', colors.header4);
    const sc = data.scoringRules || {};
    const scS = (key: string) => {
      const src = sc._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    addRow('\u603B\u5206', `${sc['\u603B\u5206'] || sc.totalScore || 100}\u5206`, scS('\u603B\u5206'));
    addRow('\u4EF7\u683C\u5206', `${sc['\u4EF7\u683C\u5206'] || sc.priceScore || 0}\u5206`, scS('\u4EF7\u683C\u5206'));
    addRow('\u5546\u52A1\u5206', `${sc['\u5546\u52A1\u5206'] || sc.commercialScore || 0}\u5206`, scS('\u5546\u52A1\u5206'));
    addRow('\u6280\u672F\u5206', `${sc['\u6280\u672F\u5206'] || sc.technicalScore || 0}\u5206`, scS('\u6280\u672F\u5206'));
    addRow('\u4E2D\u6807\u65B9\u5F0F', sc['\u4E2D\u6807\u65B9\u5F0F'] || sc.winningMethod || '-', scS('\u4E2D\u6807\u65B9\u5F0F'));
    addRow('\u8BC4\u6807\u65B9\u5F0F', sc['\u8BC4\u6807\u65B9\u5F0F'] || sc.evaluationMethod || '-', scS('\u8BC4\u6807\u65B9\u5F0F'));
    addRow('\u5BA2\u89C2\u5206/\u4E3B\u89C2\u5206\u6BD4\u4F8B', sc['\u5BA2\u89C2\u5206/\u4E3B\u89C2\u5206\u6BD4\u4F8B'] || sc.objectiveSubjectiveRatio || '-', scS('\u5BA2\u89C2\u5206/\u4E3B\u89C2\u5206\u6BD4\u4F8B'));
    if (sc['\u5E9F\u6807\u8BF4\u660E'] || sc.voidBidExplanation) {
      addRow('\u5E9F\u6807\u8BF4\u660E', sc['\u5E9F\u6807\u8BF4\u660E'] || sc.voidBidExplanation || '-', scS('\u5E9F\u6807\u8BF4\u660E'), true);
    }
    if (sc['\u8BC4\u5206\u7279\u522B\u8981\u6C42'] || sc.specialScoringRequirements) {
      addRow('\u8BC4\u5206\u7279\u522B\u8981\u6C42', sc['\u8BC4\u5206\u7279\u522B\u8981\u6C42'] || sc.specialScoringRequirements || '-', scS('\u8BC4\u5206\u7279\u522B\u8981\u6C42'));
    }
    const companyCerts = sc['\u8981\u6C42\u4F01\u4E1A\u8D44\u8D28\u8BC1\u4E66'] || sc.requiredCompanyCertificates || [];
    if (companyCerts.length > 0 && companyCerts[0] !== '\u62DB\u6807\u6587\u4EF6\u672A\u63D0\u53CA') {
      addRow('\u8981\u6C42\u4F01\u4E1A\u8D44\u8D28\u8BC1\u4E66', Array.isArray(companyCerts) ? companyCerts.join('\u3001') : String(companyCerts), scS('\u8981\u6C42\u4F01\u4E1A\u8D44\u8D28\u8BC1\u4E66'));
    }
    const personnelCerts = sc['\u8981\u6C42\u4EBA\u5458\u8D44\u8D28\u8BC1\u4E66'] || sc.requiredPersonnelCertificates || [];
    if (personnelCerts.length > 0 && personnelCerts[0] !== '\u62DB\u6807\u6587\u4EF6\u672A\u63D0\u53CA') {
      addRow('\u8981\u6C42\u4EBA\u5458\u8D44\u8D28\u8BC1\u4E66', Array.isArray(personnelCerts) ? personnelCerts.join('\u3001') : String(personnelCerts), scS('\u8981\u6C42\u4EBA\u5458\u8D44\u8D28\u8BC1\u4E66'));
    }
    const productReports = sc['\u8981\u6C42\u4EA7\u54C1\u68C0\u6D4B\u62A5\u544A'] || sc.requiredProductReports || [];
    if (productReports.length > 0 && productReports[0] !== '\u62DB\u6807\u6587\u4EF6\u672A\u63D0\u53CA') {
      addRow('\u8981\u6C42\u4EA7\u54C1\u68C0\u6D4B\u62A5\u544A', Array.isArray(productReports) ? productReports.join('\u3001') : String(productReports), scS('\u8981\u6C42\u4EA7\u54C1\u68C0\u6D4B\u62A5\u544A'));
    }
    const commercialDetail = sc['\u5546\u52A1\u5206\u8BC4\u5BA1\u660E\u7EC6'] || sc.commercialScoreDetail || '';
    if (commercialDetail) {
      addRow('\u5546\u52A1\u5206\u8BC4\u5BA1\u660E\u7EC6', addCircleNumbers(commercialDetail), scS('\u5546\u52A1\u5206\u8BC4\u5BA1\u660E\u7EC6'));
    }
    const technicalDetail = sc['\u6280\u672F\u5206\u8BC4\u5BA1\u660E\u7EC6'] || sc.technicalScoreDetail || '';
    if (technicalDetail) {
      addRow('\u6280\u672F\u5206\u8BC4\u5BA1\u660E\u7EC6', addCircleNumbers(technicalDetail), scS('\u6280\u672F\u5206\u8BC4\u5BA1\u660E\u7EC6'));
    }

    // ==================== Category 5: Time Requirements ====================
    addSeparator('\u7B2C\u4E94\u7C7B\uFF1A\u65F6\u95F4\u8981\u6C42', colors.header5);
    const timeReqs = data.timeRequirements || {};
    const tS = (key: string) => {
      const src = timeReqs._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    addRow('\u83B7\u53D6\u62DB\u6807\u6587\u4EF6\u622A\u6B62\u65F6\u95F4', timeReqs['\u83B7\u53D6\u62DB\u6807\u6587\u4EF6\u622A\u6B62\u65F6\u95F4'] || timeReqs.documentAcquisitionDeadline || '-', tS('\u83B7\u53D6\u62DB\u6807\u6587\u4EF6\u622A\u6B62\u65F6\u95F4'));
    addRow('\u6807\u524D\u63D0\u95EE\u622A\u6B62\u65F6\u95F4', timeReqs['\u6807\u524D\u63D0\u95EE\u622A\u6B62\u65F6\u95F4'] || timeReqs.preBidQuestionDeadline || '-', tS('\u6807\u524D\u63D0\u95EE\u622A\u6B62\u65F6\u95F4'));
    addRow('\u5F00\u6807\u65F6\u95F4', timeReqs['\u5F00\u6807\u65F6\u95F4'] || timeReqs.bidOpeningTime || '-', tS('\u5F00\u6807\u65F6\u95F4'), true);
    addRow('\u4E2D\u6807\u4EA4\u8D27\u65F6\u95F4/\u9879\u76EE\u5B9E\u65BD\u671F', timeReqs['\u4E2D\u6807\u4EA4\u8D27\u65F6\u95F4/\u9879\u76EE\u5B9E\u65BD\u671F'] || timeReqs.winningDeliveryTime || '-', tS('\u4E2D\u6807\u4EA4\u8D27\u65F6\u95F4/\u9879\u76EE\u5B9E\u65BD\u671F'));
    addRow('\u5408\u540C\u5C65\u7EA6\u671F\u9650', timeReqs['\u5408\u540C\u5C65\u7EA6\u671F\u9650'] || timeReqs.contractPerformancePeriod || '-', tS('\u5408\u540C\u5C65\u7EA6\u671F\u9650'));

    // ==================== Category 6: Project Info ====================
    addSeparator('\u7B2C\u516D\u7C7B\uFF1A\u9879\u76EE\u4FE1\u606F', colors.header6);
    const proj = data.projectInfo || {};
    const pS = (key: string) => {
      const src = proj._source;
      if (!src || typeof src !== 'object') return '';
      if (src[key]) return formatSource(src[key]);
      return '';
    };
    addRow('\u25B2\u2605\u2606\u8981\u6C42', proj['\u25B2\u2605\u2606\u8981\u6C42'] || proj.substantialRequirements || '-', pS('\u25B2\u2605\u2606\u8981\u6C42'), true);
    addRow('\u504F\u79BB\u25B2\u2605\u2606\u7684\u7ED3\u679C', proj['\u504F\u79BB\u25B2\u2605\u2606\u7684\u7ED3\u679C'] || proj.deviationResult || '-', pS('\u504F\u79BB\u25B2\u2605\u2606\u7684\u7ED3\u679C'), true);
    addRow('\u56FE\u7EB8\u63D0\u4F9B\u60C5\u51B5', proj['\u56FE\u7EB8\u63D0\u4F9B\u60C5\u51B5'] || proj.drawingsProvided || '-', pS('\u56FE\u7EB8\u63D0\u4F9B\u60C5\u51B5'));
    addRow('\u56FE\u7EB8\u6DF1\u5EA6\u8981\u6C42', proj['\u56FE\u7EB8\u6DF1\u5EA6\u8981\u6C42'] || proj.drawingDepthRequirement || '-', pS('\u56FE\u7EB8\u6DF1\u5EA6\u8981\u6C42'));
    addRow('\u56FE\u7EB8\u6E05\u5355', proj['\u56FE\u7EB8\u6E05\u5355'] || proj.drawingList || '-', pS('\u56FE\u7EB8\u6E05\u5355'));
    addRow('\u73B0\u573A\u8E0F\u52D8', proj['\u73B0\u573A\u8E0F\u52D8'] || proj.siteSurveyRequired || '-', pS('\u73B0\u573A\u8E0F\u52D8'));
    addRow('\u8E0F\u52D8\u9700\u8981\u786E\u8BA4\u95EE\u9898', proj['\u8E0F\u52D8\u9700\u8981\u786E\u8BA4\u95EE\u9898'] || proj.siteSurveyConfirmation || '-', pS('\u8E0F\u52D8\u9700\u8981\u786E\u8BA4\u95EE\u9898'));
    addRow('\u63A7\u6807\u70B9', proj['\u63A7\u6807\u70B9'] || proj.controlPoints || '-', pS('\u63A7\u6807\u70B9'));
    addRow('\u5546\u52A1\u9700\u6C42', proj['\u5546\u52A1\u9700\u6C42'] || proj.businessRequirements || '-', pS('\u5546\u52A1\u9700\u6C42'));
    addRow('\u6280\u672F\u9700\u6C42\uFF08\u6280\u672F\u53C2\u6570\uFF09', proj['\u6280\u672F\u9700\u6C42\uFF08\u6280\u672F\u53C2\u6570\uFF09'] || proj.technicalRequirements || '-', pS('\u6280\u672F\u9700\u6C42\uFF08\u6280\u672F\u53C2\u6570\uFF09'));
    addRow('\u6838\u5FC3\u670D\u52A1\u9700\u6C42', proj['\u6838\u5FC3\u670D\u52A1\u9700\u6C42'] || proj.coreServiceRequirements || '-', pS('\u6838\u5FC3\u670D\u52A1\u9700\u6C42'));
    addRow('\u9879\u76EE\u6210\u679C\u8981\u6C42', proj['\u9879\u76EE\u6210\u679C\u8981\u6C42'] || proj.projectOutcomeRequirements || '-', pS('\u9879\u76EE\u6210\u679C\u8981\u6C42'));
    addRow('\u6700\u7EC8\u4EA4\u4ED8', proj['\u6700\u7EC8\u4EA4\u4ED8'] || proj.finalDelivery || '-', pS('\u6700\u7EC8\u4EA4\u4ED8'));
    addRow('\u9879\u76EE\u7279\u522B\u63D0\u5230\u70B9', proj['\u9879\u76EE\u7279\u522B\u63D0\u5230\u70B9'] || proj.specialProjectPoints || '-', pS('\u9879\u76EE\u7279\u522B\u63D0\u5230\u70B9'));
    addRow('\u6B63\u672C\u526F\u672C', proj['\u6B63\u672C\u526F\u672C'] || proj.originalCopies || '-', pS('\u6B63\u672C\u526F\u672C'));
    addRow('\u62A5\u4EF7\u6587\u4EF6\u63D0\u4EA4\u6807\u8BB0', proj['\u62A5\u4EF7\u6587\u4EF6\u63D0\u4EA4\u6807\u8BB0'] || proj.bidSubmissionMarking || '-', pS('\u62A5\u4EF7\u6587\u4EF6\u63D0\u4EA4\u6807\u8BB0'));
    addRow('\u5BC6\u5C01\u5305\u88C5\u76D6\u7AE0\u8981\u6C42', proj['\u5BC6\u5C01\u5305\u88C5\u76D6\u7AE0\u8981\u6C42'] || proj.sealingRequirements || proj.packagingRequirements || proj.stampingRequirements || '-', pS('\u5BC6\u5C01\u5305\u88C5\u76D6\u7AE0\u8981\u6C42'));
    addRow('\u7B7E\u5B57\u8981\u6C42', proj['\u7B7E\u5B57\u8981\u6C42'] || proj.signatureRequirements || '-', pS('\u7B7E\u5B57\u8981\u6C42'));
    addRow('\u9A8C\u6536\u8981\u6C42', proj['\u9A8C\u6536\u8981\u6C42'] || proj.acceptanceRequirements || '-', pS('\u9A8C\u6536\u8981\u6C42'));

    // ==================== Category 7: Special Rows ====================
    addSeparator('\u7279\u6B8A\u884C', colors.brandPurple);
    const phoneQuestions = data.phoneQuestions || [];
    const risks = data.risks || [];
    const prepTasks = data.checklist || data.preparationTasks || [];

    if (isPaid) {
      // Phone questions
      if (phoneQuestions.length > 0) {
        addRow('1\u3001\u7535\u8BDD\u95EE\u9898', addCircleNumbers(phoneQuestions.map((q: any) => q.question || q).join('\uFF1B')), '');
      }
      // Risks
      if (risks.length > 0) {
        addRow('2\u3001\u98CE\u9669\u6E05\u5355', addCircleNumbers(risks.map((r: any) => r.description || r.title || '').join('\uFF1B')), '');
      }
      // Preparation tasks
      if (prepTasks.length > 0) {
        addRow('3\u3001\u51C6\u5907\u5206\u5DE5', addCircleNumbers(prepTasks.map((t: any) => `${t.category || ''}${(t.items || []).join('\u3001')}`).join('\uFF1B')), '');
      }
      // Investment suggestion
      const recLabel: Record<string, string> = { bid: '\u5EFA\u8BAE\u6295\u6807', 'no-bid': '\u4E0D\u5EFA\u8BAE\u6295\u6807', caution: '\u8C28\u614E\u6295\u6807' };
      addRow('4\u3001\u6295\u6807\u5EFA\u8BAE', `${recLabel[data.recommendation || 'caution'] || '\u8C28\u614E\u6295\u6807'}\uFF1B${(data.reasons || []).join('\uFF1B')}`, '', true);
    } else {
      addRow('1\u3001\u7535\u8BDD\u95EE\u9898', `${phoneQuestions.length}\u6761\uFF0C\u4ED8\u8D39\u540E\u67E5\u770B\u8BE6\u7EC6\u5185\u5BB9`, '');
      addRow('2\u3001\u98CE\u9669\u6E05\u5355', `${risks.length}\u6761\uFF0C\u4ED8\u8D39\u540E\u67E5\u770B\u8BE6\u7EC6\u5185\u5BB9`, '');
      addRow('3\u3001\u51C6\u5907\u5206\u5DE5', `${prepTasks.length}\u6761\uFF0C\u4ED8\u8D39\u540E\u67E5\u770B\u8BE6\u7EC6\u5185\u5BB9`, '');
      addRow('4\u3001\u6295\u6807\u5EFA\u8BAE', '\u4ED8\u8D39\u540E\u67E5\u770B', '', true);
    }

    // ==================== Render autoTable ====================
    doc.addPage();

    rows.forEach(row => {
      if (!row.isSeparator) {
        row.data = formatNumberedItems(row.data);
      }
    });

    const head = [['\u7F16\u53F7', '\u5B57\u6BB5\u540D\u79F0', '\u9879\u76EE\u6570\u636E', '\u6765\u6E90\u5B9A\u4F4D']];
    const body = rows.map((r) => {
      if (r.isSeparator) return [{ content: '' }, { content: r.data || '', colSpan: 3, styles: { fillColor: r.separatorColor || colors.brandPurple, textColor: colors.white, fontStyle: 'bold', fontSize: 10 } }, {}, {}];
      return [r.no, r.fieldName, r.data, r.source];
    });

    (autoTable as any)(doc, {
      startY: 15,
      head,
      body: body as any,
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 12 },   // 编号
        1: { cellWidth: 32 },   // 字段名称
        2: { cellWidth: 170 },  // 项目数据（占满剩余空间）
        3: { cellWidth: 59 },   // 来源定位
      },
      styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', font: 'SimHei', lineHeight: 1.4 } as any,
      headStyles: { fillColor: colors.brandPurple, textColor: colors.white, fontStyle: 'bold', fontSize: 8 } as any,
      alternateRowStyles: { fillColor: [248, 248, 252] },
      didParseCell: (data: any) => {
        const row = rows[data.row.index];
        if (!row) return;

        if (row.isSeparator && row.separatorColor) {
          for (let i = 0; i < 4; i++) {
            data.cell.styles.fillColor = row.separatorColor;
            data.cell.styles.textColor = colors.white;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
          }
        }

        if (row.isCritical && !row.isSeparator) {
          if (data.column.index >= 0) {
            data.cell.styles.fillColor = [255, 245, 238];
          }
          if (data.column.index === 2) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    const finalY = (doc as any).lastAutoTable.finalY || 15;
    doc.setFontSize(8);
    doc.setTextColor(139, 155, 180);
    doc.setFont('SimHei', 'bold');
    doc.text('OpenCheck', margin, pageHeight - 8);
    doc.setFont('SimHei', 'normal');
    doc.text('BID DECISION OS', margin + 35, pageHeight - 8);
    doc.text(`\u5171 ${doc.getNumberOfPages()} \u9875`, pageWidth - margin, pageHeight - 8, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bid-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: '\u751F\u6210PDF\u5931\u8D25' }, { status: 500 });
  }
}
