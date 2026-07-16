import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { UserPresenceModule } from '../userPresence/userPresence.module';
import { GameEntity } from './entities/game.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';

@Module({
  imports: [
    UserPresenceModule,
    TypeOrmModule.forFeature([GameEntity, QuizQuestionEntity]),
  ],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
})
export class GamesModule {}
