import type { QueryClient } from '@tanstack/react-query';
import type {
  ChatQuestionResponse,
  QuestionChatResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';

const { QUESTION_CHAT_KEY } = constants.rest.queryClientConfig.queryKeys;

export const addChatQuestionToCache = (
  queryClient: QueryClient,
  questionId: string,
  chatQuestion: ChatQuestionResponse,
) => {
  queryClient.setQueryData<QuestionChatResponse | undefined>(
    [QUESTION_CHAT_KEY, questionId],
    (oldData) => {
      if (!oldData) return oldData;
      if (oldData.chatQuestions.some((q) => q.id === chatQuestion.id)) {
        return oldData;
      }
      return { chatQuestions: [...oldData.chatQuestions, chatQuestion] };
    },
  );
};

export const updateChatQuestionInCache = (
  queryClient: QueryClient,
  questionId: string,
  chatQuestion: ChatQuestionResponse,
) => {
  queryClient.setQueryData<QuestionChatResponse | undefined>(
    [QUESTION_CHAT_KEY, questionId],
    (oldData) =>
      oldData
        ? {
            chatQuestions: oldData.chatQuestions.map((q) =>
              q.id === chatQuestion.id ? chatQuestion : q,
            ),
          }
        : oldData,
  );
};
