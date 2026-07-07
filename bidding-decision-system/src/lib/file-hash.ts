// 文件Hash去重模块 - 降成本
// 防止重复OCR/API调用，相同文件直接返回缓存结果

import prisma from '@/lib/db';

// 计算文件SHA256 Hash
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 计算文本Hash（用于纯文本内容）
export function calculateTextHash(text: string): string {
  // 使用简单的哈希算法（生产环境建议使用SHA-256）
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// 检查文件是否已存在（去重）
export async function checkFileExists(hash: string): Promise<{
  exists: boolean;
  projectId?: string;
  assessmentId?: string;
  fileName?: string;
}> {
  const existing = await prisma.fileHash.findUnique({
    where: { hash },
  });
  
  if (existing) {
    // 查找关联的评估结果
    const assessment = await prisma.assessment.findFirst({
      where: { userId: existing.userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      exists: true,
      projectId: existing.projectId || undefined,
      assessmentId: assessment?.id,
      fileName: existing.fileName,
    };
  }
  
  return { exists: false };
}

// 保存文件Hash
export async function saveFileHash(
  hash: string,
  fileName: string,
  fileSize: number,
  userId: string,
  projectId?: string
): Promise<void> {
  try {
    await prisma.fileHash.create({
      data: {
        hash,
        fileName,
        fileSize,
        userId,
        projectId,
      },
    });
  } catch (error) {
    // Hash冲突或重复保存，忽略
    console.error('[FileHash] 保存失败:', error);
  }
}

// 获取文件Hash统计
export async function getFileHashStats(userId?: string): Promise<{
  totalFiles: number;
  totalSize: number;
  duplicatesAvoided: number;
}> {
  const where = userId ? { userId } : {};
  
  const [totalFiles, totalSize] = await Promise.all([
    prisma.fileHash.count({ where }),
    prisma.fileHash.aggregate({ where, _sum: { fileSize: true } }),
  ]);
  
  return {
    totalFiles,
    totalSize: totalSize._sum.fileSize || 0,
    duplicatesAvoided: 0, // Hash是unique的，理论上不会有重复
  };
}
