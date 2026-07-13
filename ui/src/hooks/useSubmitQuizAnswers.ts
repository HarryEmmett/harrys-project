import type { SubmitQuizAnswersRequest } from '@harrys-project/shared/apiSchema';
import { useMutation } from '@tanstack/react-query';
import { submitQuizAnswers } from '../api/apiCalls';

export const useSubmitQuizAnswers = (gameId: string) => {
  const submitQuizAnswersMutation = useMutation({
    mutationFn: (request: SubmitQuizAnswersRequest) =>
      submitQuizAnswers(gameId, request),
  });

  return { submitQuizAnswersMutation };
};
