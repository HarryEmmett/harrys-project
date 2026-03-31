import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { constants } from '@harrys-project/shared/constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuestionsGateway {
  @WebSocketServer()
  private server: Server | undefined;
  private numUsers = 0;

  decrementUsers() {
    this.numUsers = Math.max(0, this.numUsers - 1);
    return this.numUsers;
  }
  incrementUsers() {
    this.numUsers++;
    return this.numUsers;
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    this.server?.emit('users-in-room', this.incrementUsers());
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.server?.emit('users-in-room', this.decrementUsers());
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_ROOM)
  joinQuestionsRoom(client: Socket, questionRoomId: string) {
    void client.join(questionRoomId);
    const message = client.id + ' joined room ' + questionRoomId;
    console.log(message);
    this.server
      ?.to(questionRoomId)
      .emit(constants.ws.questions.QUESTIONS_ROOM, message);
  }

  @SubscribeMessage('users-in-room')
  handleUsersInRoom(client: Socket, roomId: string) {
    const message = `Successfully joined room ${roomId}: ${this.numUsers}`;
    console.log(message);
    this.server?.to(roomId).emit(constants.ws.questions.QUESTIONS_ROOM, {
      roomId,
      numUsers: this.numUsers,
      message,
    });
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_EMIT_EVENT)
  handleQuestion(
    @MessageBody() data: { questionRoomId: string; question: string },
  ) {
    console.log('New question posted:', data);

    this.server
      ?.to(data.questionRoomId)
      .emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, data);
  }
}
