import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PollsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('question-added')
  handleQuestion(@MessageBody() data: { pollId: string; question: string }) {
    console.log('New question posted:', data);

    this.server.to(data.pollId).emit('question-added', data);
  }

  @SubscribeMessage('question-room')
  joinPollRoom(client: Socket, pollId: string) {
    console.log(client.id + ' joining room ' + pollId);
    void client.join(pollId);
    client.emit('question-room', pollId);
  }
}
