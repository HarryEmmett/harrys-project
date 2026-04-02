import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { UserPresenceModule } from './userPresence/userPresence.module';

@Module({
  imports: [QuestionsModule, UserPresenceModule],
})
export class AppModule {}
