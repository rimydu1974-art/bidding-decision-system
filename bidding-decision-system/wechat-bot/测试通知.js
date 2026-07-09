const { WSClient } = require('@wecom/aibot-node-sdk');

const botId = "aibzOh0BSdIZ56FcMHwce9Ev55gSCcJxwNz";
const secret = process.env.WECHAT_BOT_SECRET;
const adminUserId = "rimydu";  // 你的用户ID

console.log("=== 测试发送通知 ===\n");

const wsClient = new WSClient({ 
  botId, 
  secret,
  logger: { info: console.log, warn: console.log, error: console.error, debug: () => {} }
});

const message = `💰 测试通知

这是一条支付通知测试消息
订单号：ORD123456
金额：¥19

⚠️ 如果你收到这条消息，说明通知功能正常！`;

wsClient.on('authenticated', async () => {
  console.log("✅ 已连接，正在发送消息...");
  
  try {
    await wsClient.sendMessage(adminUserId, {
      msgtype: 'text',
      text: { content: message }
    });
    console.log("✅ 消息已发送！");
    console.log("请检查企业微信是否收到消息");
  } catch (err) {
    console.error("❌ 发送失败:", err.message);
  }
  
  setTimeout(() => {
    wsClient.disconnect();
    process.exit(0);
  }, 2000);
});

wsClient.on('error', (err) => {
  console.error("❌ 连接错误:", err.message);
  process.exit(1);
});

wsClient.connect();
console.log("正在连接机器人...");
