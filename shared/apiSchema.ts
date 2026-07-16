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
