import { Controller, Get } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import * as apiSchema from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get(constants.rest.QUESTIONS_ENDPOINT)
  getQuestions(): apiSchema.QuestionsResponse {
    return this.questionsService.getQuestions();
  }

  @Get(constants.rest.PAGE_VISITS_ENDPOINT)
  getPageVisits(): apiSchema.PageVisitsResponse {
    return this.questionsService.getPageVisits();
  }

  @Get(constants.rest.LIKES_ENDPOINT)
  getLikes(): apiSchema.LikesResponse {
    return this.questionsService.getLikes();
  }
}
