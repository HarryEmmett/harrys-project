import { z } from "zod";

const participantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .strict();

const questionSchema = z
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

export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;
export type PageVisitsResponse = z.infer<typeof pageVisitsResponseSchema>;
export type LikesResponse = z.infer<typeof likesResponseSchema>;
