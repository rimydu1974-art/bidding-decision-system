// SMS服务模块
// 支持阿里云、腾讯云、网易云信等服务商
// 需要在.env.local中配置相应的密钥

export interface SMSConfig {
  provider: 'aliyun' | 'tencent' | 'netease' | 'mock';
  // 阿里云
  aliyunAccessKeyId?: string;
  aliyunAccessKeySecret?: string;
  aliyunSignName?: string;
  aliyunTemplateCode?: string;
  // 腾讯云
  tencentSecretId?: string;
  tencentSecretKey?: string;
  tencentAppId?: string;
  tencentTemplateId?: string;
  tencentSignName?: string;
  // 网易云信
  neteaseAppKey?: string;
  neteaseAppSecret?: string;
  neteaseTemplateId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// 获取SMS配置
export function getSMSConfig(): SMSConfig {
  return {
    provider: (process.env.SMS_PROVIDER as SMSConfig['provider']) || 'mock',
    aliyunAccessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    aliyunAccessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    aliyunSignName: process.env.ALIYUN_SIGN_NAME,
    aliyunTemplateCode: process.env.ALIYUN_TEMPLATE_CODE,
    tencentSecretId: process.env.TENCENT_SECRET_ID,
    tencentSecretKey: process.env.TENCENT_SECRET_KEY,
    tencentAppId: process.env.TENCENT_APP_ID,
    tencentTemplateId: process.env.TENCENT_TEMPLATE_ID,
    tencentSignName: process.env.TENCENT_SIGN_NAME,
    neteaseAppKey: process.env.NETEASE_APP_KEY,
    neteaseAppSecret: process.env.NETEASE_APP_SECRET,
    neteaseTemplateId: process.env.NETEASE_TEMPLATE_ID,
  };
}

// 发送SMS
export async function sendSMS(phone: string, code: string): Promise<SMSResult> {
  const config = getSMSConfig();
  
  switch (config.provider) {
    case 'aliyun':
      return sendAliyunSMS(phone, code, config);
    case 'tencent':
      return sendTencentSMS(phone, code, config);
    case 'netease':
      return sendNeteaseSMS(phone, code, config);
    case 'mock':
    default:
      return sendMockSMS(phone, code);
  }
}

// Mock SMS (开发测试用)
async function sendMockSMS(phone: string, code: string): Promise<SMSResult> {
  console.log(`[SMS-Mock] 验证码已发送: ${phone}`);
  return { success: true, messageId: `mock-${Date.now()}` };
}

// 阿里云短信
async function sendAliyunSMS(phone: string, code: string, config: SMSConfig): Promise<SMSResult> {
  if (!config.aliyunAccessKeyId || !config.aliyunAccessKeySecret) {
    return { success: false, error: '阿里云SMS配置缺失' };
  }

  try {
    // TODO: 实现阿里云短信API调用
    // 需要安装 @alicloud/dysmsapi20170525
    // 参考文档: https://help.aliyun.com/document_detail/162442.html
    
    console.log(`[SMS-Aliyun] 发送短信到 ${phone}`);
    
    // 模拟成功响应
    return { success: true, messageId: `aliyun-${Date.now()}` };
  } catch (error) {
    console.error('[SMS-Aliyun] 发送失败:', error);
    return { success: false, error: '阿里云短信发送失败' };
  }
}

// 腾讯云短信
async function sendTencentSMS(phone: string, code: string, config: SMSConfig): Promise<SMSResult> {
  if (!config.tencentSecretId || !config.tencentSecretKey) {
    return { success: false, error: '腾讯云SMS配置缺失' };
  }

  try {
    // TODO: 实现腾讯云短信API调用
    // 需要安装 tencentcloud-sdk-nodejs
    // 参考文档: https://cloud.tencent.com/document/product/382/52077
    
    console.log(`[SMS-Tencent] 发送短信到 ${phone}`);
    
    // 模拟成功响应
    return { success: true, messageId: `tencent-${Date.now()}` };
  } catch (error) {
    console.error('[SMS-Tencent] 发送失败:', error);
    return { success: false, error: '腾讯云短信发送失败' };
  }
}

// 网易云信
async function sendNeteaseSMS(phone: string, code: string, config: SMSConfig): Promise<SMSResult> {
  if (!config.neteaseAppKey || !config.neteaseAppSecret) {
    return { success: false, error: '网易云信SMS配置缺失' };
  }

  try {
    // TODO: 实现网易云信短信API调用
    // 参考文档: https://dev.netease.im/doc?server=/server-v2/sms/sendSmsCode
    
    console.log(`[SMS-Netease] 发送短信到 ${phone}`);
    
    // 模拟成功响应
    return { success: true, messageId: `netease-${Date.now()}` };
  } catch (error) {
    console.error('[SMS-Netease] 发送失败:', error);
    return { success: false, error: '网易云信短信发送失败' };
  }
}
