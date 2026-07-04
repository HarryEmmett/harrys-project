import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  FriendsResponse,
  FriendResponse,
  friendsResponseSchema,
  CreateFriendRequest,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class FriendsService {
  // In-memory store seeded from mock JSON. Swap for a TypeORM repository
  // (Friend entity) once the DB is wired up — method signatures can stay
  // the same.
  private friends: FriendResponse[];

  constructor() {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockFriendsData.json'),
      'utf-8',
    );
    this.friends = friendsResponseSchema.parse(JSON.parse(fileJson)).friends;
  }

  getFriends(): FriendsResponse {
    return friendsResponseSchema.parse({ friends: this.friends });
  }

  addFriend(input: CreateFriendRequest): FriendResponse {
    const friend: FriendResponse = {
      id: `f${this.friends.length + 1}_${Date.now()}`,
      name: input.name,
      email: input.email,
      bio: input.bio,
      isOnline: false,
    };

    // DB: INSERT INTO friends (id, name, email, bio, is_online) VALUES (...)
    this.friends.push(friend);

    return friend;
  }
}
