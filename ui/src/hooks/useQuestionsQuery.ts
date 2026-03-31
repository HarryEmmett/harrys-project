import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMockQuestionsData } from "../api/mockApi/mockApi";
import type { QuestionsResponse } from "../schemas/apiSchema";

const questionsQueryKey = "questionsKey";

export const useQuestionsQuery = () => {
  const queryClient = useQueryClient();
  const questionsQuery = useQuery<QuestionsResponse>({
    queryKey: [questionsQueryKey],
    queryFn: () => fetchMockQuestionsData(1000, false),
    staleTime: 5 * 60 * 1000,
  });
  const invalidateQuestionsQuery = () => {
    queryClient.invalidateQueries({
      queryKey: [questionsQueryKey],
    });
  };
  return { questionsQuery, invalidateQuestionsQuery };
};
