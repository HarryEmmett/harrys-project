import type {
  QuestionsResponse,
  QuestionResponse,
  QuestionChatResponse,
  PageVisitsResponse,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Controller, Get, Param } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get(constants.rest.endpoints.QUESTIONS_ENDPOINT)
  getQuestions(): QuestionsResponse {
    return this.questionsService.getQuestions();
  }

  @Get(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id`)
  getQuestionById(@Param('id') id: string): QuestionResponse {
    return this.questionsService.getQuestionById(id);
  }

  @Get(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id/chat`)
  getQuestionChat(@Param('id') id: string): QuestionChatResponse {
    return this.questionsService.getQuestionChat(id);
  }

  @Get(constants.rest.endpoints.PAGE_VISITS_ENDPOINT)
  getPageVisits(): PageVisitsResponse {
    return this.questionsService.getPageVisits();
  }
}
