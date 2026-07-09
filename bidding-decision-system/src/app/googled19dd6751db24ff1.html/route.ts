export async function GET() {
  return new Response('google-site-verification: googled19dd6751db24ff1.html', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
