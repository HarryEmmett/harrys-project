import type {
  QuestionsResponse,
  QuestionResponse,
  QuestionChatResponse,
  ChatQuestionResponse,
  PageVisitsResponse,
} from '@harrys-project/shared/apiSchema';
import {
  createQuestionRequestSchema,
  voteQuestionRequestSchema,
  createChatQuestionRequestSchema,
  type CreateQuestionRequest,
  type VoteQuestionRequest,
  type CreateChatQuestionRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsGateway } from './questions.gateway';
import { ZodLoggingPipe } from '../common/pipes/zod-logging.pipe';

@Controller()
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly questionsGateway: QuestionsGateway,
  ) {}

  @Get(constants.rest.endpoints.QUESTIONS_ENDPOINT)
  getQuestions(): QuestionsResponse {
    return this.questionsService.getQuestions();
  }

  @Get(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id`)
  getQuestionById(@Param('id') id: string): QuestionResponse {
    return this.questionsService.getQuestionById(id);
  }

  @Post(constants.rest.endpoints.QUESTIONS_ENDPOINT)
  createQuestion(
    @Body(new ZodLoggingPipe(createQuestionRequestSchema))
    body: CreateQuestionRequest,
  ): QuestionResponse {
    const question = this.questionsService.createQuestion(body);
    this.questionsGateway.broadcastQuestionCreated(question);
    return question;
  }

  @Delete(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id`)
  @HttpCode(204)
  deleteQuestion(@Param('id') id: string): void {
    this.questionsService.deleteQuestion(id);
    this.questionsGateway.broadcastQuestionDeleted(id);
  }

  @Patch(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id/vote`)
  voteQuestion(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(voteQuestionRequestSchema))
    body: VoteQuestionRequest,
  ): QuestionResponse {
    const question = this.questionsService.voteQuestion(id, body.delta);
    this.questionsGateway.broadcastQuestionUpdated(question);
    return question;
  }

  @Get(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id/chat`)
  getQuestionChat(@Param('id') id: string): QuestionChatResponse {
    return this.questionsService.getQuestionChat(id);
  }

  @Post(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id/chat`)
  addChatQuestion(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(createChatQuestionRequestSchema))
    body: CreateChatQuestionRequest,
  ): ChatQuestionResponse {
    const chatQuestion = this.questionsService.addChatQuestion(id, body);
    this.questionsGateway.broadcastChatQuestionCreated(id, chatQuestion);
    return chatQuestion;
  }

  @Patch(`${constants.rest.endpoints.QUESTIONS_ENDPOINT}/:id/chat/:chatId/vote`)
  voteChatQuestion(
    @Param('id') id: string,
    @Param('chatId') chatId: string,
  ): ChatQuestionResponse {
    const chatQuestion = this.questionsService.voteChatQuestion(id, chatId);
    this.questionsGateway.broadcastChatQuestionUpdated(id, chatQuestion);
    return chatQuestion;
  }

  @Get(constants.rest.endpoints.PAGE_VISITS_ENDPOINT)
  getPageVisits(): PageVisitsResponse {
    return this.questionsService.getPageVisits();
  }
}
