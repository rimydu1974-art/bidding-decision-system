const { WSClient } = require('@wecom/aibot-node-sdk');
const fs = require('fs');
const path = require('path');

const botId = "aibzOh0BSdIZ56FcMHwce9Ev55gSCcJxwNz";
const secret = "C96JhjPbvJchJ43OajNGCDoO4cFx4XmPoU7EjQcgJbM";

console.log("=== OpenCheck 支付通知机器人 ===\n");

// 存储最近的response_url
let lastResponseUrl = null;
const NOTIFICATION_FILE = path.join(__dirname, '../pending-notifications.json');

const wsClient = new WSClient({ 
  botId, 
  secret,
  logger: { info: console.log, warn: console.log, error: console.error, debug: () => {} }
});

// 监听消息
wsClient.on('message', async (frame) => {
  const body = frame.body;
  console.log("\n📩 收到消息:", body.text?.content);
  
  // 保存最新的 response_url
  if (body.response_url) {
    lastResponseUrl = body.response_url;
    console.log("✅ 已保存 response_url");
  }
  
  // 检查是否有待发送的通知
  await processPendingNotifications();
  
  // 回复消息
  if (body.response_url) {
    try {
      const res = await fetch(body.response_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: { content: '✅ 机器人已就绪，等待接收支付通知...' }
        })
      });
      const result = await res.json();
      if (result.errcode === 0) {
        console.log("✅ 回复成功");
      } else {
        console.log("⚠️ 回复结果:", result);
      }
    } catch (err) {
      console.error("❌ 回复失败:", err.message);
    }
  }
});

// 处理待发送通知
async function processPendingNotifications() {
  try {
    if (fs.existsSync(NOTIFICATION_FILE)) {
      const notifications = JSON.parse(fs.readFileSync(NOTIFICATION_FILE, 'utf-8'));
      if (notifications.length > 0 && lastResponseUrl) {
        const notification = notifications.shift();
        fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2));
        
        const res = await fetch(lastResponseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: 'text',
            text: { content: notification.message }
          })
        });
        console.log("📤 已发送通知:", notification.orderNo);
      }
    }
  } catch (err) {
    console.error("❌ 处理通知失败:", err.message);
  }
}

wsClient.on('error', (err) => {
  console.error("❌ 连接错误:", err.message);
});

wsClient.connect();
console.log("🤖 机器人已启动，等待消息...\n");
console.log("请在企业微信里给机器人发一条消息来激活通知功能\n");

// 定期检查通知
setInterval(processPendingNotifications, 5000);
