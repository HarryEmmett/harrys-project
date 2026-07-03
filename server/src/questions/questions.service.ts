import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {
  QuestionsResponse,
  questionsResponseSchema,
  QuestionResponse,
  questionSchema,
  QuestionChatResponse,
  questionChatResponseSchema,
  PageVisitsResponse,
  pageVisitsResponseSchema,
} from '@harrys-project/shared/apiSchema';

@Injectable()
export class QuestionsService {
  getQuestions(): QuestionsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockQuestionsData.json'),
      'utf-8',
    );

    return questionsResponseSchema.parse(JSON.parse(fileJson));
  }
  getQuestionById(id: string): QuestionResponse {
    const { questions } = this.getQuestions();
    const question = questions.find((question) => question.id === id);

    if (!question) {
      throw new NotFoundException(`Question with id "${id}" not found`);
    }

    return questionSchema.parse(question);
  }
  getQuestionChat(id: string): QuestionChatResponse {
    const fileJson = fs.readFileSync(
      path.join(
        process.cwd(),
        'src',
        'mockApiData',
        'mockQuestionChatsData.json',
      ),
      'utf-8',
    );
    const chatsByQuestionId = JSON.parse(fileJson) as Record<string, unknown[]>;

    return questionChatResponseSchema.parse({
      chatQuestions: chatsByQuestionId[id] ?? [],
    });
  }
  getPageVisits(): PageVisitsResponse {
    const fileJson = fs.readFileSync(
      path.join(process.cwd(), 'src', 'mockApiData', 'mockPageVisitsData.json'),
      'utf-8',
    );

    return pageVisitsResponseSchema.parse(JSON.parse(fileJson));
  }
}
