import type { GamesResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGamesData, voteGame } from '../api/apiCalls';
import { updateGameInCache } from '../api/gamesCache';

const { queryClientConfig } = constants.rest;

export const useGamesQuery = () => {
  const queryClient = useQueryClient();
  const gamesQuery = useQuery<GamesResponse>({
    queryKey: [queryClientConfig.queryKeys.GAMES_KEY],
    queryFn: () => fetchGamesData(),
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateGamesQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.GAMES_KEY],
    });
  };

  const voteGameMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: 1 | -1 }) =>
      voteGame(id, delta),
    onSuccess: (game) => updateGameInCache(queryClient, game),
    // Re-sync with the server on failure so the UI never sits on stale votes.
    onError: () => invalidateGamesQuery(),
  });

  return { gamesQuery, invalidateGamesQuery, voteGameMutation };
};
