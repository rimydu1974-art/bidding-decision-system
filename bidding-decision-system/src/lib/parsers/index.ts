import { ParsedDocument, TableData, DocumentMetadata } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseLib = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WordExtractor = require('word-extractor');

// pdf-parse可能导出为module.default或module本身
const pdfParse = pdfParseLib.default || pdfParseLib;

export async function parseFile(file: File): Promise<ParsedDocument> {
  const buffer = await file.arrayBuffer();
  const fileType = file.type || getFileTypeFromName(file.name);

  let content = '';
  let tables: TableData[] = [];

  switch (fileType) {
    case 'application/pdf':
      const pdfResult = await parsePDF(buffer);
      content = pdfResult.content;
      tables = pdfResult.tables;
      break;

    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const docResult = await parseWord(buffer, fileType);
      content = docResult.content;
      tables = docResult.tables;
      break;

    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      const excelResult = await parseExcel(buffer);
      content = excelResult.content;
      tables = excelResult.tables;
      break;

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  const metadata: DocumentMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType,
  };

  return {
    title: extractTitle(content, file.name),
    content,
    tables,
    metadata,
  };
}

function getFileTypeFromName(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return typeMap[ext || ''] || 'application/octet-stream';
}

function extractTitle(content: string, fileName: string): string {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length > 5 && firstLine.length < 100) {
      return firstLine;
    }
  }
  return fileName.replace(/\.[^/.]+$/, '');
}

async function parsePDF(
  buffer: ArrayBuffer
): Promise<{ content: string; tables: TableData[] }> {
  try {
    console.log('[PDF] 开始解析PDF文件...');
    const dataBuffer = Buffer.from(buffer);
    console.log('[PDF] Buffer创建成功, 大小:', dataBuffer.length);
    
    const data = await pdfParse(dataBuffer);
    console.log('[PDF] 解析完成, 文本长度:', data.text?.length || 0);
    
    const content = data.text || '';
    const tables = extractTablesFromText(content);
    return { content, tables };
  } catch (error) {
    console.error('[PDF] 解析错误:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return { content: `[PDF解析失败: ${errMsg}]`, tables: [] };
  }
}

async function parseWord(
  buffer: ArrayBuffer,
  fileType: string
): Promise<{ content: string; tables: TableData[] }> {
  try {
    console.log('[Word] 开始解析, 大小:', buffer.byteLength, '类型:', fileType);
    
    // .doc格式使用word-extractor解析
    if (fileType === 'application/msword') {
      console.log('[Word] 使用word-extractor解析.doc文件');
      const extractor = new WordExtractor();
      const result = await extractor.extract(buffer);
      const content = result.getBody() || '';
      console.log('[Word] .doc解析完成, 内容长度:', content.length);
      
      if (!content || content.trim().length < 5) {
        console.warn('[Word] .doc解析内容过短或为空');
        return { content: '[Word文件内容为空或无法解析，请尝试PDF版本]', tables: [] };
      }
      
      const tables = extractTablesFromText(content);
      return { content, tables };
    }
    
    // .docx格式使用mammoth解析
    console.log('[Word] 使用mammoth解析.docx文件');
    const uint8Array = new Uint8Array(buffer);
    const nodeBuffer = Buffer.from(uint8Array);
    console.log('[Word] Buffer创建成功');
    
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    console.log('[Word] .docx解析完成, 内容长度:', result.value?.length || 0);
    
    const content = result.value || '';
    
    if (!content || content.trim().length < 5) {
      console.warn('[Word] .docx解析内容过短或为空');
      return { content: '[Word文件内容为空或无法解析，请尝试PDF版本]', tables: [] };
    }
    
    const tables = extractTablesFromText(content);
    return { content, tables };
  } catch (error) {
    console.error('[Word] 解析错误:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return { content: `[Word解析失败: ${errMsg}]`, tables: [] };
  }
}

async function parseExcel(
  buffer: ArrayBuffer
): Promise<{ content: string; tables: TableData[] }> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    let content = '';
    const tables: TableData[] = [];

    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      const headers = jsonData[0] || [];
      const rows = jsonData.slice(1);

      tables.push({
        name: sheetName,
        headers: headers.map((h: string) => String(h || '')),
        rows: rows.map((row: string[]) => row.map((cell: string) => String(cell || ''))),
      });

      content += `[${sheetName}]\n`;
      content += headers.join(' | ') + '\n';
      content += rows.map((row: string[]) => row.join(' | ')).join('\n') + '\n\n';
    });

    return { content, tables };
  } catch (error) {
    console.error('Excel parsing error:', error);
    return { content: '[Excel解析失败]', tables: [] };
  }
}

function extractTablesFromText(text: string): TableData[] {
  const tables: TableData[] = [];
  const lines = text.split('\n');

  let currentTable: string[][] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('|') || trimmed.includes('\t')) {
      const delimiter = trimmed.includes('|') ? '|' : '\t';
      const cells = trimmed
        .split(delimiter)
        .map((cell: string) => cell.trim())
        .filter((cell: string) => cell);

      if (cells.length >= 2) {
        if (!inTable) {
          inTable = true;
          currentTable = [];
        }
        currentTable.push(cells);
      }
    } else {
      if (inTable && currentTable.length >= 2) {
        tables.push({
          name: `Table ${tables.length + 1}`,
          headers: currentTable[0],
          rows: currentTable.slice(1),
        });
      }
      inTable = false;
      currentTable = [];
    }
  }

  if (inTable && currentTable.length >= 2) {
    tables.push({
      name: `Table ${tables.length + 1}`,
      headers: currentTable[0],
      rows: currentTable.slice(1),
    });
  }

  return tables;
}
