import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mockFriends, type Friend } from '../mockData/friends';

const { queryClientConfig } = constants.rest;

type FriendsResponse = { friends: Friend[] };

export const useFriendsQuery = () => {
  const queryClient = useQueryClient();
  const friendsQuery = useQuery<FriendsResponse>({
    queryKey: [queryClientConfig.queryKeys.FRIENDS_KEY],
    queryFn: () => Promise.resolve({ friends: mockFriends }),
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateFriendsQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.FRIENDS_KEY],
    });
  };
  return { friendsQuery, invalidateFriendsQuery };
};
