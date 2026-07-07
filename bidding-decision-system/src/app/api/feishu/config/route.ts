import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { testConnection, getDriveRootFiles, getDriveFolderFiles, getAllDriveFilesRecursive, getDocumentContent } from '@/lib/feishu';

export const dynamic = 'force-dynamic';

// 获取飞书连接状态
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        feishuConnected: true,
        feishuSpaceId: true,
        feishuSpaceName: true,
        feishuLastSyncAt: true,
      },
    });

    // 获取飞书同步的文档数量
    const feishuDocCount = await prisma.knowledgeItem.count({
      where: { userId: session.user.id, source: 'feishu' },
    });

    return NextResponse.json({
      connected: user?.feishuConnected || false,
      spaceId: user?.feishuSpaceId || null,
      spaceName: user?.feishuSpaceName || null,
      lastSyncAt: user?.feishuLastSyncAt || null,
      docCount: feishuDocCount,
    });
  } catch (error) {
    console.error('Get feishu config error:', error);
    return NextResponse.json({ error: '获取飞书配置失败' }, { status: 500 });
  }
}

// 测试连接 / 连接飞书 / 同步文档 / 断开连接
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

    const { action, folderToken, folderName } = await request.json();

    switch (action) {
      case 'test': {
        const result = await testConnection();
        return NextResponse.json(result);
      }

      case 'list-files': {
        // 列出指定文件夹或根目录的文件
        const token = folderToken || undefined;
        const files = token
          ? await getDriveFolderFiles(token)
          : await getDriveRootFiles();
        return NextResponse.json({ files });
      }

      case 'connect': {
        if (!folderToken) {
          return NextResponse.json({ error: '请选择要同步的文件夹' }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            feishuConnected: true,
            feishuSpaceId: folderToken,
            feishuSpaceName: folderName || '云盘文件',
          },
        });
        return NextResponse.json({ success: true, message: '飞书连接成功' });
      }

      case 'disconnect': {
        // 删除所有飞书同步的知识条目
        const deleted = await prisma.knowledgeItem.deleteMany({
          where: { userId: session.user.id, source: 'feishu' },
        });

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            feishuConnected: false,
            feishuSpaceId: null,
            feishuSpaceName: null,
            feishuLastSyncAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: `已断开飞书连接，删除了 ${deleted.count} 个同步文档`,
        });
      }

      case 'sync': {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { feishuSpaceId: true, feishuConnected: true },
        });

        if (!user?.feishuConnected || !user?.feishuSpaceId) {
          return NextResponse.json({ error: '请先连接飞书' }, { status: 400 });
        }

        // 获取飞书文件列表（递归）
        const files = await getAllDriveFilesRecursive(user.feishuSpaceId);

        let syncCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const file of files) {
          // 跳过文件夹
          if (file.type === 'folder') continue;

          // 检查是否已同步（去重）
          const existing = await prisma.knowledgeItem.findFirst({
            where: {
              userId: session.user.id,
              sourceId: file.token,
              source: 'feishu',
            },
          });

          if (existing) {
            skipCount++;
            continue;
          }

          try {
            let content = '';

            // docx 类型尝试读取内容
            if (file.type === 'docx') {
              try {
                content = await getDocumentContent(file.token);
              } catch {
                content = `[飞书文档] ${file.name}`;
              }
            } else {
              // PDF/doc/其他类型保存元信息
              content = `[飞书${file.type.toUpperCase()}文件] ${file.name}\n文件链接: ${file.url || '无'}`;
            }

            await prisma.knowledgeItem.create({
              data: {
                userId: session.user.id,
                title: file.name.replace(/\.[^.]+$/, ''),
                category: '飞书文档',
                content,
                tags: JSON.stringify(['飞书同步', file.type]),
                fileType: file.type === 'docx' ? 'feishu' : file.type,
                source: 'feishu',
                sourceId: file.token,
              },
            });
            syncCount++;
          } catch (err) {
            console.error(`Failed to sync document ${file.name}:`, err);
            errorCount++;
          }
        }

        // 更新最后同步时间
        await prisma.user.update({
          where: { id: session.user.id },
          data: { feishuLastSyncAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          message: `同步完成：新增 ${syncCount} 个文档，跳过 ${skipCount} 个已存在，${errorCount} 个失败`,
          syncCount,
          skipCount,
          errorCount,
          total: files.length,
        });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Feishu config error:', error);
    return NextResponse.json(
      { error: error.message || '操作失败' },
      { status: 500 }
    );
  }
}
