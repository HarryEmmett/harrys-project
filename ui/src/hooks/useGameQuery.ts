import type { GameResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGameData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useGameQuery = (id: string) => {
  const queryClient = useQueryClient();
  const gameQuery = useQuery<GameResponse>({
    queryKey: [queryClientConfig.queryKeys.GAME_KEY, id],
    queryFn: () => fetchGameData(id),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!id,
  });
  const invalidateGameQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.GAME_KEY, id],
    });
  };

  return { gameQuery, invalidateGameQuery };
};
