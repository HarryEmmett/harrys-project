import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type {
  QuestionsResponse,
  LikesResponse,
  PageVisitsResponse,
} from '@harrys-project/shared/apiSchema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('questions')
  getQuestions(): QuestionsResponse {
    return this.appService.getQuestions();
  }

  @Get('page-visits')
  getPageVisits(): PageVisitsResponse {
    return this.appService.getPageVisits();
  }

  @Get('likes')
  getLikes(): LikesResponse {
    return this.appService.getLikes();
  }
}
