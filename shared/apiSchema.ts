import { z } from "zod";

export const gameSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    gameType: z.enum(["quiz", "codenames"]),
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

export const submitQuizAnswersRequestSchema = z
  .object({
    answers: z.array(
      z
        .object({
          questionId: z.string(),
          selectedOption: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export const quizAnswerResultSchema = z
  .object({
    questionId: z.string(),
    correct: z.boolean(),
  })
  .strict();

export const submitQuizAnswersResponseSchema = z
  .object({
    results: z.array(quizAnswerResultSchema),
    score: z.number(),
    total: z.number(),
  })
  .strict();

export const codenamesTeamSchema = z.enum(["red", "blue"]);

export const codenamesCardRoleSchema = z.enum([
  "red",
  "blue",
  "neutral",
  "assassin",
]);

// Operative view of a card: role is only present once the card is revealed —
// the full key never leaves the server except via the spymaster key endpoint.
export const codenamesCardSchema = z
  .object({
    word: z.string(),
    revealed: z.boolean(),
    role: codenamesCardRoleSchema.nullable(),
  })
  .strict();

export const codenamesClueSchema = z
  .object({
    word: z.string(),
    count: z.number(),
  })
  .strict();

export const codenamesSessionStatusSchema = z.enum([
  "in_progress",
  "red_won",
  "blue_won",
]);

export const codenamesSessionSchema = z
  .object({
    id: z.string(),
    gameId: z.string(),
    cards: z.array(codenamesCardSchema).length(25),
    startingTeam: codenamesTeamSchema,
    currentTeam: codenamesTeamSchema,
    status: codenamesSessionStatusSchema,
    currentClue: codenamesClueSchema.nullable(),
    guessesRemaining: z.number().nullable(),
    redRemaining: z.number(),
    blueRemaining: z.number(),
    createdAt: z.string(),
  })
  .strict();

// Spymaster key: the role of every card by board index (0-24).
export const codenamesKeyResponseSchema = z
  .object({
    sessionId: z.string(),
    roles: z.array(codenamesCardRoleSchema).length(25),
  })
  .strict();

export const createCodenamesSessionRequestSchema = z
  .object({
    gameId: z.string(),
  })
  .strict();

export const giveCodenamesClueRequestSchema = z
  .object({
    word: z.string().min(1),
    count: z.number().int().min(1).max(9),
  })
  .strict();

export const revealCodenamesCardRequestSchema = z
  .object({
    cardIndex: z.number().int().min(0).max(24),
  })
  .strict();

export const forumPostSchema = z
  .object({
    id: z.string(),
    author: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export const forumPostsResponseSchema = z
  .object({
    forumPosts: z.array(forumPostSchema),
  })
  .strict();

export const createForumPostRequestSchema = z
  .object({
    author: z.string(),
    title: z.string(),
    content: z.string(),
  })
  .strict();

export const updateForumPostRequestSchema = z
  .object({
    title: z.string(),
    content: z.string(),
  })
  .strict();

export const forumReplySchema = z
  .object({
    id: z.string(),
    postId: z.string(),
    author: z.string(),
    content: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const forumRepliesResponseSchema = z
  .object({
    forumReplies: z.array(forumReplySchema),
  })
  .strict();

export const createForumReplyRequestSchema = z
  .object({
    author: z.string(),
    content: z.string(),
  })
  .strict();

export type GameResponse = z.infer<typeof gameSchema>;
export type GamesResponse = z.infer<typeof gamesResponseSchema>;
export type QuizQuestionResponse = z.infer<typeof quizQuestionSchema>;
export type GameQuestionsResponse = z.infer<typeof gameQuestionsResponseSchema>;
export type VoteGameRequest = z.infer<typeof voteGameRequestSchema>;
export type SubmitQuizAnswersRequest = z.infer<
  typeof submitQuizAnswersRequestSchema
>;
export type QuizAnswerResult = z.infer<typeof quizAnswerResultSchema>;
export type SubmitQuizAnswersResponse = z.infer<
  typeof submitQuizAnswersResponseSchema
>;
export type CodenamesTeam = z.infer<typeof codenamesTeamSchema>;
export type CodenamesCardRole = z.infer<typeof codenamesCardRoleSchema>;
export type CodenamesCard = z.infer<typeof codenamesCardSchema>;
export type CodenamesClue = z.infer<typeof codenamesClueSchema>;
export type CodenamesSessionStatus = z.infer<
  typeof codenamesSessionStatusSchema
>;
export type CodenamesSessionResponse = z.infer<typeof codenamesSessionSchema>;
export type CodenamesKeyResponse = z.infer<typeof codenamesKeyResponseSchema>;
export type CreateCodenamesSessionRequest = z.infer<
  typeof createCodenamesSessionRequestSchema
>;
export type GiveCodenamesClueRequest = z.infer<
  typeof giveCodenamesClueRequestSchema
>;
export type RevealCodenamesCardRequest = z.infer<
  typeof revealCodenamesCardRequestSchema
>;
export type ForumPostResponse = z.infer<typeof forumPostSchema>;
export type ForumPostsResponse = z.infer<typeof forumPostsResponseSchema>;
export type CreateForumPostRequest = z.infer<
  typeof createForumPostRequestSchema
>;
export type UpdateForumPostRequest = z.infer<
  typeof updateForumPostRequestSchema
>;
export type ForumReplyResponse = z.infer<typeof forumReplySchema>;
export type ForumRepliesResponse = z.infer<typeof forumRepliesResponseSchema>;
export type CreateForumReplyRequest = z.infer<
  typeof createForumReplyRequestSchema
>;
