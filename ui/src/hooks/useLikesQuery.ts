import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLikesData } from "../api/apiCalls";
import type { LikesResponse } from "@harrys-project/shared/apiSchema";

const likesQueryKey = "likesKey";

export const useLikesQuery = () => {
  const queryClient = useQueryClient();
  const likesQuery = useQuery<LikesResponse>({
    queryKey: [likesQueryKey],
    queryFn: fetchLikesData,
    staleTime: 5 * 60 * 1000,
  });
  const invalidateLikesQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [likesQueryKey],
    });
  };
  return { likesQuery, invalidateLikesQuery };
};
