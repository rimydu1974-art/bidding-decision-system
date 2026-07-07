import * as lark from '@larksuiteoapi/node-sdk';

// 飞书SDK客户端缓存（按appId区分）
const clientCache = new Map<string, lark.Client>();

function getClient(appId: string, appSecret: string): lark.Client {
  const cacheKey = appId;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  const client = new lark.Client({
    appId,
    appSecret,
    appType: lark.AppType.SelfBuild,
  });
  clientCache.set(cacheKey, client);
  return client;
}

function getAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('飞书应用凭证未配置，请在 .env.local 中设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET');
  }
  return { appId, appSecret };
}

// ============================================================
// 云盘文件相关 API（替代知识库API）
// ============================================================

export interface DriveFile {
  token: string;
  name: string;
  type: string; // file / folder / doc / docx / sheet / ...
  url?: string;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * 获取云盘根目录文件列表
 */
export async function getDriveRootFiles(): Promise<DriveFile[]> {
  const { appId, appSecret } = getAppCredentials();
  const client = getClient(appId, appSecret);

  try {
    console.log('[Feishu] Calling drive.file.list (root)');
    const resp = await client.drive.file.list({
      params: { page_size: 200 },
    });

    console.log('[Feishu] drive.file.list code:', resp.code, 'msg:', resp.msg);
    console.log('[Feishu] drive.file.list data:', JSON.stringify(resp.data, null, 2));

    if (resp.code !== 0) {
      throw new Error(`飞书API错误 (code=${resp.code}): ${resp.msg}`);
    }

    const files = resp.data?.files || [];
    console.log('[Feishu] Found', files.length, 'files in root');
    return files.map((f: any) => ({
      token: f.token || '',
      name: f.name || '未命名',
      type: f.type || 'file',
      url: f.url,
      createdTime: f.created_time,
      modifiedTime: f.modified_time,
    }));
  } catch (error: any) {
    console.error('[Feishu] Failed to get drive root files:', error.message);
    throw new Error(`获取云盘文件列表失败: ${error.message}`);
  }
}

/**
 * 获取指定文件夹下的文件列表
 */
export async function getDriveFolderFiles(folderToken: string): Promise<DriveFile[]> {
  const { appId, appSecret } = getAppCredentials();
  const client = getClient(appId, appSecret);

  try {
    console.log('[Feishu] Calling drive.file.list (folder:', folderToken, ')');
    const resp = await client.drive.file.list({
      params: { page_size: 200, folder_token: folderToken, order_by: 'EditedTime', direction: 'DESC' },
    });

    console.log('[Feishu] drive.file.list response code:', resp.code, 'msg:', resp.msg);

    if (resp.code !== 0) {
      throw new Error(`飞书API错误 (code=${resp.code}): ${resp.msg}`);
    }

    const files = resp.data?.files || [];
    console.log('[Feishu] Found', files.length, 'files in folder');
    return files.map((f: any) => ({
      token: f.token || '',
      name: f.name || '未命名',
      type: f.type || 'file',
      url: f.url,
      createdTime: f.created_time,
      modifiedTime: f.modified_time,
    }));
  } catch (error: any) {
    console.error('[Feishu] Failed to get folder files:', error.message);
    throw new Error(`获取文件夹内容失败: ${error.message}`);
  }
}

/**
 * 递归获取文件夹下所有文档（支持子文件夹）
 */
export async function getAllDriveFilesRecursive(folderToken?: string): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];

  async function fetchFolder(token: string | undefined) {
    try {
      const files = token
        ? await getDriveFolderFiles(token)
        : await getDriveRootFiles();

      for (const file of files) {
        if (file.type === 'folder') {
          // 递归获取子文件夹
          await fetchFolder(file.token);
        } else {
          allFiles.push(file);
        }
      }
    } catch (error: any) {
      console.error('[Feishu] Error fetching folder:', error.message);
    }
  }

  await fetchFolder(folderToken);
  return allFiles;
}

/**
 * 获取飞书文档内容（纯文本）- 支持 docx 类型
 */
export async function getDocumentContent(documentId: string): Promise<string> {
  const { appId, appSecret } = getAppCredentials();
  const client = getClient(appId, appSecret);

  try {
    console.log('[Feishu] Getting document content for:', documentId);
    const resp = await client.docx.document.rawContent({
      path: { document_id: documentId },
    });

    console.log('[Feishu] docx.document.rawContent response code:', resp.code);

    if (resp.code !== 0) {
      throw new Error(`飞书API错误 (code=${resp.code}): ${resp.msg}`);
    }

    return resp.data?.content || '';
  } catch (error: any) {
    console.error('[Feishu] Failed to get document content:', error.message);
    throw new Error(`获取文档内容失败: ${error.message}`);
  }
}

// ============================================================
// 消息通知相关 API
// ============================================================

/**
 * 发送文本消息
 */
export async function sendTextMessage(receiveId: string, text: string): Promise<any> {
  const { appId, appSecret } = getAppCredentials();
  const client = getClient(appId, appSecret);

  const resp = await client.im.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: receiveId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });

  return resp;
}

/**
 * 发送卡片消息
 */
export async function sendCardMessage(receiveId: string, card: any, receiveIdType: string = 'chat_id'): Promise<any> {
  const { appId, appSecret } = getAppCredentials();
  const client = getClient(appId, appSecret);

  const resp = await client.im.message.create({
    params: { receive_id_type: receiveIdType as any },
    data: {
      receive_id: receiveId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    },
  });

  return resp;
}

// ============================================================
// 测试连接
// ============================================================

/**
 * 测试飞书连接是否正常
 */
export async function testConnection(): Promise<{ success: boolean; message: string; files?: DriveFile[] }> {
  try {
    const files = await getDriveRootFiles();
    return {
      success: true,
      message: `连接成功，云盘中有 ${files.length} 个文件`,
      files,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
    };
  }
}
