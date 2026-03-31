import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QuestionsResponse } from "../schemas/apiSchema";
import { fetchQuestionsData } from "../api/apiCalls";

const questionsQueryKey = "questionsKey";

export const useQuestionsQuery = () => {
  const queryClient = useQueryClient();
  const questionsQuery = useQuery<QuestionsResponse>({
    queryKey: [questionsQueryKey],
    queryFn: () => fetchQuestionsData(),
    staleTime: 5 * 60 * 1000,
  });
  const invalidateQuestionsQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [questionsQueryKey],
    });
  };
  return { questionsQuery, invalidateQuestionsQuery };
};
