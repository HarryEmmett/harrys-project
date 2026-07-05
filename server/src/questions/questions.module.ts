import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsGateway } from './questions.gateway';
import { UserPresenceModule } from '../userPresence/userPresence.module';
import { EventEntity } from './entities/event.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { QuestionEntity } from './entities/question.entity';
import { ChatQuestionEntity } from './entities/chat-question.entity';

@Module({
  imports: [
    UserPresenceModule,
    TypeOrmModule.forFeature([
      EventEntity,
      ParticipantEntity,
      QuestionEntity,
      ChatQuestionEntity,
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsGateway],
})
export class QuestionsModule {}
