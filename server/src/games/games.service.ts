import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GamesResponse,
  gamesResponseSchema,
  GameResponse,
  gameSchema,
  GameQuestionsResponse,
  gameQuestionsResponseSchema,
  QuizQuestionResponse,
  SubmitQuizAnswersRequest,
  SubmitQuizAnswersResponse,
  submitQuizAnswersResponseSchema,
} from '@harrys-project/shared/apiSchema';
import { GameEntity } from './entities/game.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';

const toGameResponse = (game: GameEntity): GameResponse => ({
  id: game.id,
  title: game.title,
  description: game.description,
  gameType: game.gameType as 'quiz',
  votes: game.votes,
  createdAt: game.createdAt.toISOString(),
});

const toQuizQuestionResponse = (
  quizQuestion: QuizQuestionEntity,
): QuizQuestionResponse => ({
  id: quizQuestion.id,
  gameId: quizQuestion.gameId,
  prompt: quizQuestion.prompt,
  options: quizQuestion.options,
  createdAt: quizQuestion.createdAt.toISOString(),
});

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(QuizQuestionEntity)
    private readonly quizQuestionRepo: Repository<QuizQuestionEntity>,
  ) {}

  async getGames(): Promise<GamesResponse> {
    const games = await this.gameRepo.find({ order: { createdAt: 'ASC' } });

    return gamesResponseSchema.parse({
      games: games.map(toGameResponse),
    });
  }

  async getGameById(id: string): Promise<GameResponse> {
    const game = await this.gameRepo.findOneBy({ id });

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    return gameSchema.parse(toGameResponse(game));
  }

  async getGameQuestions(id: string): Promise<GameQuestionsResponse> {
    const quizQuestions = await this.quizQuestionRepo.find({
      where: { gameId: id },
      order: { createdAt: 'ASC' },
    });

    return gameQuestionsResponseSchema.parse({
      quizQuestions: quizQuestions.map(toQuizQuestionResponse),
    });
  }

  async voteGame(id: string, delta: 1 | -1): Promise<GameResponse> {
    // Atomic increment so concurrent votes can't lose updates
    // (read → += → save races under two simultaneous requests).
    const result = await this.gameRepo.increment({ id }, 'votes', delta);

    if (!result.affected) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    const game = await this.gameRepo.findOneByOrFail({ id });

    return gameSchema.parse(toGameResponse(game));
  }

  // Stateless scoring: nothing is persisted and there's no identity to tie an
  // attempt to yet (see shared/schema.md). Unanswered questions count as
  // incorrect so a partial submission can't inflate its score.
  async submitQuizAnswers(
    id: string,
    request: SubmitQuizAnswersRequest,
  ): Promise<SubmitQuizAnswersResponse> {
    const gameExists = await this.gameRepo.existsBy({ id });

    if (!gameExists) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    const quizQuestions = await this.quizQuestionRepo.find({
      where: { gameId: id },
      order: { createdAt: 'ASC' },
    });

    const answersByQuestionId = new Map(
      request.answers.map((answer) => [
        answer.questionId,
        answer.selectedOption,
      ]),
    );

    const results = quizQuestions.map((question) => ({
      questionId: question.id,
      correct:
        answersByQuestionId.get(question.id) ===
        question.options[question.correctOptionIndex],
    }));

    return submitQuizAnswersResponseSchema.parse({
      results,
      score: results.filter((result) => result.correct).length,
      total: quizQuestions.length,
    });
  }
}
