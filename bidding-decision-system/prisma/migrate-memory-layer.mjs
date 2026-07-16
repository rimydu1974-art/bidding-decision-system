import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env
const envPath = join(rootDir, '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sqlPath = join(import.meta.dirname, 'memory-layer.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Remove comment lines, then split by semicolons
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 80) + '...');
      try {
        await client.query(stmt);
        console.log('  OK');
      } catch (err) {
        if (err.code === '42710' || err.code === '42P07' || err.code === '42P16') {
          console.log('  Already exists, skipping');
        } else {
          console.error('  Error:', err.message);
        }
      }
    }

    console.log('\nDone!');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
