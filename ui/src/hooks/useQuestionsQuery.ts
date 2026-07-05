import type {
  CreateQuestionRequest,
  QuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuestion,
  deleteQuestion,
  fetchQuestionsData,
  voteQuestion,
} from '../api/apiCalls';
import {
  addQuestionToCache,
  removeQuestionFromCache,
  updateQuestionInCache,
} from '../api/questionsCache';

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

  const createQuestionMutation = useMutation({
    mutationFn: (input: CreateQuestionRequest) => createQuestion(input),
    onSuccess: (question) => addQuestionToCache(queryClient, question),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: (_data, id) => removeQuestionFromCache(queryClient, id),
  });

  const voteQuestionMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: 1 | -1 }) =>
      voteQuestion(id, delta),
    onSuccess: (question) => updateQuestionInCache(queryClient, question),
  });

  return {
    questionsQuery,
    invalidateQuestionsQuery,
    createQuestionMutation,
    deleteQuestionMutation,
    voteQuestionMutation,
  };
};
