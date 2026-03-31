import axios from "axios";
import { apiResponseSchema } from "../../schemas/apiSchema";
import type { ApiResponse } from "../../schemas/apiSchema";

export async function fetchMockData(
  timeout: number,
  mockError: boolean
): Promise<ApiResponse> {
  await new Promise((resolve) => setTimeout(resolve, timeout));

  if (mockError) throw new Error("Something went wrong!");

  const res = await axios.get("/mockData.json");
  if (res.status !== 200) throw new Error("Failed to fetch mock data");
  const data = await res.data;
  return apiResponseSchema.parse(data);
}
