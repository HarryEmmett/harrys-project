import type {
  CodenamesKeyResponse,
  CodenamesSessionResponse,
} from '@harrys-project/shared/apiSchema';
import {
  createCodenamesSessionRequestSchema,
  giveCodenamesClueRequestSchema,
  revealCodenamesCardRequestSchema,
  type CreateCodenamesSessionRequest,
  type GiveCodenamesClueRequest,
  type RevealCodenamesCardRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CodenamesService } from './codenames.service';
import { GamesGateway } from '../games.gateway';
import { ZodLoggingPipe } from '../../common/pipes/zod-logging.pipe';

const SESSIONS = constants.rest.endpoints.CODENAMES_SESSIONS_ENDPOINT;

@Controller()
export class CodenamesController {
  constructor(
    private readonly codenamesService: CodenamesService,
    private readonly gamesGateway: GamesGateway,
  ) {}

  @Post(SESSIONS)
  createSession(
    @Body(new ZodLoggingPipe(createCodenamesSessionRequestSchema))
    body: CreateCodenamesSessionRequest,
  ): Promise<CodenamesSessionResponse> {
    return this.codenamesService.createSession(body.gameId);
  }

  @Get(`${SESSIONS}/:id`)
  getSession(@Param('id') id: string): Promise<CodenamesSessionResponse> {
    return this.codenamesService.getSession(id);
  }

  @Get(`${SESSIONS}/:id/key`)
  getSessionKey(@Param('id') id: string): Promise<CodenamesKeyResponse> {
    return this.codenamesService.getSessionKey(id);
  }

  @Patch(`${SESSIONS}/:id/clue`)
  async giveClue(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(giveCodenamesClueRequestSchema))
    body: GiveCodenamesClueRequest,
  ): Promise<CodenamesSessionResponse> {
    const session = await this.codenamesService.giveClue(
      id,
      body.word,
      body.count,
    );
    this.gamesGateway.broadcastCodenamesSessionUpdated(session);
    return session;
  }

  @Patch(`${SESSIONS}/:id/reveal`)
  async revealCard(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(revealCodenamesCardRequestSchema))
    body: RevealCodenamesCardRequest,
  ): Promise<CodenamesSessionResponse> {
    const session = await this.codenamesService.revealCard(id, body.cardIndex);
    this.gamesGateway.broadcastCodenamesSessionUpdated(session);
    return session;
  }

  @Patch(`${SESSIONS}/:id/end-turn`)
  async endTurn(@Param('id') id: string): Promise<CodenamesSessionResponse> {
    const session = await this.codenamesService.endTurn(id);
    this.gamesGateway.broadcastCodenamesSessionUpdated(session);
    return session;
  }
}
