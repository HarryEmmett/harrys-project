import type { QueryClient } from '@tanstack/react-query';
import type {
  QuestionResponse,
  QuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';

const { QUESTIONS_KEY } = constants.rest.queryClientConfig.queryKeys;

export const addQuestionToCache = (
  queryClient: QueryClient,
  question: QuestionResponse,
) => {
  queryClient.setQueryData<QuestionsResponse | undefined>(
    [QUESTIONS_KEY],
    (oldData) => {
      if (!oldData) return oldData;
      if (oldData.questions.some((q) => q.id === question.id)) return oldData;
      return { ...oldData, questions: [...oldData.questions, question] };
    },
  );
};

export const updateQuestionInCache = (
  queryClient: QueryClient,
  question: QuestionResponse,
) => {
  queryClient.setQueryData<QuestionsResponse | undefined>(
    [QUESTIONS_KEY],
    (oldData) =>
      oldData
        ? {
            ...oldData,
            questions: oldData.questions.map((q) =>
              q.id === question.id ? question : q,
            ),
          }
        : oldData,
  );
};

export const removeQuestionFromCache = (
  queryClient: QueryClient,
  id: string,
) => {
  queryClient.setQueryData<QuestionsResponse | undefined>(
    [QUESTIONS_KEY],
    (oldData) =>
      oldData
        ? {
            ...oldData,
            questions: oldData.questions.filter((q) => q.id !== id),
          }
        : oldData,
  );
};
