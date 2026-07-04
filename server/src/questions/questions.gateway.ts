import { constants } from '@harrys-project/shared/constants';
import {
  questionSchema,
  type QuestionResponse,
  type ChatQuestionResponse,
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
import { UserPresenceService } from '../userPresence/userPresence.service';
import { UserPresenceGateway } from '../userPresence/userPresence.gateway';
import { QuestionsService } from './questions.service';

@WebSocketGateway({
  namespace: '/questions',
  cors: {
    origin: '*',
  },
})
export class QuestionsGateway {
  constructor(
    private readonly userPresenceService: UserPresenceService,
    private readonly userPresenceGateway: UserPresenceGateway,
    private readonly questionsService: QuestionsService,
  ) {}
  @WebSocketServer()
  private server: Server | undefined;

  handleConnection() {
    this.userPresenceService.handleAddUser('/questions');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  handleDisconnect() {
    this.userPresenceService.handleRemoveUser('/questions');
    this.userPresenceGateway.broadcastOnlineCount();
  }

  // Rooms are keyed by whatever id the client passes in (a question id, in
  // practice) — this is what scopes chat-question broadcasts below to just
  // the people viewing that question.
  @SubscribeMessage(constants.ws.questions.QUESTIONS_ROOM)
  joinQuestionsRoom(client: Socket, questionRoomId: string) {
    void client.join(questionRoomId);
    const message = client.id + ' joined room ' + questionRoomId;
    console.log(message);

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

  // Live-post path: client emits a question directly over the socket instead
  // of hitting POST /questions. Both paths must go through
  // QuestionsService.createQuestion so there's a single place that persists,
  // and both end up broadcasting via broadcastQuestionCreated.
  @SubscribeMessage(constants.ws.questions.QUESTIONS_EMIT_EVENT)
  handleQuestion(
    @MessageBody(new ZodLoggingPipe(questionSchema))
    data: QuestionResponse,
    @ConnectedSocket() client: Socket,
  ) {
    const created = this.questionsService.createQuestion({
      userId: data.userId,
      content: data.content,
    });

    client?.emit('clientAck', 'Message posted!');
    this.broadcastQuestionCreated(created);
  }

  // Called by QuestionsController after a REST create/vote/delete so both
  // entry points broadcast identically to every connected client.
  //
  // TODO: once questions are scoped per-event (plan.md roadmap #2 — "Events
  // & rooms"), these should broadcast to that event's room instead of every
  // connected client, since right now there's only one global question list.
  broadcastQuestionCreated(question: QuestionResponse) {
    this.server?.emit(constants.ws.questions.QUESTIONS_EMIT_EVENT, question);
  }

  broadcastQuestionUpdated(question: QuestionResponse) {
    this.server?.emit(constants.ws.questions.QUESTIONS_UPDATED_EVENT, question);
  }

  broadcastQuestionDeleted(id: string) {
    this.server?.emit(constants.ws.questions.QUESTIONS_DELETED_EVENT, id);
  }

  // Chat-question broadcasts, by contrast, ARE already scoped correctly — to
  // the question's room, which clients join via QUESTIONS_ROOM above.
  broadcastChatQuestionCreated(
    questionId: string,
    chatQuestion: ChatQuestionResponse,
  ) {
    this.server
      ?.to(questionId)
      .emit(constants.ws.questions.CHAT_QUESTION_ADDED_EVENT, chatQuestion);
  }

  broadcastChatQuestionUpdated(
    questionId: string,
    chatQuestion: ChatQuestionResponse,
  ) {
    this.server
      ?.to(questionId)
      .emit(constants.ws.questions.CHAT_QUESTION_UPDATED_EVENT, chatQuestion);
  }
}
