import type {
  CreateChatQuestionRequest,
  QuestionChatResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createChatQuestion,
  fetchQuestionChatData,
  voteChatQuestion,
} from '../api/apiCalls';
import {
  addChatQuestionToCache,
  updateChatQuestionInCache,
} from '../api/chatQuestionsCache';

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

  const createChatQuestionMutation = useMutation({
    mutationFn: (input: CreateChatQuestionRequest) =>
      createChatQuestion(questionId, input),
    onSuccess: (chatQuestion) =>
      addChatQuestionToCache(queryClient, questionId, chatQuestion),
  });

  const voteChatQuestionMutation = useMutation({
    mutationFn: (chatQuestionId: string) =>
      voteChatQuestion(questionId, chatQuestionId),
    onSuccess: (chatQuestion) =>
      updateChatQuestionInCache(queryClient, questionId, chatQuestion),
  });

  return {
    questionChatQuery,
    invalidateQuestionChatQuery,
    createChatQuestionMutation,
    voteChatQuestionMutation,
  };
};
