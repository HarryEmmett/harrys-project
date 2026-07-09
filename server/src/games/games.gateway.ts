import { constants } from '@harrys-project/shared/constants';
import { GameResponse } from '@harrys-project/shared/apiSchema';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserPresenceService } from '../userPresence/userPresence.service';
import { UserPresenceGateway } from '../userPresence/userPresence.gateway';

@WebSocketGateway({
  namespace: '/games',
  cors: {
    origin: '*',
  },
})
export class GamesGateway {
  constructor(
    private readonly userPresenceService: UserPresenceService,
    private readonly userPresenceGateway: UserPresenceGateway,
  ) {}
  @WebSocketServer()
  private server: Server | undefined;

  handleConnection() {
    this.userPresenceService.handleAddUser('/games');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  handleDisconnect() {
    this.userPresenceService.handleRemoveUser('/games');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  // Called by GamesController after a vote. No rooms/join-leave here — with
  // no per-question chat/reply feature there's nothing left to scope
  // broadcasts to, so this just goes out to every connected client.
  broadcastGameUpdated(game: GameResponse) {
    this.server?.emit(constants.ws.games.GAMES_UPDATED_EVENT, game);
  }
}
