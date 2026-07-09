import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { Client } from 'pg';

// Real, readable trivia content (not faker.lorem) — this is what actually
// renders on the quiz detail page, so it needs to be meaningful to be useful
// for manually testing the read-only display.
const QUIZ_QUESTIONS: { prompt: string; options: string[] }[] = [
  {
    prompt: 'What is the capital of France?',
    options: ['Paris', 'Lyon', 'Marseille', 'Nice'],
  },
  {
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  },
  {
    prompt: 'Who wrote "Romeo and Juliet"?',
    options: [
      'Charles Dickens',
      'William Shakespeare',
      'Jane Austen',
      'Mark Twain',
    ],
  },
  {
    prompt: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
  },
  {
    prompt: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
  },
];

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();

  try {
    const gameId = randomUUID();
    const gameTitle = 'General Knowledge Quiz';
    await client.query(
      `INSERT INTO "games" ("id", "title", "description", "gameType", "votes") VALUES ($1, $2, $3, $4, $5)`,
      [
        gameId,
        gameTitle,
        'A short multiple-choice quiz to test your general knowledge.',
        'quiz',
        0,
      ],
    );

    for (const { prompt, options } of QUIZ_QUESTIONS) {
      await client.query(
        `INSERT INTO "quiz_questions" ("id", "prompt", "options", "gameId")
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), prompt, options, gameId],
      );
    }

    console.log(
      `Seeded game "${gameTitle}" (${gameId}) with ${QUIZ_QUESTIONS.length} quiz questions.`,
    );
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
