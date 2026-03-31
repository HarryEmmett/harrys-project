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
  server: Server | undefined;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_EMIT_EVENT)
  handleQuestion(@MessageBody() data: { pollId: string; question: string }) {
    console.log('New question posted:', data);

    this.server
      ?.to(data.pollId)
      .emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, data);
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_ROOM)
  joinPollRoom(client: Socket, pollId: string) {
    console.log(client.id + ' joining room ' + pollId);
    void client.join(pollId);
    client.emit(constants.ws.questions.QUESTIONS_ROOM, pollId);
  }
}
