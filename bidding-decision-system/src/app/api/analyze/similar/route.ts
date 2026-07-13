import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * 查询类似项目 API
 * 根据招标文件内容，从知识库中查询类似项目
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { projectName, projectCode, category, keywords, limit = 5 } = body;

    // 构建搜索关键词
    const searchTerms: string[] = [];
    if (projectName) searchTerms.push(projectName);
    if (projectCode) searchTerms.push(projectCode);
    if (category) searchTerms.push(category);
    if (keywords && Array.isArray(keywords)) {
      searchTerms.push(...keywords);
    }

    if (searchTerms.length === 0) {
      return NextResponse.json({ similarProjects: [], similarCases: [] });
    }

    // 查询类似的知识库条目 (Q&A)
    const similarKnowledge = await prisma.knowledgeItem.findMany({
      where: {
        OR: searchTerms.map(term => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { content: { contains: term, mode: 'insensitive' } },
          ],
        })),
      },
      take: limit,
      orderBy: { usageCount: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        tags: true,
      },
    });

    // 查询类似的招标案例
    const similarCases = await prisma.case.findMany({
      where: {
        AND: [
          { status: 'published' },
          {
            OR: searchTerms.map(term => ({
              OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { content: { contains: term, mode: 'insensitive' } },
                { industry: { contains: term, mode: 'insensitive' } },
              ],
            })),
          },
        ],
      },
      take: limit,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        industry: true,
        summary: true,
        content: true,
        tags: true,
        views: true,
        createdAt: true,
      },
    });

    // 查询类似的历史评估
    const similarAssessments = await prisma.assessment.findMany({
      where: {
        OR: searchTerms.map(term => ({
          OR: [
            { projectName: { contains: term, mode: 'insensitive' } },
          ],
        })),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectName: true,
        budget: true,
        riskLevel: true,
        recommendation: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      similarKnowledge: similarKnowledge.map(k => ({
        id: k.id,
        title: k.title,
        category: k.category,
        summary: k.content.substring(0, 200) + '...',
        tags: JSON.parse(k.tags || '[]'),
      })),
      similarCases: similarCases.map(c => ({
        id: c.id,
        title: c.title,
        industry: c.industry,
        summary: c.summary || c.content.substring(0, 200) + '...',
        tags: JSON.parse(c.tags || '[]'),
        views: c.views,
        createdAt: c.createdAt,
      })),
      similarAssessments: similarAssessments.map(a => ({
        id: a.id,
        projectName: a.projectName,
        budget: a.budget,
        riskLevel: a.riskLevel,
        recommendation: a.recommendation,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('[SimilarProjects] 查询错误:', error);
    return NextResponse.json(
      { error: '查询失败，请重试' },
      { status: 500 }
    );
  }
}
