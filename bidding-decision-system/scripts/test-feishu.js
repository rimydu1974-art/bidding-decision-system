const fs = require('fs');
const path = require('path');

// 读取 .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const lark = require('@larksuiteoapi/node-sdk');

const client = new lark.Client({
  appId: env.FEISHU_APP_ID,
  appSecret: env.FEISHU_APP_SECRET,
  appType: lark.AppType.SelfBuild,
});

async function test() {
  // 测试1: 列出根目录
  console.log('=== 测试根目录 ===');
  try {
    const r1 = await client.drive.file.list({ params: { page_size: 10 } });
    console.log('code:', r1.code, 'msg:', r1.msg);
    if (r1.data?.files) {
      console.log('files count:', r1.data.files.length);
      r1.data.files.forEach(f => console.log(' -', f.name, '|', f.type, '|', f.token));
    }
  } catch(e) { console.log('ERROR:', e.message); }

  // 测试2: 列出指定文件夹
  console.log('\n=== 测试文件夹 OgUaflYFjluXSodhkgucZTIEnBg ===');
  try {
    const r2 = await client.drive.file.list({ params: { page_size: 10, folder_token: 'OgUaflYFjluXSodhkgucZTIEnBg' } });
    console.log('code:', r2.code, 'msg:', r2.msg);
    if (r2.data?.files) {
      console.log('files count:', r2.data.files.length);
      r2.data.files.forEach(f => console.log(' -', f.name, '|', f.type, '|', f.token));
    }
  } catch(e) { console.log('ERROR:', e.message); }
}

test();
