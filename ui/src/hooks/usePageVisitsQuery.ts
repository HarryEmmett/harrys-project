import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPageVisitsData } from '../api/apiCalls';
import type { PageVisitsResponse } from '@harrys-project/shared/apiSchema';

const pageVisitsQueryKey = 'pageVisitsKey';

export const usePageVisitsQuery = () => {
  const queryClient = useQueryClient();
  const pageVisitsQuery = useQuery<PageVisitsResponse>({
    queryKey: [pageVisitsQueryKey],
    queryFn: fetchPageVisitsData,
    staleTime: 5 * 60 * 1000,
  });
  const invalidateViewersQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [pageVisitsQueryKey],
    });
  };
  return { pageVisitsQuery, invalidateViewersQuery };
};
