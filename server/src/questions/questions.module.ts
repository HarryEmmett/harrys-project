import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsGateway } from './questions.gateway';
import { UserPresenceModule } from '../userPresence/userPresence.module';

@Module({
  imports: [UserPresenceModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsGateway],
})
export class QuestionsModule {}
