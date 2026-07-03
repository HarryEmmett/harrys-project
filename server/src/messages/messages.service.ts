import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  MessagesResponse,
  messagesResponseSchema,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class MessagesService {
  getMessages(friendId: string): MessagesResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockMessagesData.json'),
      'utf-8',
    );
    const messagesByFriendId = JSON.parse(fileJson) as Record<
      string,
      unknown[]
    >;

    return messagesResponseSchema.parse({
      messages: messagesByFriendId[friendId] ?? [],
    });
  }
}
