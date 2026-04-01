import { constants } from '@harrys-project/shared/constants';
import {
  questionSchema,
  type QuestionResponse,
} from '@harrys-project/shared/apiSchema';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ZodLoggingPipe } from '../common/pipes/zod-logging.pipe';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuestionsGateway {
  @WebSocketServer()
  private server: Server | undefined;

  handleConnection(client: Socket) {
    const message = 'Client connected: ' + client.id;
    console.log(message);
    // this will broadcast to all clients including the sender
    this.server?.emit('clientAck', message);
  }

  handleDisconnect(client: Socket) {
    const message = 'Client disconnected: ' + client.id;
    console.log(message);
    // this will broadcast to all clients including the sender, would include the sender but they have disconnected
    this.server?.emit('clientAck', message);
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_ROOM)
  joinQuestionsRoom(client: Socket, questionRoomId: string) {
    void client.join(questionRoomId);
    const message = client.id + ' joined room ' + questionRoomId;
    console.log(message);

    // this will broadcast to all clients in a room, including sender if theyre in the room
    this.server
      ?.to(questionRoomId)
      .emit(constants.ws.questions.QUESTIONS_ROOM, message);
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_ROOM + '_leave')
  leaveQuestionsRoom(client: Socket, questionRoomId: string) {
    void client.leave(questionRoomId);
    const message = client.id + ' left room ' + questionRoomId;
    console.log(message);

    this.server
      ?.to(questionRoomId)
      .emit(constants.ws.questions.QUESTIONS_ROOM + '_leave', message);
  }

  @SubscribeMessage(constants.ws.questions.QUESTIONS_EMIT_EVENT)
  handleQuestion(
    @MessageBody(new ZodLoggingPipe(questionSchema))
    data: QuestionResponse,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('New question posted:', data);

    // this will broadcast to only the sender
    client?.emit('clientAck', 'Message posted!');

    // this will broadcast to all clients in a room, excluding the sender, use this.server to include the sender
    client
      .to(constants.ws.questions.QUESTIONS_ROOM)
      .emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, data);
  }
}
