import axios from 'axios';
import { constants } from '@harrys-project/shared/constants';
import {
  questionsResponseSchema,
  questionSchema,
  questionChatResponseSchema,
  chatQuestionSchema,
  pageVisitsResponseSchema,
  type QuestionsResponse,
  type QuestionResponse,
  type QuestionChatResponse,
  type ChatQuestionResponse,
  type PageVisitsResponse,
  type CreateQuestionRequest,
  type CreateChatQuestionRequest,
} from '@harrys-project/shared/apiSchema';

const apiUrl =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const fetchData = async (endpoint: string): Promise<unknown> => {
  const res = await axios.get(`${apiUrl}${endpoint}`);
  if (res.status !== 200) throw new Error('Failed to fetch mock data');
  const data = res.data as unknown;
  return data;
};

export async function fetchQuestionsData(): Promise<QuestionsResponse> {
  const data = await fetchData(constants.rest.endpoints.QUESTIONS_ENDPOINT);
  return questionsResponseSchema.parse(data);
}

export async function fetchPageVisitsData(): Promise<PageVisitsResponse> {
  const data = await fetchData(constants.rest.endpoints.PAGE_VISITS_ENDPOINT);
  return pageVisitsResponseSchema.parse(data);
}

export async function fetchQuestionData(id: string): Promise<QuestionResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${id}`,
  );
  return questionSchema.parse(data);
}

export async function fetchQuestionChatData(
  id: string,
): Promise<QuestionChatResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${id}/chat`,
  );
  return questionChatResponseSchema.parse(data);
}

export async function createQuestion(
  input: CreateQuestionRequest,
): Promise<QuestionResponse> {
  const res = await axios.post(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}`,
    input,
  );
  return questionSchema.parse(res.data);
}

export async function deleteQuestion(id: string): Promise<void> {
  await axios.delete(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${id}`,
  );
}

export async function voteQuestion(
  id: string,
  delta: 1 | -1,
): Promise<QuestionResponse> {
  const res = await axios.patch(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${id}/vote`,
    { delta },
  );
  return questionSchema.parse(res.data);
}

export async function closeQuestion(id: string): Promise<QuestionResponse> {
  const res = await axios.patch(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${id}/close`,
  );
  return questionSchema.parse(res.data);
}

export async function createChatQuestion(
  questionId: string,
  input: CreateChatQuestionRequest,
): Promise<ChatQuestionResponse> {
  const res = await axios.post(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${questionId}/chat`,
    input,
  );
  return chatQuestionSchema.parse(res.data);
}

export async function voteChatQuestion(
  questionId: string,
  chatQuestionId: string,
): Promise<ChatQuestionResponse> {
  const res = await axios.patch(
    `${apiUrl}${constants.rest.endpoints.QUESTIONS_ENDPOINT}/${questionId}/chat/${chatQuestionId}/vote`,
  );
  return chatQuestionSchema.parse(res.data);
}
