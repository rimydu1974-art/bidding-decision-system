const { execSync } = require('child_process');
try {
  const result = execSync('npx prisma db push --force-reset --skip-generate', {
    encoding: 'utf8',
    timeout: 120000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log(result);
} catch (e) {
  console.log('stdout:', e.stdout);
  console.error('stderr:', e.stderr);
  console.error('status:', e.status);
}
