import type {
  GamesResponse,
  GameResponse,
  GameQuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import type { SubmitQuizAnswersResponse } from '@harrys-project/shared/apiSchema';
import {
  voteGameRequestSchema,
  type VoteGameRequest,
  submitQuizAnswersRequestSchema,
  type SubmitQuizAnswersRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { ZodLoggingPipe } from '../common/pipes/zod-logging.pipe';

@Controller()
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamesGateway: GamesGateway,
  ) {}

  @Get(constants.rest.endpoints.GAMES_ENDPOINT)
  getGames(): Promise<GamesResponse> {
    return this.gamesService.getGames();
  }

  @Get(`${constants.rest.endpoints.GAMES_ENDPOINT}/:id`)
  getGameById(@Param('id') id: string): Promise<GameResponse> {
    return this.gamesService.getGameById(id);
  }

  @Get(`${constants.rest.endpoints.GAMES_ENDPOINT}/:id/questions`)
  getGameQuestions(@Param('id') id: string): Promise<GameQuestionsResponse> {
    return this.gamesService.getGameQuestions(id);
  }

  @Patch(`${constants.rest.endpoints.GAMES_ENDPOINT}/:id/vote`)
  async voteGame(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(voteGameRequestSchema))
    body: VoteGameRequest,
  ): Promise<GameResponse> {
    const game = await this.gamesService.voteGame(id, body.delta);
    this.gamesGateway.broadcastGameUpdated(game);
    return game;
  }

  // No broadcast — a score is only relevant to the person who submitted it.
  @Post(`${constants.rest.endpoints.GAMES_ENDPOINT}/:id/submit`)
  submitQuizAnswers(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(submitQuizAnswersRequestSchema))
    body: SubmitQuizAnswersRequest,
  ): Promise<SubmitQuizAnswersResponse> {
    return this.gamesService.submitQuizAnswers(id, body);
  }
}
