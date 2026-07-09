import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { Client } from 'pg';

async function clear() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    // Children before parents — no CASCADE assumption, just explicit ordering.
    await client.query(`DELETE FROM "quiz_questions"`);
    await client.query(`DELETE FROM "games"`);

    console.log('Cleared all games and quiz questions.');
  } finally {
    await client.end();
  }
}

clear().catch((error: unknown) => {
  console.error('Clear failed:', error);
  process.exit(1);
});
