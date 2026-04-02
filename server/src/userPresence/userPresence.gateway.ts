import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserPresenceService } from './userPresence.service';

@WebSocketGateway({
  namespace: '/presence',
  cors: {
    origin: '*',
  },
})
export class UserPresenceGateway {
  constructor(private readonly userPresenceService: UserPresenceService) {
    this.userPresenceService = userPresenceService;
  }
  @WebSocketServer()
  private server: Server | undefined;
  handleConnection() {
    this.userPresenceService.handleAddUser('/presence');
    this.server?.emit('onlineCount:update', {
      total: this.userPresenceService.getTotalOnlineCount(),
      namespace: '/presence',
      namespaceCount:
        this.userPresenceService.getNamespaceOnlineCount('/presence'),
    });
  }

  handleDisconnect() {
    this.userPresenceService.handleRemoveUser('/presence');
    this.server?.emit('onlineCount:update', {
      total: this.userPresenceService.getTotalOnlineCount(),
      namespace: '/presence',
      namespaceCount:
        this.userPresenceService.getNamespaceOnlineCount('/presence'),
    });
  }
}
