import axios from "axios";
import {
  questionsResponseSchema,
  pageVisitsResponseSchema,
  likesResponseSchema,
} from "../../schemas/apiSchema";
import type {
  QuestionsResponse,
  PageVisitsResponse,
  LikesResponse,
} from "../../schemas/apiSchema";

const fetchMockData = async (
  file: string,
  timeout: number,
  mockError: boolean
) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));

  if (mockError) throw new Error("Something went wrong!");

  const res = await axios.get(file);
  if (res.status !== 200) throw new Error("Failed to fetch mock data");
  const data = await res.data;
  return data;
};

export async function fetchMockQuestionsData(
  timeout: number,
  mockError: boolean
): Promise<QuestionsResponse> {
  const data = await fetchMockData(
    "/mockQuestionsData.json",
    timeout,
    mockError
  );
  return questionsResponseSchema.parse(data);
}

export async function fetchMockPageVisitsData(
  timeout: number,
  mockError: boolean
): Promise<PageVisitsResponse> {
  const data = await fetchMockData(
    "/mockPageVisitsData.json",
    timeout,
    mockError
  );
  return pageVisitsResponseSchema.parse(data);
}

export async function fetchMockLikesData(
  timeout: number,
  mockError: boolean
): Promise<LikesResponse> {
  const data = await fetchMockData("/mockLikesData.json", timeout, mockError);
  return likesResponseSchema.parse(data);
}
