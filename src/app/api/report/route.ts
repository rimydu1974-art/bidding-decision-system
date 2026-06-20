import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('投标决策评估表');

    sheet.columns = [
      { header: '类别', key: 'category', width: 15 },
      { header: '字段名称', key: 'fieldName', width: 25 },
      { header: '项目数据', key: 'projectData', width: 30 },
      { header: '备注/决策参考', key: 'reference', width: 30 },
      { header: '风险等级', key: 'riskLevel', width: 12 },
      { header: '是否影响废标', key: 'affectsVoid', width: 12 },
      { header: '是否影响得分', key: 'affectsScore', width: 12 },
      { header: '建议动作', key: 'suggestion', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // 基本信息
    const basicInfo = data.basicInfo || {};
    sheet.addRow({
      category: '基本信息',
      fieldName: '项目名称',
      projectData: basicInfo.projectName || data.projectName || '-',
      reference: '',
      riskLevel: '',
      affectsVoid: '',
      affectsScore: '',
      suggestion: '',
    });
    sheet.addRow({
      category: '基本信息',
      fieldName: '项目编号',
      projectData: basicInfo.projectCode || '-',
      reference: '',
      riskLevel: '',
      affectsVoid: '',
      affectsScore: '',
      suggestion: '',
    });
    sheet.addRow({
      category: '基本信息',
      fieldName: '预算金额',
      projectData: `${basicInfo.budget || data.budget || 0}元`,
      reference: '',
      riskLevel: '',
      affectsVoid: '',
      affectsScore: '',
      suggestion: '',
    });
    sheet.addRow({
      category: '基本信息',
      fieldName: '招标人',
      projectData: basicInfo.tenderer || '-',
      reference: '',
      riskLevel: '',
      affectsVoid: '',
      affectsScore: '',
      suggestion: '',
    });

    // 风险清单
    const risks = data.risks || [];
    risks.forEach((risk: Record<string, string>) => {
      const riskColors: Record<string, string> = {
        critical: 'FFFF0000',
        high: 'FFFF6600',
        medium: 'FFFFC000',
        low: 'FF92D050',
      };
      sheet.addRow({
        category: '风险',
        fieldName: risk.title || '风险项',
        projectData: risk.description || '',
        reference: risk.source || '',
        riskLevel: risk.level === 'critical' ? '严重' : risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低',
        affectsVoid: risk.category === 'void' ? '是' : '否',
        affectsScore: risk.category === 'score' ? '是' : '否',
        suggestion: risk.suggestion || '',
      });
    });

    // 任务清单
    const tasks = data.tasks || [];
    tasks.forEach((task: Record<string, string>) => {
      sheet.addRow({
        category: '准备任务',
        fieldName: task.name || '任务',
        projectData: task.status === 'completed' ? '已完成' : task.status === 'in-progress' ? '进行中' : '待处理',
        reference: '',
        riskLevel: '',
        affectsVoid: '',
        affectsScore: '',
        suggestion: task.priority === 'high' ? '优先处理' : '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="assessment-report-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: '生成报告失败' },
      { status: 500 }
    );
  }
}
