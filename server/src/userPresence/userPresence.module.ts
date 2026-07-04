import { Module } from '@nestjs/common';
import { UserPresenceGateway } from './userPresence.gateway';
import { UserPresenceService } from './userPresence.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UserPresenceGateway, UserPresenceService],
  exports: [UserPresenceService, UserPresenceGateway],
})
export class UserPresenceModule {}
