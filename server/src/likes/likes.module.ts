import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { LikesGateway } from './likes.gateway';

@Module({
  controllers: [LikesController],
  providers: [LikesService, LikesGateway],
})
export class LikesModule {}
