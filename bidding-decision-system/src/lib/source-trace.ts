// 5D数据溯源模块 - 治AI幻觉
// 所有AI输出必须包含5维溯源定位

export interface Source5D {
  file_type: string;        // 招标文件
  system_page: string;      // 系统第X页
  original_page: string;    // 原文页码第X页
  chapter_clause: string;   // 第X部分 X.X条
  exact_quote: string;      // 10-50字原文摘录
}

// 注入页码标记到文档内容
export function injectPageAnchors(text: string): string {
  const lines = text.split('\n');
  let pageCount = 1;

  return lines.map((line, index) => {
    // 每50行插入一个页码标记（直接用PDF第X页格式，便于AI识别）
    if (index > 0 && index % 50 === 0) {
      pageCount++;
      return `\n\n--- PDF第${pageCount}页 ---\n\n${line}`;
    }
    return line;
  }).join('\n');
}

// 从AI响应中提取5D溯源信息
export function extractSource5D(sourceStr: string): Source5D | null {
  if (!sourceStr) return null;
  
  try {
    // 尝试JSON解析
    const parsed = JSON.parse(sourceStr);
    if (parsed.file_type && parsed.system_page) {
      return parsed as Source5D;
    }
  } catch {
    // 非JSON格式，尝试正则提取
  }
  
  // 正则提取
  const fileTypeMatch = sourceStr.match(/招标文件|投标文件|合同/);
  const systemPageMatch = sourceStr.match(/系统第(\d+)页/);
  const pdfPageMatch = sourceStr.match(/PDF第(\d+)页/);
  const originalPageMatch = sourceStr.match(/原文页码第(\d+)页/);
  const chapterMatch = sourceStr.match(/第[一二三四五六七八九十]+部分\s*[\d.]+条/);
  const quoteMatch = sourceStr.match(/["「](.{10,50})["」]/);
  
  if (fileTypeMatch || pdfPageMatch || systemPageMatch) {
    const pageNum = pdfPageMatch?.[1] || systemPageMatch?.[1] || '';
    return {
      file_type: fileTypeMatch?.[0] || '招标文件',
      system_page: pageNum ? `系统第${pageNum}页` : '未知',
      original_page: originalPageMatch ? `原文页码第${originalPageMatch[1]}页` : '未知',
      chapter_clause: chapterMatch?.[0] || '未知',
      exact_quote: quoteMatch?.[1] || '未提供原文摘录',
    };
  }
  
  return null;
}

// 验证5D溯源是否完整
export function validateSource5D(source: Source5D | null): {
  valid: boolean;
  missing: string[];
} {
  if (!source) {
    return { valid: false, missing: ['file_type', 'system_page', 'original_page', 'chapter_clause', 'exact_quote'] };
  }
  
  const missing: string[] = [];
  if (!source.file_type || source.file_type === '未知') missing.push('file_type');
  if (!source.system_page || source.system_page === '未知') missing.push('system_page');
  if (!source.original_page || source.original_page === '未知') missing.push('original_page');
  if (!source.chapter_clause || source.chapter_clause === '未知') missing.push('chapter_clause');
  if (!source.exact_quote || source.exact_quote === '未提供原文摘录' || source.exact_quote.length < 10) missing.push('exact_quote');
  
  return { valid: missing.length === 0, missing };
}

// 格式化5D溯源为可读文本
export function formatSource5D(source: Source5D): string {
  return `${source.file_type} | ${source.system_page} | ${source.original_page} | ${source.chapter_clause} | "${source.exact_quote}"`;
}
