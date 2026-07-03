import type { MessagesResponse } from '@harrys-project/shared/apiSchema';
import { constants } from '@harrys-project/shared/constants';
import { Controller, Get, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(`${constants.rest.endpoints.MESSAGES_ENDPOINT}/:id`)
  getMessages(@Param('id') id: string): MessagesResponse {
    return this.messagesService.getMessages(id);
  }
}
