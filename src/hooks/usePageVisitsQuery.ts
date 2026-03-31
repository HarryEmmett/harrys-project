import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMockPageVisitsData } from "../api/mockApi/mockApi";
import type { PageVisitsResponse } from "../schemas/apiSchema";

const pageVisitsQueryKey = "pageVisitsKey";

export const usePageVisitsQuery = () => {
  const queryClient = useQueryClient();
  const pageVisitsQuery = useQuery<PageVisitsResponse>({
    queryKey: [pageVisitsQueryKey],
    queryFn: () => fetchMockPageVisitsData(1000, false),
    staleTime: 5 * 60 * 1000,
  });
  const invalidateViewersQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [pageVisitsQueryKey],
    });
  };
  return { pageVisitsQuery, invalidateViewersQuery };
};
