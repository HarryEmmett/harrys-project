import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { Client } from 'pg';

// Real, readable trivia content (not faker.lorem) — this is what actually
// renders on the quiz detail page, so it needs to be meaningful to be useful
// for manually testing the read-only display.
const QUIZ_QUESTIONS: {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}[] = [
  {
    prompt: 'What is the capital of France?',
    options: ['Paris', 'Lyon', 'Marseille', 'Nice'],
    correctOptionIndex: 0,
  },
  {
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctOptionIndex: 1,
  },
  {
    prompt: 'Who wrote "Romeo and Juliet"?',
    options: [
      'Charles Dickens',
      'William Shakespeare',
      'Jane Austen',
      'Mark Twain',
    ],
    correctOptionIndex: 1,
  },
  {
    prompt: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctOptionIndex: 3,
  },
  {
    prompt: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctOptionIndex: 2,
  },
];

const FORUM_POSTS: { author: string; title: string; content: string }[] = [
  {
    author: 'Harry Emmett',
    title: 'Welcome to the forum',
    content: 'Say hi, introduce yourself, or start a discussion about anything.',
  },
  {
    author: 'Harry Emmett',
    title: "What game should we add next?",
    content: 'The quiz is up and running — what should the next game in the hub be?',
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

    for (const { prompt, options, correctOptionIndex } of QUIZ_QUESTIONS) {
      await client.query(
        `INSERT INTO "quiz_questions" ("id", "prompt", "options", "correctOptionIndex", "gameId")
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), prompt, options, correctOptionIndex, gameId],
      );
    }

    console.log(
      `Seeded game "${gameTitle}" (${gameId}) with ${QUIZ_QUESTIONS.length} quiz questions.`,
    );

    // The forum_posts table only exists once the ForumModule lands (plan.md
    // roadmap item 2) — skip forum seeding until then instead of crashing.
    const forumTable = await client.query(
      `SELECT to_regclass('forum_posts') IS NOT NULL AS exists`,
    );
    if (forumTable.rows[0].exists) {
      for (const { author, title, content } of FORUM_POSTS) {
        await client.query(
          `INSERT INTO "forum_posts" ("id", "author", "title", "content") VALUES ($1, $2, $3, $4)`,
          [randomUUID(), author, title, content],
        );
      }
      console.log(`Seeded ${FORUM_POSTS.length} forum posts.`);
    } else {
      console.log('Skipped forum posts (forum_posts table does not exist yet).');
    }
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
