import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';

@Module({
  imports: [QuestionsModule],
})
export class AppModule {}
