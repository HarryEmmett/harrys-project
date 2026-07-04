import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  LikesResponse,
  likesResponseSchema,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class LikesService {
  private likes: number;

  constructor() {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockLikesData.json'),
      'utf-8',
    );
    this.likes = likesResponseSchema.parse(JSON.parse(fileJson)).likes;
  }

  getLikes(): LikesResponse {
    return likesResponseSchema.parse({ likes: this.likes });
  }

  incrementLikes(): LikesResponse {
    // DB: UPDATE likes SET count = count + 1 WHERE id = 1 (or an INSERT per like row, if you want per-user/undo semantics later)
    this.likes += 1;
    return this.getLikes();
  }
}
