import type { GameQuestionsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery } from '@tanstack/react-query';
import { fetchGameQuestionsData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useGameQuestionsQuery = (gameId: string) => {
  const gameQuestionsQuery = useQuery<GameQuestionsResponse>({
    queryKey: [queryClientConfig.queryKeys.GAME_QUESTIONS_KEY, gameId],
    queryFn: () => fetchGameQuestionsData(gameId),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!gameId,
  });

  return { gameQuestionsQuery };
};
