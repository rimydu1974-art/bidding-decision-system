async function testLogin() {
  try {
    const res = await fetch('https://www.opencheck.com.cn/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rimydu1974@qq.com', password: '123456' }),
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
testLogin();
