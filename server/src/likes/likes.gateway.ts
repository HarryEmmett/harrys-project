import { constants } from '@harrys-project/shared/constants';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LikesService } from './likes.service';

@WebSocketGateway({
  namespace: '/likes',
  cors: {
    origin: '*',
  },
})
export class LikesGateway {
  constructor(private readonly likesService: LikesService) {}

  @WebSocketServer()
  private server: Server | undefined;

  handleConnection(@ConnectedSocket() client: Socket) {
    client.emit(constants.ws.likes.LIKES_EMIT_EVENT, this.likesService.getLikes());
  }

  @SubscribeMessage(constants.ws.likes.LIKES_EMIT_EVENT)
  handleLike() {
    const updated = this.likesService.incrementLikes();

    // broadcast the new total to every connected client, including the sender
    this.server?.emit(constants.ws.likes.LIKES_EMIT_EVENT, updated);
  }
}
