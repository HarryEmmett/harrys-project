import type { LikesResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLikesData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useLikesQuery = () => {
  const queryClient = useQueryClient();
  const likesQuery = useQuery<LikesResponse>({
    queryKey: [queryClientConfig.queryKeys.LIKES_KEY],
    queryFn: fetchLikesData,
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateLikesQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.LIKES_KEY],
    });
  };
  return { likesQuery, invalidateLikesQuery };
};
