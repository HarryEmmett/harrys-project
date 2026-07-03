import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { UserPresenceModule } from './userPresence/userPresence.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [QuestionsModule, UserPresenceModule, FriendsModule],
})
export class AppModule {}
