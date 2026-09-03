import axios from 'axios';
import { constants } from '@harrys-project/shared/constants';
import {
  gamesResponseSchema,
  gameSchema,
  gameQuestionsResponseSchema,
  codenamesSessionSchema,
  codenamesKeyResponseSchema,
  type GamesResponse,
  type GameResponse,
  type GameQuestionsResponse,
  type CodenamesSessionResponse,
  type CodenamesKeyResponse,
} from '@harrys-project/shared/apiSchema';

export const apiUrl =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const fetchData = async (endpoint: string): Promise<unknown> => {
  const res = await axios.get(`${apiUrl}${endpoint}`);
  if (res.status !== 200) throw new Error('Failed to fetch mock data');
  const data = res.data as unknown;
  return data;
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

const codenamesSessionsUrl = `${apiUrl}${constants.rest.endpoints.CODENAMES_SESSIONS_ENDPOINT}`;

export async function createCodenamesSession(
  gameId: string,
): Promise<CodenamesSessionResponse> {
  const res = await axios.post(codenamesSessionsUrl, { gameId });
  return codenamesSessionSchema.parse(res.data);
}

export async function fetchCodenamesSession(
  id: string,
): Promise<CodenamesSessionResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.CODENAMES_SESSIONS_ENDPOINT}/${id}`,
  );
  return codenamesSessionSchema.parse(data);
}

export async function fetchCodenamesKey(
  id: string,
): Promise<CodenamesKeyResponse> {
  const data = await fetchData(
    `${constants.rest.endpoints.CODENAMES_SESSIONS_ENDPOINT}/${id}/key`,
  );
  return codenamesKeyResponseSchema.parse(data);
}

export async function giveCodenamesClue(
  id: string,
  word: string,
  count: number,
): Promise<CodenamesSessionResponse> {
  const res = await axios.patch(`${codenamesSessionsUrl}/${id}/clue`, {
    word,
    count,
  });
  return codenamesSessionSchema.parse(res.data);
}

export async function revealCodenamesCard(
  id: string,
  cardIndex: number,
): Promise<CodenamesSessionResponse> {
  const res = await axios.patch(`${codenamesSessionsUrl}/${id}/reveal`, {
    cardIndex,
  });
  return codenamesSessionSchema.parse(res.data);
}

export async function endCodenamesTurn(
  id: string,
): Promise<CodenamesSessionResponse> {
  const res = await axios.patch(`${codenamesSessionsUrl}/${id}/end-turn`);
  return codenamesSessionSchema.parse(res.data);
}
