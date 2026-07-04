import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { UserPresenceModule } from './userPresence/userPresence.module';
import { FriendsModule } from './friends/friends.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [QuestionsModule, UserPresenceModule, FriendsModule, MessagesModule],
})
export class AppModule {}
