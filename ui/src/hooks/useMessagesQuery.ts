import type { MessagesResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessagesData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useMessagesQuery = (friendId: string) => {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery<MessagesResponse>({
    queryKey: [queryClientConfig.queryKeys.MESSAGES_KEY, friendId],
    queryFn: () => fetchMessagesData(friendId),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!friendId,
  });
  const invalidateMessagesQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.MESSAGES_KEY, friendId],
    });
  };
  return { messagesQuery, invalidateMessagesQuery };
};
