import type {
  MessagesResponse,
  MessageResponse,
} from '@harrys-project/shared/apiSchema';
import {
  createMessageRequestSchema,
  type CreateMessageRequest,
} from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { ZodLoggingPipe } from '../common/pipes/zod-logging.pipe';

@Controller()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Get(`${constants.rest.endpoints.MESSAGES_ENDPOINT}/:id`)
  getMessages(@Param('id') id: string): MessagesResponse {
    return this.messagesService.getMessages(id);
  }

  @Post(`${constants.rest.endpoints.MESSAGES_ENDPOINT}/:id`)
  postMessage(
    @Param('id') id: string,
    @Body(new ZodLoggingPipe(createMessageRequestSchema))
    body: CreateMessageRequest,
  ): MessageResponse {
    const message = this.messagesService.addMessage(id, body);
    this.messagesGateway.broadcastMessageCreated(id, message);
    return message;
  }
}
