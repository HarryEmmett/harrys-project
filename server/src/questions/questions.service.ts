import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  QuestionsResponse,
  questionsResponseSchema,
  QuestionResponse,
  questionSchema,
  QuestionChatResponse,
  ChatQuestionResponse,
  PageVisitsResponse,
  pageVisitsResponseSchema,
  CreateQuestionRequest,
  CreateChatQuestionRequest,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class QuestionsService {
  // In-memory store seeded from mock JSON on boot. This is the "real data
  // layer" prerequisite from plan.md roadmap #1 — replace this whole class's
  // internals with a TypeORM repository once the DB is wired up; the method
  // signatures below can stay the same.
  private event: QuestionsResponse['event'];
  private participants: QuestionsResponse['participants'];
  private questions: QuestionResponse[];
  private chatQuestionsByQuestionId: Record<string, ChatQuestionResponse[]>;

  constructor() {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockQuestionsData.json'),
      'utf-8',
    );
    const seed = questionsResponseSchema.parse(JSON.parse(fileJson));
    this.event = seed.event;
    this.participants = seed.participants;
    this.questions = seed.questions;

    const chatFileJson = fs.readFileSync(
      path.join(
        process.cwd(),
        'src',
        'mockApiData',
        'mockQuestionChatsData.json',
      ),
      'utf-8',
    );
    this.chatQuestionsByQuestionId = JSON.parse(chatFileJson) as Record<
      string,
      ChatQuestionResponse[]
    >;
  }

  getQuestions(): QuestionsResponse {
    return questionsResponseSchema.parse({
      event: this.event,
      participants: this.participants,
      questions: this.questions,
    });
  }

  getQuestionById(id: string): QuestionResponse {
    const question = this.questions.find((question) => question.id === id);

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return questionSchema.parse(question);
  }

  createQuestion(input: CreateQuestionRequest): QuestionResponse {
    const question = questionSchema.parse({
      id: `q${this.questions.length + 1}_${Date.now()}`,
      userId: input.userId,
      content: input.content,
      votes: 0,
      answered: false,
      createdAt: new Date().toISOString(),
    });

    // DB: INSERT INTO questions (id, user_id, content, votes, answered, created_at) VALUES (...)
    this.questions.push(question);

    return question;
  }

  deleteQuestion(id: string): void {
    const index = this.questions.findIndex((question) => question.id === id);

    if (index === -1) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    // DB: DELETE FROM questions WHERE id = $1
    this.questions.splice(index, 1);
  }

  voteQuestion(id: string, delta: 1 | -1): QuestionResponse {
    const question = this.questions.find((question) => question.id === id);

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    // DB: UPDATE questions SET votes = votes + $1 WHERE id = $2
    question.votes += delta;

    return questionSchema.parse(question);
  }

  getQuestionChat(id: string): QuestionChatResponse {
    return {
      chatQuestions: this.chatQuestionsByQuestionId[id] ?? [],
    };
  }

  addChatQuestion(
    questionId: string,
    input: CreateChatQuestionRequest,
  ): ChatQuestionResponse {
    const chatQuestions = this.chatQuestionsByQuestionId[questionId] ?? [];
    const chatQuestion: ChatQuestionResponse = {
      id: `c${chatQuestions.length + 1}_${Date.now()}`,
      author: input.author,
      content: input.content,
      votes: 0,
    };

    // DB: INSERT INTO chat_questions (id, question_id, author, content, votes) VALUES (...)
    this.chatQuestionsByQuestionId[questionId] = [
      ...chatQuestions,
      chatQuestion,
    ];

    return chatQuestion;
  }

  voteChatQuestion(
    questionId: string,
    chatQuestionId: string,
  ): ChatQuestionResponse {
    const chatQuestions = this.chatQuestionsByQuestionId[questionId] ?? [];
    const chatQuestion = chatQuestions.find(
      (chatQuestion) => chatQuestion.id === chatQuestionId,
    );

    if (!chatQuestion) {
      throw new NotFoundException(
        `Chat question with id "${chatQuestionId}" not found on question "${questionId}"`,
      );
    }

    // DB: UPDATE chat_questions SET votes = votes + 1 WHERE id = $1 AND question_id = $2
    chatQuestion.votes += 1;

    return chatQuestion;
  }

  getPageVisits(): PageVisitsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockPageVisitsData.json'),
      'utf-8',
    );

    return pageVisitsResponseSchema.parse(JSON.parse(fileJson));
  }
}
