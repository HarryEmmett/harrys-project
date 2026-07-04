import { constants } from '@harrys-project/shared/constants';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserPresenceService } from './userPresence.service';

// Single source of truth for broadcasting the online count. Every other
// gateway (Questions, Messages, ...) updates UserPresenceService on its own
// connect/disconnect, then calls this.broadcastOnlineCount() here instead of
// emitting its own presence event — that way there's one event name, one
// payload shape, and one namespace clients need to listen on for the total.
@WebSocketGateway({
  namespace: '/presence',
  cors: {
    origin: '*',
  },
})
export class UserPresenceGateway {
  constructor(private readonly userPresenceService: UserPresenceService) {}

  @WebSocketServer()
  private server: Server | undefined;

  handleConnection() {
    this.userPresenceService.handleAddUser('/presence');
    this.broadcastOnlineCount();
  }

  handleDisconnect() {
    this.userPresenceService.handleRemoveUser('/presence');
    this.broadcastOnlineCount();
  }

  broadcastOnlineCount() {
    this.server?.emit(
      constants.ws.presence.ONLINE_COUNT_EVENT,
      this.userPresenceService.getTotalOnlineCount(),
    );
  }
}
