import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fs from 'fs';
import path from 'path';
import {
  QuestionsResponse,
  questionsResponseSchema,
  QuestionResponse,
  questionSchema,
  QuestionChatResponse,
  questionChatResponseSchema,
  ChatQuestionResponse,
  chatQuestionSchema,
  PageVisitsResponse,
  pageVisitsResponseSchema,
  CreateQuestionRequest,
  CreateChatQuestionRequest,
} from '@harrys-project/shared/apiSchema';
import { EventEntity } from './entities/event.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { QuestionEntity } from './entities/question.entity';
import { ChatQuestionEntity } from './entities/chat-question.entity';

const toQuestionResponse = (question: QuestionEntity): QuestionResponse => ({
  id: question.id,
  userId: question.userId,
  content: question.content,
  votes: question.votes,
  answered: question.answered,
  createdAt: question.createdAt.toISOString(),
});

const toChatQuestionResponse = (
  chatQuestion: ChatQuestionEntity,
): ChatQuestionResponse => ({
  id: chatQuestion.id,
  author: chatQuestion.author,
  content: chatQuestion.content,
  votes: chatQuestion.votes,
});

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(ParticipantEntity)
    private readonly participantRepo: Repository<ParticipantEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepo: Repository<QuestionEntity>,
    @InjectRepository(ChatQuestionEntity)
    private readonly chatQuestionRepo: Repository<ChatQuestionEntity>,
  ) {}

  // Events & rooms (plan.md roadmap #2) aren't built yet — there's exactly
  // one event in the DB (created by shared/scripts/seedDb.ts), so every
  // question/participant lookup is scoped to that single event for now.
  private async getCurrentEvent(): Promise<EventEntity> {
    const event = await this.eventRepo.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    if (!event) {
      throw new NotFoundException(
        'No event found — run "npm run db:seed" in shared/ to create one.',
      );
    }

    return event;
  }

  async getQuestions(): Promise<QuestionsResponse> {
    const event = await this.getCurrentEvent();
    const [participants, questions] = await Promise.all([
      this.participantRepo.find({ where: { event: { id: event.id } } }),
      this.questionRepo.find({
        where: { event: { id: event.id } },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return questionsResponseSchema.parse({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        createdAt: event.createdAt.toISOString(),
      },
      participants: participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
      })),
      questions: questions.map(toQuestionResponse),
    });
  }

  async getQuestionById(id: string): Promise<QuestionResponse> {
    const question = await this.questionRepo.findOneBy({ id });

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return questionSchema.parse(toQuestionResponse(question));
  }

  async createQuestion(input: CreateQuestionRequest): Promise<QuestionResponse> {
    const event = await this.getCurrentEvent();
    const question = this.questionRepo.create({
      userId: input.userId,
      content: input.content,
      votes: 0,
      answered: false,
      event,
    });

    const saved = await this.questionRepo.save(question);

    return questionSchema.parse(toQuestionResponse(saved));
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionRepo.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }
  }

  async voteQuestion(id: string, delta: 1 | -1): Promise<QuestionResponse> {
    const question = await this.questionRepo.findOneBy({ id });

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    question.votes += delta;
    const saved = await this.questionRepo.save(question);

    return questionSchema.parse(toQuestionResponse(saved));
  }

  // TODO(roadmap #5, identity/roles): restrict to the event host once roles exist.
  async closeQuestion(id: string): Promise<QuestionResponse> {
    const question = await this.questionRepo.findOneBy({ id });

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    question.answered = !question.answered;
    const saved = await this.questionRepo.save(question);

    return questionSchema.parse(toQuestionResponse(saved));
  }

  async getQuestionChat(id: string): Promise<QuestionChatResponse> {
    const chatQuestions = await this.chatQuestionRepo.find({
      where: { question: { id } },
    });

    return questionChatResponseSchema.parse({
      chatQuestions: chatQuestions.map(toChatQuestionResponse),
    });
  }

  async addChatQuestion(
    questionId: string,
    input: CreateChatQuestionRequest,
  ): Promise<ChatQuestionResponse> {
    const question = await this.questionRepo.findOneBy({ id: questionId });

    if (!question) {
      throw new NotFoundException(`Question with id "${questionId}" not found`);
    }

    const chatQuestion = this.chatQuestionRepo.create({
      author: input.author,
      content: input.content,
      votes: 0,
      question,
    });
    const saved = await this.chatQuestionRepo.save(chatQuestion);

    return chatQuestionSchema.parse(toChatQuestionResponse(saved));
  }

  async voteChatQuestion(
    questionId: string,
    chatQuestionId: string,
  ): Promise<ChatQuestionResponse> {
    const chatQuestion = await this.chatQuestionRepo.findOne({
      where: { id: chatQuestionId, question: { id: questionId } },
    });

    if (!chatQuestion) {
      throw new NotFoundException(
        `Chat question with id "${chatQuestionId}" not found on question "${questionId}"`,
      );
    }

    chatQuestion.votes += 1;
    const saved = await this.chatQuestionRepo.save(chatQuestion);

    return chatQuestionSchema.parse(toChatQuestionResponse(saved));
  }

  getPageVisits(): PageVisitsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockPageVisitsData.json'),
      'utf-8',
    );

    return pageVisitsResponseSchema.parse(JSON.parse(fileJson));
  }
}
