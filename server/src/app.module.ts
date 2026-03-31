import { Module } from '@nestjs/common';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';
import { QuestionsGateway } from './questions/questions.gateway';

@Module({
  imports: [],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsGateway],
})
export class AppModule {}
