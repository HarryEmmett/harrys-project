import { z } from "zod";

export const gameSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    // TODO: z.enum([...]) once a second game type exists.
    gameType: z.literal("quiz"),
    votes: z.number(),
    createdAt: z.string(),
  })
  .strict();

export const gamesResponseSchema = z
  .object({
    games: z.array(gameSchema),
  })
  .strict();

export const quizQuestionSchema = z
  .object({
    id: z.string(),
    gameId: z.string(),
    prompt: z.string(),
    options: z.array(z.string()),
    createdAt: z.string(),
  })
  .strict();

export const gameQuestionsResponseSchema = z
  .object({
    quizQuestions: z.array(quizQuestionSchema),
  })
  .strict();

export const voteGameRequestSchema = z
  .object({
    delta: z.union([z.literal(1), z.literal(-1)]),
  })
  .strict();

export type GameResponse = z.infer<typeof gameSchema>;
export type GamesResponse = z.infer<typeof gamesResponseSchema>;
export type QuizQuestionResponse = z.infer<typeof quizQuestionSchema>;
export type GameQuestionsResponse = z.infer<typeof gameQuestionsResponseSchema>;
export type VoteGameRequest = z.infer<typeof voteGameRequestSchema>;
