import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { UserPresenceModule } from '../userPresence/userPresence.module';

@Module({
  imports: [UserPresenceModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
