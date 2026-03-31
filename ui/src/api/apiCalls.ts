import axios from "axios";
import {
  questionsResponseSchema,
  pageVisitsResponseSchema,
  likesResponseSchema,
} from "@harrys-project/shared/apiSchema";
import type {
  QuestionsResponse,
  PageVisitsResponse,
  LikesResponse,
} from "@harrys-project/shared/apiSchema";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fetchData = async (endpoint: string) => {
  const res = await axios.get(`${apiUrl}${endpoint}`);
  if (res.status !== 200) throw new Error("Failed to fetch mock data");
  const data = await res.data;
  return data;
};

export async function fetchQuestionsData(): Promise<QuestionsResponse> {
  const data = await fetchData("/questions");
  return questionsResponseSchema.parse(data);
}

export async function fetchPageVisitsData(): Promise<PageVisitsResponse> {
  const data = await fetchData("/page-visits");
  return pageVisitsResponseSchema.parse(data);
}

export async function fetchLikesData(): Promise<LikesResponse> {
  const data = await fetchData("/likes");
  return likesResponseSchema.parse(data);
}
