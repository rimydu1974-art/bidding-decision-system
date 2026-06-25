// 飞书API配置
export const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || '',
  encryptKey: process.env.FEISHU_ENCRYPT_KEY || '',
};

// 飞书API基础URL
const BASE_URL = 'https://open.feishu.cn/open-apis';

// 获取tenant_access_token
export async function getTenantAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_CONFIG.appId,
      app_secret: FEISHU_CONFIG.appSecret,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Failed to get tenant_access_token: ${data.msg}`);
  }

  return data.tenant_access_token;
}

// 通用API请求
export async function feishuRequest(
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  const accessToken = token || (await getTenantAccessToken());

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return data;
}

// ========== 文档相关 ==========

// 获取知识库列表
export async function getKnowledgeBaseList() {
  return feishuRequest('GET', '/wiki/v2/spaces');
}

// 获取知识库节点列表
export async function getKnowledgeBaseNodes(spaceId: string) {
  return feishuRequest('GET', `/wiki/v2/spaces/${spaceId}/nodes`);
}

// 获取文档内容
export async function getDocumentContent(documentId: string) {
  return feishuRequest('GET', `/docx/v1/documents/${documentId}/raw_content`);
}

// 获取文档块内容
export async function getDocumentBlocks(documentId: string) {
  return feishuRequest('GET', `/docx/v1/documents/${documentId}/blocks`);
}

// ========== 多维表格相关 ==========

// 获取多维表格列表
export async function getBitableList() {
  return feishuRequest('GET', '/bitable/v1/apps');
}

// 获取多维表格记录
export async function getBitableRecords(appToken: string, tableId: string) {
  return feishuRequest('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
}

// 新增多维表格记录
export async function addBitableRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, unknown>
) {
  return feishuRequest(
    'POST',
    `/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    { fields }
  );
}

// ========== 消息推送 ==========

// 发送文本消息
export async function sendTextMessage(
  receiveId: string,
  text: string,
  receiveIdType: 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id' = 'open_id'
) {
  return feishuRequest(
    'POST',
    `/im/v1/messages?receive_id_type=${receiveIdType}`,
    {
      receive_id: receiveId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }
  );
}

// 发送富文本消息
export async function sendRichTextMessage(
  receiveId: string,
  title: string,
  content: Array<Array<{ tag: string; text?: string; href?: string }>>,
  receiveIdType: 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id' = 'open_id'
) {
  return feishuRequest(
    'POST',
    `/im/v1/messages?receive_id_type=${receiveIdType}`,
    {
      receive_id: receiveId,
      msg_type: 'post',
      content: JSON.stringify({
        post: {
          zh_cn: {
            title,
            content,
          },
        },
      }),
    }
  );
}

// 发送卡片消息
export async function sendCardMessage(
  receiveId: string,
  card: Record<string, unknown>,
  receiveIdType: 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id' = 'open_id'
) {
  return feishuRequest(
    'POST',
    `/im/v1/messages?receive_id_type=${receiveIdType}`,
    {
      receive_id: receiveId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }
  );
}

// ========== 用户相关 ==========

// 获取用户信息
export async function getUserInfo(userId: string, userIdType: 'open_id' | 'user_id' = 'open_id') {
  return feishuRequest('GET', `/contact/v3/users/${userId}?user_id_type=${userIdType}`);
}

// ========== 云盘相关 ==========

// 获取文件下载链接
export async function getFileDownloadUrl(fileToken: string) {
  return feishuRequest('GET', `/drive/v1/files/${fileToken}/download`);
}

// 上传文件
export async function uploadFile(fileName: string, fileData: ArrayBuffer, parentToken?: string) {
  const accessToken = await getTenantAccessToken();

  const formData = new FormData();
  formData.append('file_name', fileName);
  formData.append('parent_type', 'explorer');
  formData.append('parent_node', parentToken || '');
  formData.append('size', String(fileData.byteLength));
  formData.append('file', new Blob([new Uint8Array(fileData)]), fileName);

  const response = await fetch(`${BASE_URL}/drive/v1/files/upload_all`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return response.json();
}
