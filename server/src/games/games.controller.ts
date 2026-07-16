import type {
  GamesResponse,
  GameResponse,
  GameQuestionsResponse,
} from '@harrys-project/shared/apiSchema';
import {
  voteGameRequestSchema,
  type VoteGameRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
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
}
