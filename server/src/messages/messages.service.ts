import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  MessagesResponse,
  MessageResponse,
  messagesResponseSchema,
  CreateMessageRequest,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class MessagesService {
  // In-memory store seeded from mock JSON, keyed by friendId. Swap for a
  // TypeORM repository (Message entity with a friendId/room column) once
  // the DB is wired up — method signatures can stay the same.
  private messagesByFriendId: Record<string, MessageResponse[]>;

  constructor() {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockMessagesData.json'),
      'utf-8',
    );
    this.messagesByFriendId = JSON.parse(fileJson) as Record<
      string,
      MessageResponse[]
    >;
  }

  getMessages(friendId: string): MessagesResponse {
    return messagesResponseSchema.parse({
      messages: this.messagesByFriendId[friendId] ?? [],
    });
  }

  addMessage(friendId: string, input: CreateMessageRequest): MessageResponse {
    const messages = this.messagesByFriendId[friendId] ?? [];
    const message: MessageResponse = {
      id: `m${messages.length + 1}_${Date.now()}`,
      author: input.author,
      authorName: input.authorName,
      content: input.content,
      sentAt: new Date().toISOString(),
    };

    // DB: INSERT INTO messages (id, friend_id, author, author_name, content, sent_at) VALUES (...)
    this.messagesByFriendId[friendId] = [...messages, message];

    return message;
  }
}
