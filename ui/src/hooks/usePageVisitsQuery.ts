import type { PageVisitsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPageVisitsData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const usePageVisitsQuery = () => {
  const queryClient = useQueryClient();
  const pageVisitsQuery = useQuery<PageVisitsResponse>({
    queryKey: [queryClientConfig.queryKeys.PAGE_VISITS_KEY],
    queryFn: fetchPageVisitsData,
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateViewersQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.PAGE_VISITS_KEY],
    });
  };
  return { pageVisitsQuery, invalidateViewersQuery };
};
