import type { QuestionResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeQuestion, fetchQuestionData } from '../api/apiCalls';
import { updateQuestionInCache } from '../api/questionsCache';

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

  const closeQuestionMutation = useMutation({
    mutationFn: () => closeQuestion(id),
    onSuccess: (question) => updateQuestionInCache(queryClient, question),
  });

  return { questionQuery, invalidateQuestionQuery, closeQuestionMutation };
};
