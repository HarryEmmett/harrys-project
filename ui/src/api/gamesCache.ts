import type { QueryClient } from '@tanstack/react-query';
import type {
  CodenamesSessionResponse,
  GameResponse,
  GamesResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';

const { GAMES_KEY, GAME_KEY, CODENAMES_SESSION_KEY } =
  constants.rest.queryClientConfig.queryKeys;

export const updateGameInCache = (
  queryClient: QueryClient,
  game: GameResponse,
) => {
  queryClient.setQueryData<GamesResponse | undefined>([GAMES_KEY], (oldData) =>
    oldData
      ? {
          ...oldData,
          games: oldData.games.map((g) => (g.id === game.id ? game : g)),
        }
      : oldData,
  );
  queryClient.setQueryData<GameResponse>([GAME_KEY, game.id], game);
};

export const updateCodenamesSessionInCache = (
  queryClient: QueryClient,
  session: CodenamesSessionResponse,
) => {
  queryClient.setQueryData<CodenamesSessionResponse>(
    [CODENAMES_SESSION_KEY, session.id],
    session,
  );
};
