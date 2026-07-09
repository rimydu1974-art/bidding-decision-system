const https = require('https');

const data = JSON.stringify({
  model: 'ep-20260704123608-jk5c5',
  messages: [{ role: 'user', content: '你好' }],
  temperature: 0.1,
  max_tokens: 100
});

const options = {
  hostname: 'ark.cn-beijing.volces.com',
  port: 443,
  path: '/api/v3/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ark-97750424-cbeb-412e-85bd-89adf5bce13f-0348e',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body.substring(0, 1000));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
