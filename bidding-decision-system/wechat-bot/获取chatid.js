const { WSClient } = require('@wecom/aibot-node-sdk');

const botId = "aibzOh0BSdIZ56FcMHwce9Ev55gSCcJxwNz";
const secret = "C96JhjPbvJchJ43OajNGCDoO4cFx4XmPoU7EjQcgJbM";

console.log("=== 测试机器人回复 ===");
console.log("请给机器人发一条消息\n");

const wsClient = new WSClient({
  botId,
  secret,
  logger: { info: console.log, warn: console.log, error: console.log, debug: console.log }
});

wsClient.on('message', async (frame) => {
  const body = frame.body;
  console.log("\n========== 收到消息 ==========");
  console.log("用户ID:", body.from?.userid);
  console.log("消息:", body.text?.content);
  console.log("Response URL:", body.response_url);
  console.log("==============================\n");
  
  // 使用 response_url 回复
  if (body.response_url) {
    try {
      const res = await fetch(body.response_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: { content: `收到你的消息：${body.text?.content}` }
        })
      });
      const result = await res.json();
      console.log("✅ 回复结果:", result);
    } catch (err) {
      console.error("❌ 回复失败:", err.message);
    }
  }
  
  // 保存用户ID供后续使用
  console.log("\n📝 请记住你的用户ID:", body.from?.userid);
  console.log("这个ID可以用于发送通知\n");
});

wsClient.connect();
console.log("机器人已连接，等待消息...\n");
