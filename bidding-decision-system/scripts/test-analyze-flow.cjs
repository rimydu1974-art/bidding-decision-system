const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const loginBody = JSON.stringify({ email: 'test@test.com', password: 'Test123456' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  
  const cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0] || '';
  console.log('Login:', loginRes.status, cookie ? 'OK' : 'NO COOKIE');

  const testContent = Buffer.from('Test tender document for analysis');
  const boundary = '----TestBoundary123';
  const parts = [
    '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n',
    testContent.toString('binary'),
    '\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="projectId"\r\n\r\ntender-upload\r\n',
    '--' + boundary + '--\r\n'
  ];
  const body = Buffer.concat(parts.map(s => Buffer.from(s, 'binary')));

  const analyzeRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/analyze', method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length, 'Cookie': cookie }
  }, body);

  console.log('Analyze status:', analyzeRes.status);
  
  if (analyzeRes.status !== 200) {
    console.log('Error:', analyzeRes.body.substring(0, 500));
    return;
  }

  const analyzeData = JSON.parse(analyzeRes.body);
  const assessmentId = analyzeData.assessment?.id;
  console.log('Assessment ID:', assessmentId);

  if (!assessmentId) {
    console.log('NO ASSESSMENT ID IN RESPONSE - BUG!');
    return;
  }

  const lookupRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/assessments/' + assessmentId, method: 'GET',
    headers: { 'Cookie': cookie }
  });

  console.log('Direct lookup status:', lookupRes.status);
  
  if (lookupRes.status === 200) {
    const lookupData = JSON.parse(lookupRes.body);
    const aiResult = JSON.parse(lookupData.assessment.aiResult);
    console.log('hasAssessment check:');
    console.log('  risks:', !!aiResult.risks, '(' + (aiResult.risks?.length || 0) + ' items)');
    console.log('  scoringRules:', !!aiResult.scoringRules);
    console.log('  projectInfo:', !!aiResult.projectInfo);
    console.log('  basicInfo?.projectName:', !!aiResult.basicInfo?.projectName);
    console.log('  recommendation:', aiResult.recommendation);
    const hasAssessment = aiResult.risks || aiResult.scoringRules || aiResult.projectInfo || aiResult.basicInfo?.projectName;
    console.log('  RESULT: hasAssessment =', !!hasAssessment);
  } else {
    console.log('Lookup failed:', lookupRes.body.substring(0, 300));
  }
}

main().catch(console.error);
