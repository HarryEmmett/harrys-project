import { constants } from '@harrys-project/shared/constants';
import type { MessageResponse } from '@harrys-project/shared/apiSchema';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserPresenceService } from '../userPresence/userPresence.service';
import { UserPresenceGateway } from '../userPresence/userPresence.gateway';

// One room per conversation (room id = friendId). MessagesController joins
// mutations to this gateway the same way QuestionsController does: it
// persists via MessagesService, then calls broadcastMessageCreated so
// everyone else viewing that conversation gets the update live.
@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  constructor(
    private readonly userPresenceService: UserPresenceService,
    private readonly userPresenceGateway: UserPresenceGateway,
  ) {}

  @WebSocketServer()
  private server: Server | undefined;

  handleConnection() {
    this.userPresenceService.handleAddUser('/messages');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  handleDisconnect() {
    this.userPresenceService.handleRemoveUser('/messages');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  @SubscribeMessage(constants.ws.messages.MESSAGE_ROOM)
  joinMessageRoom(client: Socket, friendId: string) {
    void client.join(friendId);
  }

  @SubscribeMessage(constants.ws.messages.MESSAGE_ROOM + '_leave')
  leaveMessageRoom(client: Socket, friendId: string) {
    void client.leave(friendId);
  }

  broadcastMessageCreated(friendId: string, message: MessageResponse) {
    this.server
      ?.to(friendId)
      .emit(constants.ws.messages.MESSAGE_ADDED_EVENT, message);
  }
}
