import type {
  CodenamesKeyResponse,
  CodenamesSessionResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCodenamesSession,
  endCodenamesTurn,
  fetchCodenamesKey,
  fetchCodenamesSession,
  giveCodenamesClue,
  revealCodenamesCard,
} from '../../../api/apiCalls';
import { updateCodenamesSessionInCache } from '../../../api/gamesCache';

const { queryClientConfig } = constants.rest;

export const useCodenamesSession = (
  sessionId: string | undefined,
  { withKey }: { withKey: boolean },
) => {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery<CodenamesSessionResponse>({
    queryKey: [queryClientConfig.queryKeys.CODENAMES_SESSION_KEY, sessionId],
    queryFn: () => fetchCodenamesSession(sessionId!),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!sessionId,
  });

  // The key never changes for a session, so it can be cached forever.
  const keyQuery = useQuery<CodenamesKeyResponse>({
    queryKey: [queryClientConfig.queryKeys.CODENAMES_KEY_KEY, sessionId],
    queryFn: () => fetchCodenamesKey(sessionId!),
    staleTime: Infinity,
    enabled: !!sessionId && withKey,
  });

  const cacheSession = (session: CodenamesSessionResponse) =>
    updateCodenamesSessionInCache(queryClient, session);

  const createSessionMutation = useMutation({
    mutationFn: (gameId: string) => createCodenamesSession(gameId),
    onSuccess: cacheSession,
  });

  const giveClueMutation = useMutation({
    mutationFn: ({ word, count }: { word: string; count: number }) =>
      giveCodenamesClue(sessionId!, word, count),
    onSuccess: cacheSession,
  });

  const revealCardMutation = useMutation({
    mutationFn: (cardIndex: number) =>
      revealCodenamesCard(sessionId!, cardIndex),
    onSuccess: cacheSession,
  });

  const endTurnMutation = useMutation({
    mutationFn: () => endCodenamesTurn(sessionId!),
    onSuccess: cacheSession,
  });

  return {
    sessionQuery,
    keyQuery,
    createSessionMutation,
    giveClueMutation,
    revealCardMutation,
    endTurnMutation,
  };
};
