const https = require('https');

const data = JSON.stringify({
  model: 'ep-20260704123608-jk5c5',
  messages: [{ role: 'user', content: '你好，请简短回复' }],
  max_tokens: 50
});

const options = {
  hostname: 'ark.cn-beijing.volces.com',
  port: 443,
  path: '/api/v3/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ark-97750424-cbeb-412e-85bd-89adf5bce13f-0348e',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(body);
      if (json.choices && json.choices[0]) {
        console.log('Response:', json.choices[0].message.content);
      } else {
        console.log('Full response:', body.substring(0, 500));
      }
    } catch(e) {
      console.log('Raw response:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
