import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  QuestionsResponse,
  questionsResponseSchema,
  LikesResponse,
  likesResponseSchema,
  PageVisitsResponse,
  pageVisitsResponseSchema,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class QuestionsService {
  getQuestions(): QuestionsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockQuestionsData.json'),
      'utf-8',
    );

    return questionsResponseSchema.parse(JSON.parse(fileJson));
  }
  getPageVisits(): PageVisitsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockPageVisitsData.json'),
      'utf-8',
    );

    return pageVisitsResponseSchema.parse(JSON.parse(fileJson));
  }
  getLikes(): LikesResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockLikesData.json'),
      'utf-8',
    );

    return likesResponseSchema.parse(JSON.parse(fileJson));
  }
}
