import type { QuestionResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuestionData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useQuestionQuery = (id: string) => {
  const queryClient = useQueryClient();
  const questionQuery = useQuery<QuestionResponse>({
    queryKey: [queryClientConfig.queryKeys.QUESTION_KEY, id],
    queryFn: () => fetchQuestionData(id),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!id,
  });
  const invalidateQuestionQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.QUESTION_KEY, id],
    });
  };
  return { questionQuery, invalidateQuestionQuery };
};
