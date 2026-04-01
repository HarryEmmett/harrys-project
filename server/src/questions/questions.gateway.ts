import { constants } from '@harrys-project/shared/constants';
import * as apiSchema from '@harrys-project/shared/apiSchema';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ZodValidationPipe } from 'nestjs-zod';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuestionsGateway {
  @WebSocketServer()
  private server: Server | undefined;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
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

  @SubscribeMessage(constants.ws.questions.QUESTIONS_EMIT_EVENT)
  handleQuestion(
    @MessageBody(new ZodValidationPipe(apiSchema.questionsResponseSchema))
    data: apiSchema.QuestionsResponse,
    // @ConnectedSocket() client: Socket use to send back to sender only, server is broadcasting to all subscribed
  ) {
    // how to make zod pipe log error?
    console.log('New question posted:', data);
    const number = Math.floor(Math.random() * 5) - 1;
    console.log(number);
    this.server
      ?.to(constants.ws.questions.QUESTIONS_ROOM)
      .emit(
        constants.ws.questions.QUESTIONS_EMIT_EVENT,
        data.questions[number],
      );
  }
}
