import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PollsGateway } from './app.websocket';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PollsGateway],
})
export class AppModule {}
