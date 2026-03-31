import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPageVisitsData } from "../api/apiCalls";
import type { PageVisitsResponse } from "../schemas/apiSchema";

const pageVisitsQueryKey = "pageVisitsKey";

export const usePageVisitsQuery = () => {
  const queryClient = useQueryClient();
  const pageVisitsQuery = useQuery<PageVisitsResponse>({
    queryKey: [pageVisitsQueryKey],
    queryFn: fetchPageVisitsData,
    staleTime: 5 * 60 * 1000,
  });
  const invalidateViewersQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [pageVisitsQueryKey],
    });
  };
  return { pageVisitsQuery, invalidateViewersQuery };
};
