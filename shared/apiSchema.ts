import { z } from "zod";

const participantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .strict();

export const questionSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    content: z.string(),
    votes: z.number(),
    answered: z.boolean(),
    createdAt: z.string(),
  })
  .strict();

const eventSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    createdAt: z.string(),
  })
  .strict();

export const questionsResponseSchema = z
  .object({
    event: eventSchema,
    participants: z.array(participantSchema),
    questions: z.array(questionSchema),
  })
  .strict();

export const pageVisitsResponseSchema = z
  .object({
    pageVisits: z.number(),
  })
  .strict();

export const likesResponseSchema = z
  .object({
    likes: z.number(),
  })
  .strict();

export const friendSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    bio: z.string(),
    isOnline: z.boolean(),
  })
  .strict();

export const friendsResponseSchema = z
  .object({
    friends: z.array(friendSchema),
  })
  .strict();

export const chatQuestionSchema = z
  .object({
    id: z.string(),
    author: z.string(),
    content: z.string(),
    votes: z.number(),
  })
  .strict();

export const questionChatResponseSchema = z
  .object({
    chatQuestions: z.array(chatQuestionSchema),
  })
  .strict();

export const messageSchema = z
  .object({
    id: z.string(),
    author: z.enum(['me', 'them']),
    authorName: z.string(),
    content: z.string(),
    sentAt: z.string(),
  })
  .strict();

export const messagesResponseSchema = z
  .object({
    messages: z.array(messageSchema),
  })
  .strict();

export const createQuestionRequestSchema = z
  .object({
    userId: z.string(),
    content: z.string(),
  })
  .strict();

export const voteQuestionRequestSchema = z
  .object({
    delta: z.union([z.literal(1), z.literal(-1)]),
  })
  .strict();

export const createChatQuestionRequestSchema = z
  .object({
    author: z.string(),
    content: z.string(),
  })
  .strict();

export const createMessageRequestSchema = z
  .object({
    author: z.enum(['me', 'them']),
    authorName: z.string(),
    content: z.string(),
  })
  .strict();

export const createFriendRequestSchema = z
  .object({
    name: z.string(),
    email: z.string().default(''),
    bio: z.string().default(''),
  })
  .strict();

export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;
export type PageVisitsResponse = z.infer<typeof pageVisitsResponseSchema>;
export type LikesResponse = z.infer<typeof likesResponseSchema>;
export type QuestionResponse = z.infer<typeof questionSchema>;
export type FriendsResponse = z.infer<typeof friendsResponseSchema>;
export type FriendResponse = z.infer<typeof friendSchema>;
export type ChatQuestionResponse = z.infer<typeof chatQuestionSchema>;
export type QuestionChatResponse = z.infer<typeof questionChatResponseSchema>;
export type MessageResponse = z.infer<typeof messageSchema>;
export type MessagesResponse = z.infer<typeof messagesResponseSchema>;
export type CreateQuestionRequest = z.infer<typeof createQuestionRequestSchema>;
export type VoteQuestionRequest = z.infer<typeof voteQuestionRequestSchema>;
export type CreateChatQuestionRequest = z.infer<
  typeof createChatQuestionRequestSchema
>;
export type CreateMessageRequest = z.infer<typeof createMessageRequestSchema>;
export type CreateFriendRequest = z.infer<typeof createFriendRequestSchema>;
