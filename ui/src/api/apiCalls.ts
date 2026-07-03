import axios from 'axios';
import { constants } from '@harrys-project/shared/constants';
import {
  questionsResponseSchema,
  pageVisitsResponseSchema,
  friendsResponseSchema,
  type QuestionsResponse,
  type PageVisitsResponse,
  type FriendsResponse,
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

export async function fetchFriendsData(): Promise<FriendsResponse> {
  const data = await fetchData(constants.rest.endpoints.FRIENDS_ENDPOINT);
  return friendsResponseSchema.parse(data);
}
