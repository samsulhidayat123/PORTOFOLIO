import { neon } from '@neondatabase/serverless';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is required to initialize the database.');
  process.exit(1);
}

const sql = neon(databaseUrl);

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    link VARCHAR(255) NOT NULL,
    tech JSONB NOT NULL,
    size VARCHAR(50) NOT NULL,
    image VARCHAR(255) NOT NULL
  );
`;

console.log('Database initialized: projects table is ready.');
