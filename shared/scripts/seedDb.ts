import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { Client } from 'pg';
import { faker } from '@faker-js/faker';

const QUESTION_COUNT = Number(process.env.SEED_QUESTION_COUNT ?? 8);
const PARTICIPANT_COUNT = Number(process.env.SEED_PARTICIPANT_COUNT ?? 5);

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
    const eventId = randomUUID();
    const eventTitle = faker.company.catchPhrase();
    await client.query(
      `INSERT INTO "events" ("id", "title", "description") VALUES ($1, $2, $3)`,
      [eventId, eventTitle, faker.lorem.sentence()],
    );

    const participants = Array.from({ length: PARTICIPANT_COUNT }, () => ({
      id: randomUUID(),
      name: faker.person.fullName(),
    }));
    for (const participant of participants) {
      await client.query(
        `INSERT INTO "participants" ("id", "name", "eventId") VALUES ($1, $2, $3)`,
        [participant.id, participant.name, eventId],
      );
    }

    for (let i = 0; i < QUESTION_COUNT; i++) {
      const questionId = randomUUID();
      const author = faker.helpers.arrayElement(participants);
      await client.query(
        `INSERT INTO "questions" ("id", "userId", "content", "votes", "answered", "eventId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          questionId,
          author.id,
          `${faker.lorem.sentence().replace(/\.$/, '')}?`,
          faker.number.int({ min: 0, max: 15 }),
          faker.datatype.boolean({ probability: 0.3 }),
          eventId,
        ],
      );

      const chatCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < chatCount; j++) {
        const chatAuthor = faker.helpers.arrayElement(participants);
        await client.query(
          `INSERT INTO "chat_questions" ("id", "author", "content", "votes", "questionId")
           VALUES ($1, $2, $3, $4, $5)`,
          [
            randomUUID(),
            chatAuthor.name,
            faker.lorem.sentence(),
            faker.number.int({ min: 0, max: 5 }),
            questionId,
          ],
        );
      }
    }

    console.log(
      `Seeded event "${eventTitle}" (${eventId}) with ${PARTICIPANT_COUNT} participants and ${QUESTION_COUNT} questions.`,
    );
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
