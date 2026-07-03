import type { LikesResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Controller, Get } from '@nestjs/common';
import { LikesService } from './likes.service';

@Controller()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get(constants.rest.endpoints.LIKES_ENDPOINT)
  getLikes(): LikesResponse {
    return this.likesService.getLikes();
  }
}
