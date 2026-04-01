import type { QuestionsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuestionsData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useQuestionsQuery = () => {
  const queryClient = useQueryClient();
  const questionsQuery = useQuery<QuestionsResponse>({
    queryKey: [queryClientConfig.queryKeys.QUESTIONS_KEY],
    queryFn: () => fetchQuestionsData(),
    staleTime: queryClientConfig.config.STALE_TIME,
  });
  const invalidateQuestionsQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.QUESTIONS_KEY],
    });
  };
  return { questionsQuery, invalidateQuestionsQuery };
};
