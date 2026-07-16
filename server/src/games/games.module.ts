import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { CodenamesController } from './codenames/codenames.controller';
import { CodenamesService } from './codenames/codenames.service';
import { UserPresenceModule } from '../userPresence/userPresence.module';
import { GameEntity } from './entities/game.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';
import { CodenamesSessionEntity } from './codenames/entities/codenames-session.entity';

@Module({
  imports: [
    UserPresenceModule,
    TypeOrmModule.forFeature([
      GameEntity,
      QuizQuestionEntity,
      CodenamesSessionEntity,
    ]),
  ],
  controllers: [GamesController, CodenamesController],
  providers: [GamesService, GamesGateway, CodenamesService],
})
export class GamesModule {}
