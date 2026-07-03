import type { FriendsResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Controller, Get } from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get(constants.rest.endpoints.FRIENDS_ENDPOINT)
  getFriends(): FriendsResponse {
    return this.friendsService.getFriends();
  }
}
