import axios from 'axios';
import { constants } from '@harrys-project/shared/constants';
import {
  gamesResponseSchema,
  gameSchema,
  gameQuestionsResponseSchema,
  submitQuizAnswersResponseSchema,
  type GamesResponse,
  type GameResponse,
  type GameQuestionsResponse,
  type SubmitQuizAnswersRequest,
  type SubmitQuizAnswersResponse,
} from '@harrys-project/shared/apiSchema';

export const apiUrl =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const fetchData = async (endpoint: string): Promise<unknown> => {
  const res = await axios.get(`${apiUrl}${endpoint}`);
  return res.data as unknown;
};

export async function fetchGamesData(): Promise<GamesResponse> {
  const data = await fetchData(constants.rest.endpoints.GAMES_ENDPOINT);
  return gamesResponseSchema.parse(data);
}

export async function fetchGameData(id: string): Promise<GameResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.GAMES_ENDPOINT}/${id}`,
  );
  return gameSchema.parse(data);
}

export async function fetchGameQuestionsData(
  id: string,
): Promise<GameQuestionsResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.GAMES_ENDPOINT}/${id}/questions`,
  );
  return gameQuestionsResponseSchema.parse(data);
}

export async function voteGame(
  id: string,
  delta: 1 | -1,
): Promise<GameResponse> {
  const res = await axios.patch(
    `${apiUrl}${constants.rest.endpoints.GAMES_ENDPOINT}/${id}/vote`,
    { delta },
  );
  return gameSchema.parse(res.data);
}

export async function submitQuizAnswers(
  id: string,
  request: SubmitQuizAnswersRequest,
): Promise<SubmitQuizAnswersResponse> {
  const res = await axios.post(
    `${apiUrl}${constants.rest.endpoints.GAMES_ENDPOINT}/${id}/submit`,
    request,
  );
  return submitQuizAnswersResponseSchema.parse(res.data);
}
