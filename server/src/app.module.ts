import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { UserPresenceModule } from './userPresence/userPresence.module';
import { FriendsModule } from './friends/friends.module';
import { MessagesModule } from './messages/messages.module';
import { LikesModule } from './likes/likes.module';

@Module({
  imports: [
    QuestionsModule,
    UserPresenceModule,
    FriendsModule,
    MessagesModule,
    LikesModule,
  ],
})
export class AppModule {}
