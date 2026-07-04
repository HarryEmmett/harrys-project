import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mockMessagesByFriendId, type Message } from '../mockData/messages';

const { queryClientConfig } = constants.rest;

type MessagesResponse = { messages: Message[] };

export const useMessagesQuery = (friendId: string) => {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery<MessagesResponse>({
    queryKey: [queryClientConfig.queryKeys.MESSAGES_KEY, friendId],
    queryFn: () =>
      Promise.resolve({ messages: mockMessagesByFriendId[friendId] ?? [] }),
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
