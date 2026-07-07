/**
 * PRD PDF 导出脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install jspdf jspdf-autotable
 * 2. 运行脚本：node scripts/export-prd.js
 */

const fs = require('fs');
const path = require('path');

// 读取PRD内容
const prdPath = path.join(__dirname, '../docs/PRD-OPENCHECK-智标系统.md');
const prdContent = fs.readFileSync(prdPath, 'utf-8');

// 简单的Markdown转文本处理
function markdownToText(md) {
  return md
    .replace(/#{1,6}\s/g, '')  // 移除标题标记
    .replace(/\*\*/g, '')      // 移除加粗
    .replace(/\*/g, '')        // 移除斜体
    .replace(/`{3}[\s\S]*?`{3}/g, (match) => {  // 代码块
      return match.replace(/`{3}\w*\n/g, '').replace(/`{3}/g, '');
    })
    .replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''))  // 行内代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片: $1]')  // 图片
    .replace(/\|[-: ]+\|/g, '')  // 表格分隔线
    .replace(/\|([^|]+)\|/g, (match, content) => {  // 表格内容
      return content.trim() + '\n';
    })
    .replace(/---+/g, '\n')  // 水平线
    .replace(/\n{3,}/g, '\n\n')  // 多个空行
    .trim();
}

// 生成PDF的函数
async function generatePDF() {
  try {
    // 动态导入jspdf
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    
    // 颜色定义
    const colors = {
      primary: [68, 114, 196],
      header: [41, 128, 185],
      success: [39, 174, 96],
      warning: [243, 156, 18],
      danger: [231, 76, 60],
      black: [51, 51, 51],
      gray: [128, 128, 128],
      light: [245, 245, 245],
    };
    
    let currentY = margin;
    
    // 封面
    doc.setFontSize(24);
    doc.setTextColor(...colors.primary);
    doc.text('OPENCHECK 智标系统', pageWidth / 2, 60, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(...colors.black);
    doc.text('产品需求文档 (PRD)', pageWidth / 2, 75, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(...colors.gray);
    doc.text('版本：v1.0', pageWidth / 2, 95, { align: 'center' });
    doc.text('日期：2026年6月27日', pageWidth / 2, 105, { align: 'center' });
    doc.text('状态：第一阶段完成', pageWidth / 2, 115, { align: 'center' });
    
    // 添加页面
    doc.addPage();
    currentY = margin;
    
    // 解析并输出内容
    const lines = prdContent.split('\n');
    
    for (const line of lines) {
      // 检查是否需要换页
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      // 处理标题
      if (line.startsWith('# ')) {
        doc.setFontSize(18);
        doc.setTextColor(...colors.primary);
        doc.text(line.replace(/^#+\s/, ''), margin, currentY);
        currentY += 10;
      } else if (line.startsWith('## ')) {
        doc.setFontSize(14);
        doc.setTextColor(...colors.header);
        doc.text(line.replace(/^#+\s/, ''), margin, currentY);
        currentY += 8;
      } else if (line.startsWith('### ')) {
        doc.setFontSize(12);
        doc.setTextColor(...colors.black);
        doc.setFont(undefined, 'bold');
        doc.text(line.replace(/^#+\s/, ''), margin, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 7;
      } else if (line.startsWith('#### ')) {
        doc.setFontSize(11);
        doc.setTextColor(...colors.black);
        doc.text(line.replace(/^#+\s/, ''), margin, currentY);
        currentY += 6;
      } else if (line.startsWith('|')) {
        // 表格行 - 简单处理
        doc.setFontSize(9);
        doc.setTextColor(...colors.black);
        const cleanLine = line.replace(/\|/g, ' ').replace(/-/g, ' ').trim();
        if (cleanLine) {
          doc.text(cleanLine, margin, currentY);
          currentY += 5;
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // 列表项
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        doc.text('• ' + line.replace(/^[-*]\s/, ''), margin + 5, currentY);
        currentY += 5;
      } else if (line.match(/^\d+\.\s/)) {
        // 有序列表
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        doc.text(line, margin + 5, currentY);
        currentY += 5;
      } else if (line.startsWith('```')) {
        // 代码块标记 - 跳过
        continue;
      } else if (line.trim()) {
        // 普通文本
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        
        // 处理长文本换行
        const textWidth = doc.getTextWidth(line);
        if (textWidth > contentWidth) {
          const words = line.split('');
          let currentLine = '';
          for (const char of words) {
            const testLine = currentLine + char;
            if (doc.getTextWidth(testLine) > contentWidth) {
              doc.text(currentLine, margin, currentY);
              currentY += 5;
              currentLine = char;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            doc.text(currentLine, margin, currentY);
            currentY += 5;
          }
        } else {
          doc.text(line, margin, currentY);
          currentY += 5;
        }
      }
      
      // 空行
      if (line.trim() === '') {
        currentY += 3;
      }
    }
    
    // 添加页脚
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...colors.gray);
      doc.text(
        `OPENCHECK 智标系统 - PRD v1.0 - 第 ${i} 页 / 共 ${totalPages} 页`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // 保存PDF
    const outputPath = path.join(__dirname, '../docs/PRD-OPENCHECK-智标系统.pdf');
    const pdfBuffer = doc.output('arraybuffer');
    fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));
    
    console.log('PDF生成成功：', outputPath);
    console.log('文件大小：', (pdfBuffer.byteLength / 1024).toFixed(2), 'KB');
    
  } catch (error) {
    console.error('PDF生成失败：', error);
    console.log('\n请先安装依赖：');
    console.log('npm install jspdf jspdf-autotable --save --legacy-peer-deps');
  }
}

// 运行
generatePDF();
