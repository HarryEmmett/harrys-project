import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  FriendsResponse,
  friendsResponseSchema,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class FriendsService {
  getFriends(): FriendsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockFriendsData.json'),
      'utf-8',
    );

    return friendsResponseSchema.parse(JSON.parse(fileJson));
  }
}
