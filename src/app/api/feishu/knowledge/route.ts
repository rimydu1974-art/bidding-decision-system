import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeBaseList, getKnowledgeBaseNodes, getDocumentContent } from '@/lib/feishu';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const spaceId = searchParams.get('spaceId');
    const documentId = searchParams.get('documentId');

    switch (action) {
      case 'list': {
        const spaces = await getKnowledgeBaseList();
        return NextResponse.json({ spaces });
      }

      case 'nodes': {
        if (!spaceId) {
          return NextResponse.json({ error: '缺少spaceId' }, { status: 400 });
        }
        const nodes = await getKnowledgeBaseNodes(spaceId);
        return NextResponse.json({ nodes });
      }

      case 'content': {
        if (!documentId) {
          return NextResponse.json({ error: '缺少documentId' }, { status: 400 });
        }
        const content = await getDocumentContent(documentId);
        return NextResponse.json({ content });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Feishu knowledge base error:', error);
    return NextResponse.json(
      { error: '获取飞书知识库失败' },
      { status: 500 }
    );
  }
}

// 同步飞书文档到本地知识库
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

    const { documentId, title, content, category } = await request.json();

    if (!documentId || !title) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 存储到本地知识库（使用KnowledgeItem表）
    const knowledgeItem = await prisma.knowledgeItem.create({
      data: {
        userId: session.user.id,
        title,
        category: category || '飞书文档',
        content: content || '',
        tags: JSON.stringify(['飞书同步']),
        fileType: 'feishu',
        source: 'feishu',
        sourceId: documentId,
      },
    });

    return NextResponse.json({ item: knowledgeItem });
  } catch (error) {
    console.error('Feishu sync error:', error);
    return NextResponse.json(
      { error: '同步飞书文档失败' },
      { status: 500 }
    );
  }
}
