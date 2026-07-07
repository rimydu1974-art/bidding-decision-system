const { WSClient } = require('@wecom/aibot-node-sdk');

// ==========从环境变量读取密钥==========
const botId = process.env.WECHAT_BOT_ID;
const secret = process.env.WECHAT_BOT_SECRET;

if (!botId || !secret) {
  console.error('请设置环境变量 WECHAT_BOT_ID 和 WECHAT_BOT_SECRET');
  process.exit(1);
}

// 创建WebSocket客户端
const wsClient = new WSClient({
  botId,
  secret,
  logger: console
});

// 监听别人发给机器人的消息
wsClient.on('message', async (frame, body) => {
  console.log('收到消息：', body.msgContent);
  
  // 回复消息
  try {
    await wsClient.reply(frame, `收到你的消息：${body.msgContent}`);
    console.log('回复成功');
  } catch (err) {
    console.error('回复失败：', err.message);
  }
});

// 启动连接
wsClient.connect();

console.log("机器人已启动，去企业微信私聊机器人发消息测试！");
