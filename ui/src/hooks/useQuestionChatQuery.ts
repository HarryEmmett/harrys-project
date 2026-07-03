import type { QuestionChatResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuestionChatData } from '../api/apiCalls';

const { queryClientConfig } = constants.rest;

export const useQuestionChatQuery = (questionId: string) => {
  const queryClient = useQueryClient();
  const questionChatQuery = useQuery<QuestionChatResponse>({
    queryKey: [queryClientConfig.queryKeys.QUESTION_CHAT_KEY, questionId],
    queryFn: () => fetchQuestionChatData(questionId),
    staleTime: queryClientConfig.config.STALE_TIME,
    enabled: !!questionId,
  });
  const invalidateQuestionChatQuery = () => {
    void queryClient.invalidateQueries({
      queryKey: [queryClientConfig.queryKeys.QUESTION_CHAT_KEY, questionId],
    });
  };
  return { questionChatQuery, invalidateQuestionChatQuery };
};
