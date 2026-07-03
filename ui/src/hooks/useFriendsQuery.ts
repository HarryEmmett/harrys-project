import type { FriendsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFriendsData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useFriendsQuery = () => {
  const queryClient = useQueryClient();
  const friendsQuery = useQuery<FriendsResponse>({
    queryKey: [queryClientConfig.queryKeys.FRIENDS_KEY],
    queryFn: fetchFriendsData,
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateFriendsQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.FRIENDS_KEY],
    });
  };
  return { friendsQuery, invalidateFriendsQuery };
};
