import type {
  FriendsResponse,
  FriendResponse,
} from '@harrys-project/shared/apiSchema';
import {
  createFriendRequestSchema,
  type CreateFriendRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { ZodLoggingPipe } from '../common/pipes/zod-logging.pipe';

@Controller()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get(constants.rest.endpoints.FRIENDS_ENDPOINT)
  getFriends(): FriendsResponse {
    return this.friendsService.getFriends();
  }

  @Post(constants.rest.endpoints.FRIENDS_ENDPOINT)
  addFriend(
    @Body(new ZodLoggingPipe(createFriendRequestSchema))
    body: CreateFriendRequest,
  ): FriendResponse {
    // No live broadcast here (unlike questions/messages): friends aren't
    // scoped to a room, and there's no per-user identity/session yet
    // (plan.md roadmap #5) to know who else should see this friend added.
    // Once identity exists, this is where you'd notify the added user.
    return this.friendsService.addFriend(body);
  }
}
