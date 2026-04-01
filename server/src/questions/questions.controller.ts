import type {
  QuestionsResponse,
  PageVisitsResponse,
  LikesResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Controller, Get } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get(constants.rest.endpoints.QUESTIONS_ENDPOINT)
  getQuestions(): QuestionsResponse {
    return this.questionsService.getQuestions();
  }

  @Get(constants.rest.endpoints.PAGE_VISITS_ENDPOINT)
  getPageVisits(): PageVisitsResponse {
    return this.questionsService.getPageVisits();
  }

  @Get(constants.rest.endpoints.LIKES_ENDPOINT)
  getLikes(): LikesResponse {
    return this.questionsService.getLikes();
  }
}
