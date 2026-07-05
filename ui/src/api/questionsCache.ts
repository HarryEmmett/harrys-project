import type { QueryClient } from '@tanstack/react-query';
import type {
  QuestionResponse,
  QuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';

const { QUESTIONS_KEY, QUESTION_KEY } =
  constants.rest.queryClientConfig.queryKeys;

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
  queryClient.setQueryData<QuestionResponse>(
    [QUESTION_KEY, question.id],
    question,
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
  queryClient.setQueryData<QuestionResponse>(
    [QUESTION_KEY, question.id],
    question,
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
  queryClient.removeQueries({ queryKey: [QUESTION_KEY, id] });
};
