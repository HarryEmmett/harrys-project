import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMockLikesData } from "../api/mockApi/mockApi";
import type { LikesResponse } from "../schemas/apiSchema";

const likesQueryKey = "likesKey";

export const useLikesQuery = () => {
  const queryClient = useQueryClient();
  const likesQuery = useQuery<LikesResponse>({
    queryKey: [likesQueryKey],
    queryFn: () => fetchMockLikesData(1000, false),
    staleTime: 5 * 60 * 1000,
  });
  const invalidateLikesQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [likesQueryKey],
    });
  };
  return { likesQuery, invalidateLikesQuery };
};
